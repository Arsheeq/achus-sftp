from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database.db import get_db
from backend.models.user import User
from backend.auth.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str | None
    is_admin: bool
    is_active: bool
    roles: list[dict]

    class Config:
        from_attributes = True

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    access_token = create_access_token(data={"sub": user.username})
    
    roles = [
        {
            "id": role.id,
            "name": role.name,
            "can_read": role.can_read,
            "can_write": role.can_write,
            "can_copy": role.can_copy,
            "can_delete": role.can_delete,
            "can_share": role.can_share
        }
        for role in user.roles
    ]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin,
            "roles": roles
        }
    }

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    roles = [
        {
            "id": role.id,
            "name": role.name,
            "can_read": role.can_read,
            "can_write": role.can_write,
            "can_copy": role.can_copy,
            "can_delete": role.can_delete,
            "can_share": role.can_share
        }
        for role in current_user.roles
    ]
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_admin": current_user.is_admin,
        "is_active": current_user.is_active,
        "roles": roles
    }
