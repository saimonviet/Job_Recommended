from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# Fake DB tạm
users = []

class User(BaseModel):
    username: str
    email: str

@app.get("/users")
def get_users():
    return users

@app.post("/users")
def create_user(user: User):
    users.append(user)
    return {"message": "created"}