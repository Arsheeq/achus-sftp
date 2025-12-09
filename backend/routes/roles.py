from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database.db import get_db
from backend.models.user import User, Role
from backend.auth.security import get_current_admin_user

router = APIRouter(prefix="/api/roles", tags=["Role Management"])

class CreateRoleRequest(BaseModel):
    name: str
    description: str | None = None
    can_read: bool = True
    can_write: bool = False
    can_copy: bool = False
    can_delete: bool = False
    can_share: bool = False

class UpdateRoleRequest(BaseModel):
    description: str | None = None
    can_read: bool | None = None
    can_write: bool | None = None
    can_copy: bool | None = None
    can_delete: bool | None = None
    can_share: bool | None = None

@router.post("/")
async def create_role(
    request: CreateRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    existing_role = db.query(Role).filter(Role.name == request.name).first()
    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role name already exists"
        )
    
    new_role = Role(
        name=request.name,
        description=request.description,
        can_read=request.can_read,
        can_write=request.can_write,
        can_copy=request.can_copy,
        can_delete=request.can_delete,
        can_share=request.can_share
    )
    
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    
    return {
        "id": new_role.id,
        "name": new_role.name,
        "description": new_role.description,
        "can_read": new_role.can_read,
        "can_write": new_role.can_write,
        "can_copy": new_role.can_copy,
        "can_delete": new_role.can_delete,
        "can_share": new_role.can_share
    }

@router.get("/", include_in_schema=True)
@router.get("", include_in_schema=False)
async def list_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    return [
        {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "can_read": role.can_read,
            "can_write": role.can_write,
            "can_copy": role.can_copy,
            "can_delete": role.can_delete,
            "can_share": role.can_share
        }
        for role in roles
    ]

@router.put("/{role_id}")
async def update_role(
    role_id: int,
    request: UpdateRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    if request.description is not None:
        role.description = request.description
    if request.can_read is not None:
        role.can_read = request.can_read
    if request.can_write is not None:
        role.can_write = request.can_write
    if request.can_copy is not None:
        role.can_copy = request.can_copy
    if request.can_delete is not None:
        role.can_delete = request.can_delete
    if request.can_share is not None:
        role.can_share = request.can_share
    
    db.commit()
    db.refresh(role)
    
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "can_read": role.can_read,
        "can_write": role.can_write,
        "can_copy": role.can_copy,
        "can_delete": role.can_delete,
        "can_share": role.can_share
    }

@router.delete("/{role_id}")
async def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    db.delete(role)
    db.commit()
    
    return {"message": "Role deleted successfully"}
