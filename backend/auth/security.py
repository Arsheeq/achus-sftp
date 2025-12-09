from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database.db import get_db
from backend.models.user import User
from backend.models.file import FolderAssignment

security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return user

async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

def check_permission(user: User, permission: str, db: Session = None) -> bool:
    if user.is_admin:
        return True
    
    # Check role-based permissions first
    for role in user.roles:
        if permission == "read" and role.can_read:
            return True
        elif permission == "write" and role.can_write:
            return True
        elif permission == "copy" and role.can_copy:
            return True
        elif permission == "delete" and role.can_delete:
            return True
        elif permission == "share" and role.can_share:
            return True
    
    # For users without roles, check if they have folder assignments
    # This allows folder-assigned users to access their assigned folders
    if db is not None and permission == "read":
        has_folder_access = db.query(FolderAssignment).filter(
            FolderAssignment.user_id == user.id,
            FolderAssignment.can_read == True
        ).first()
        if has_folder_access:
            return True
    
    if db is not None and permission == "write":
        has_write_access = db.query(FolderAssignment).filter(
            FolderAssignment.user_id == user.id,
            FolderAssignment.can_write == True
        ).first()
        if has_write_access:
            return True
    
    if db is not None and permission == "delete":
        has_delete_access = db.query(FolderAssignment).filter(
            FolderAssignment.user_id == user.id,
            FolderAssignment.can_delete == True
        ).first()
        if has_delete_access:
            return True
    
    return False
