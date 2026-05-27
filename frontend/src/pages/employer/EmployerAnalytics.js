import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployerSideNavBar from "../../components/EmployerSideNavBar";
import { getEmployerToken } from "../../utils/authStorage";
import EmployerTopNavBar from "../../components/EmployerTopNavBar";
import API from "../../services/api";
import { formatSalaryRange } from "../../utils/dataFormatter";

const ANALYTICS_CACHE_KEY_PREFIX = "employer_analytics_cache";
const ANALYTICS_CACHE_DURATION = 10 * 60 * 1000;

const getAnalyticsCacheKey = (token) => `${ANALYTICS_CACHE_KEY_PREFIX}:${token || "anonymous"}`;

const readAnalyticsCache = (token) => {
  try {
    const raw = sessionStorage.getItem(getAnalyticsCacheKey(token));
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > ANALYTICS_CACHE_DURATION) {
      sessionStorage.removeItem(getAnalyticsCacheKey(token));
      return null;
    }

    return cached.data || null;
  } catch {
    return null;
  }
};

const writeAnalyticsCache = (token, data) => {
  try {
    sessionStorage.setItem(
      getAnalyticsCacheKey(token),
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // ignore storage quota errors
  }
};

const STATUS_COLOR = {
  accepted: "bg-emerald-500",
  interview: "bg-blue-500",
  reviewed: "bg-blue-500",
  pending: "bg-blue-500",
  rejected: "bg-red-500",
};

function EmployerAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState({
    kpis: {
      applications_growth_pct: 0,
      applications_growth_count: 0,
      processing_rate_pct: 0,
      avg_hiring_days: null,
      avg_salary: null,
    },
    monthly_applications: { labels: [], values: [] },
    status_distribution: [],
    top_positions: [],
    top_companies: [],
  });

  useEffect(() => {
    const token = getEmployerToken();
    if (!token) {
      navigate('/login-employer');
      return;
    }

    let cancelled = false;

    const cached = readAnalyticsCache(token);
    if (cached) {
      setAnalytics(cached);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const loadAnalytics = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await API.get("/employer/analytics");
        if (!cancelled) {
          const nextAnalytics = response.data || {};
          setAnalytics(nextAnalytics);
          writeAnalyticsCache(token, nextAnalytics);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || "Không tải được dữ liệu phân tích.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const growthPct = analytics?.kpis?.applications_growth_pct ?? 0;
  const growthCount = analytics?.kpis?.applications_growth_count ?? 0;
  const processingRate = analytics?.kpis?.processing_rate_pct ?? 0;
  const avgHiringDays = analytics?.kpis?.avg_hiring_days;
  const avgSalary = analytics?.kpis?.avg_salary;

  const monthlyLabels = analytics?.monthly_applications?.labels || [];
  const monthlyValues = analytics?.monthly_applications?.values || [];
  const maxMonthlyValue = Math.max(...monthlyValues, 1);
  const monthlyChartData = monthlyLabels.map((label, index) => {
    const value = monthlyValues[index] || 0;
    const height = Math.max(6, Math.round((value / maxMonthlyValue) * 100));
    return { label, value, height };
  });

  const statusDistribution = analytics?.status_distribution || [];

  const avgSalaryText = useMemo(() => {
    if (!avgSalary) return "Chưa có";
    return formatSalaryRange(avgSalary, avgSalary);
  }, [avgSalary]);

  const kpiCards = [
    {
      icon: "trending_up",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      badgeBg: "bg-green-50 dark:bg-green-900/30",
      badgeColor: "text-green-600 dark:text-green-400",
      badge: `${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(1)}%`,
      title: "Tăng trưởng ứng viên (30 ngày)",
      value: `${growthCount >= 0 ? "+" : ""}${growthCount}`,
    },
    {
      icon: "task_alt",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      badgeBg: "bg-blue-50 dark:bg-blue-900/30",
      badgeColor: "text-blue-600 dark:text-blue-400",
      title: "Tỷ lệ xử lý hồ sơ",
      value: `${processingRate.toFixed(1)}%`,
    },
    {
      icon: "attach_money",
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
      badgeBg: "bg-orange-50 dark:bg-orange-900/30",
      badgeColor: "text-orange-600 dark:text-orange-400",
      title: "Mức lương trung bình",
      value: avgSalaryText,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <EmployerSideNavBar />
      <EmployerTopNavBar />

      <main className="ml-64 w-full">

        <div className="pt-32 p-8 max-w-7xl mx-auto">


          {error && (
            <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          {loading && (
            <div className="mb-6 rounded-lg border border-slate-300 bg-white p-4 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Đang tải dữ liệu thống kê...
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {kpiCards.map((card) => (
              <div key={card.title} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4 gap-2">
                  <div className={`p-3 rounded-lg ${card.iconBg} ${card.iconColor}`}>
                    <span className="material-symbols-outlined text-xl">{card.icon}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${card.badgeColor} ${card.badgeBg}`}>
                    {card.badge}
                  </span>
                </div>
                <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">{card.title}</h3>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="gap-8">

            {/* Application Status Distribution */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm">

              <div className="space-y-4">
                {statusDistribution.length > 0 ? statusDistribution.map((item) => (
                  <div key={item.status}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.label}</p>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.value}% ({item.count})</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className={`${STATUS_COLOR[item.status] || "bg-slate-500"} h-full transition-all`} style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có dữ liệu trạng thái ứng tuyển.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EmployerAnalytics;
