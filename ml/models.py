"""
Model zoo for the heterogeneous job-recommendation GNN & Graph Transformer.

B0  : 2-node GraphSAGE baseline (user <-> job, applies edges only)
B1  : 6-node heterogeneous GraphSAGE (adds experience/location/salary/degree nodes)
B2  : 6-node heterogeneous GATv2 (attention per relation)
B3  : B2 + dynamic relation weights  w = sigmoid(g_r(p_u, phi(u,j)))
HGT : 6-node Heterogeneous Graph Transformer (HGTConv with multi-head attention)
B4  : B3 / HGT + constraint filter + multi-criteria re-ranking (see rerank.py)
"""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GATv2Conv, HeteroConv, HGTConv, SAGEConv

APPLIES = ("user", "applies", "job")


class DynamicWeight(nn.Module):
    """g_r: maps [p_u ; phi(u,j)] -> scalar edge weight in (0,1)."""

    def __init__(self, p_dim: int = 3, phi_dim: int = 4, hidden: int = 16):
        super().__init__()
        self.mlp = nn.Sequential(
            nn.Linear(p_dim + phi_dim, hidden),
            nn.ReLU(),
            nn.Linear(hidden, 1),
        )

    def forward(self, p_u: torch.Tensor, phi: torch.Tensor) -> torch.Tensor:
        x = torch.cat([p_u, phi], dim=-1)
        return torch.sigmoid(self.mlp(x)).squeeze(-1)


class HeteroEncoder(nn.Module):
    def __init__(self, node_feat_dims: Dict[str, int], edge_types: List[Tuple[str, str, str]],
                 conv: str = "sage", dynamic: bool = False,
                 hidden: int = 128, out: int = 64, dropout: float = 0.3, num_layers: int = 2):
        super().__init__()
        self.dropout = dropout
        self.dynamic = dynamic
        self.conv_name = conv.lower()
        self.node_feat_dims = node_feat_dims
        self.edge_types = edge_types

        self.proj = nn.ModuleDict({k: nn.Linear(d, hidden) for k, d in node_feat_dims.items()})
        self.out_proj = nn.ModuleDict({k: nn.Linear(hidden, out) for k in node_feat_dims.keys()})

        self.convs = nn.ModuleList()
        for i in range(num_layers):
            in_ch = hidden if i == 0 else hidden
            out_ch = hidden if i < num_layers - 1 else out
            self.convs.append(self._build_conv(edge_types, self.conv_name, dynamic, in_ch, out_ch))

        if dynamic:
            self.dynamic_weight = DynamicWeight()
            # registered in the parent model before training
            self.register_buffer("p_u", torch.zeros(1, 3), persistent=False)

    def _build_conv(self, edge_types, conv, dynamic, in_ch, out_ch):
        if conv == "hgt":
            metadata = (list(self.node_feat_dims.keys()), edge_types)
            return HGTConv(in_channels=in_ch, out_channels=out_ch, metadata=metadata, heads=2)

        convs = {}
        for et in edge_types:
            if conv == "gatv2":
                edge_dim = 1 if (dynamic and et == APPLIES) else None
                convs[et] = GATv2Conv((-1, -1), out_ch, heads=1, concat=True,
                                      edge_dim=edge_dim, add_self_loops=False)
            else:
                convs[et] = SAGEConv((-1, -1), out_ch)
        return HeteroConv(convs, aggr="mean")

    def set_p_u(self, p_u: torch.Tensor):
        self.p_u = p_u

    def forward(self, x_dict, edge_index_dict, edge_attr_dict=None):
        proj = {k: F.relu(self.proj[k](v)) for k, v in x_dict.items()}
        x = proj  # hidden dim

        # dynamic weight for the applies edges (computed once, reused across layers)
        dyn_attr = None
        if self.dynamic and edge_attr_dict is not None and APPLIES in edge_index_dict:
            ei = edge_index_dict[APPLIES]
            p = self.p_u[ei[0]]
            phi = edge_attr_dict[APPLIES]
            w = self.dynamic_weight(p, phi)
            dyn_attr = dict(edge_attr_dict)
            dyn_attr[APPLIES] = w.unsqueeze(-1)

        n = len(self.convs)
        for i, conv in enumerate(self.convs):
            if self.conv_name == "hgt":
                out = conv(x, edge_index_dict)
            elif dyn_attr is not None:
                out = conv(x, edge_index_dict, edge_attr_dict=dyn_attr)
            else:
                out = conv(x, edge_index_dict)

            x_new = {}
            for k in x:
                if k in out and out[k] is not None:
                    x_new[k] = F.relu(out[k])
                else:
                    # fallback for isolated nodes
                    x_new[k] = x[k] if i < n - 1 else self.out_proj[k](x[k])
            x = {k: F.dropout(v, p=self.dropout, training=self.training) for k, v in x_new.items()}

        return x


class EdgePredictor(nn.Module):
    def __init__(self, in_channels: int = 64):
        super().__init__()
        self.lin = nn.Sequential(
            nn.Linear(in_channels * 2, in_channels),
            nn.ReLU(),
            nn.Linear(in_channels, 1),
        )

    def forward(self, z_user, z_job, edge_label_index):
        u = z_user[edge_label_index[0]]
        j = z_job[edge_label_index[1]]
        return self.lin(torch.cat([u, j], dim=-1)).squeeze(-1)


class JobRecModel(nn.Module):
    def __init__(self, node_feat_dims, edge_types, conv="sage", dynamic=False,
                 hidden=128, out=64, dropout=0.3, num_layers=2):
        super().__init__()
        self.encoder = HeteroEncoder(node_feat_dims, edge_types, conv, dynamic,
                                     hidden, out, dropout, num_layers)
        self.decoder = EdgePredictor(out)

    def forward(self, x_dict, edge_index_dict, edge_label_index, edge_attr_dict=None):
        z = self.encoder(x_dict, edge_index_dict, edge_attr_dict)
        return self.decoder(z["user"], z["job"], edge_label_index)

    def encode(self, x_dict, edge_index_dict, edge_attr_dict=None):
        return self.encoder(x_dict, edge_index_dict, edge_attr_dict)


MODEL_SPECS = {
    "B0": dict(conv="sage", dynamic=False, six_node=False),
    "B1": dict(conv="sage", dynamic=False, six_node=True),
    "B2": dict(conv="gatv2", dynamic=False, six_node=True),
    "B3": dict(conv="gatv2", dynamic=True, six_node=True),
    "HGT": dict(conv="hgt", dynamic=True, six_node=True),
    # B4 == B3 / HGT model + rerank (handled in rerank.py)
}


def build_model(model_id: str, node_feat_dims: Dict[str, int],
                edge_types: List[Tuple[str, str, str]], hidden=128, out=64, dropout=0.3):
    spec = MODEL_SPECS[model_id]
    return JobRecModel(node_feat_dims, edge_types, conv=spec["conv"], dynamic=spec["dynamic"],
                       hidden=hidden, out=out, dropout=dropout, num_layers=2)
