from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from backend.database.db import get_db
from backend.models.user import User
from backend.models.file import FolderAssignment
from backend.auth.security import get_current_admin_user, get_current_user

router = APIRouter(prefix="/api/folder-assignments", tags=["Folder Assignments"])

def normalize_folder_path(path: str) -> str:
    stripped = path.strip("/")
    return "/" + stripped if stripped else "/"

class AssignFolderRequest(BaseModel):
    folder_path: str
    user_id: int
    can_read: bool = True
    can_write: bool = False
    can_delete: bool = False

class FolderAssignmentResponse(BaseModel):
    id: int
    folder_path: str
    user_id: int
    username: str
    can_read: bool
    can_write: bool
    can_delete: bool

class BulkAssignRequest(BaseModel):
    folder_path: str
    user_ids: List[int]
    can_read: bool = True
    can_write: bool = False
    can_delete: bool = False

@router.post("/")
async def assign_folder(
    request: AssignFolderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    normalized_path = normalize_folder_path(request.folder_path)
    
    existing = db.query(FolderAssignment).filter(
        FolderAssignment.folder_path == normalized_path,
        FolderAssignment.user_id == request.user_id
    ).first()
    
    if existing:
        existing.can_read = request.can_read
        existing.can_write = request.can_write
        existing.can_delete = request.can_delete
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "folder_path": existing.folder_path,
            "user_id": existing.user_id,
            "username": user.username,
            "message": "Folder assignment updated"
        }
    
    new_assignment = FolderAssignment(
        folder_path=normalized_path,
        user_id=request.user_id,
        can_read=request.can_read,
        can_write=request.can_write,
        can_delete=request.can_delete,
        assigned_by=current_user.id
    )
    
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    
    return {
        "id": new_assignment.id,
        "folder_path": new_assignment.folder_path,
        "user_id": new_assignment.user_id,
        "username": user.username,
        "message": "Folder assigned successfully"
    }

@router.post("/bulk")
async def bulk_assign_folder(
    request: BulkAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    users = db.query(User).filter(User.id.in_(request.user_ids)).all()
    if not users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No users found"
        )
    
    normalized_path = normalize_folder_path(request.folder_path)
    
    results = []
    for user in users:
        existing = db.query(FolderAssignment).filter(
            FolderAssignment.folder_path == normalized_path,
            FolderAssignment.user_id == user.id
        ).first()
        
        if existing:
            existing.can_read = request.can_read
            existing.can_write = request.can_write
            existing.can_delete = request.can_delete
            results.append({"user_id": user.id, "username": user.username, "status": "updated"})
        else:
            new_assignment = FolderAssignment(
                folder_path=normalized_path,
                user_id=user.id,
                can_read=request.can_read,
                can_write=request.can_write,
                can_delete=request.can_delete,
                assigned_by=current_user.id
            )
            db.add(new_assignment)
            results.append({"user_id": user.id, "username": user.username, "status": "assigned"})
    
    db.commit()
    
    return {
        "folder_path": normalized_path,
        "assignments": results
    }

@router.get("/")
async def list_all_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    assignments = db.query(FolderAssignment).all()
    return [
        {
            "id": a.id,
            "folder_path": a.folder_path,
            "user_id": a.user_id,
            "username": a.user.username if a.user else "Unknown",
            "can_read": a.can_read,
            "can_write": a.can_write,
            "can_delete": a.can_delete,
            "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None
        }
        for a in assignments
    ]

@router.get("/folder/{folder_path:path}")
async def get_folder_assignments(
    folder_path: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    normalized_path = "/" + folder_path.strip("/") if folder_path else "/"
    assignments = db.query(FolderAssignment).filter(
        FolderAssignment.folder_path == normalized_path
    ).all()
    
    return [
        {
            "id": a.id,
            "folder_path": a.folder_path,
            "user_id": a.user_id,
            "username": a.user.username if a.user else "Unknown",
            "can_read": a.can_read,
            "can_write": a.can_write,
            "can_delete": a.can_delete
        }
        for a in assignments
    ]

@router.get("/user/{user_id}")
async def get_user_assignments(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    assignments = db.query(FolderAssignment).filter(
        FolderAssignment.user_id == user_id
    ).all()
    
    return [
        {
            "id": a.id,
            "folder_path": a.folder_path,
            "can_read": a.can_read,
            "can_write": a.can_write,
            "can_delete": a.can_delete
        }
        for a in assignments
    ]

@router.get("/my-folders")
async def get_my_folder_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.is_admin:
        return {"folders": [], "is_admin": True, "has_full_access": True}
    
    assignments = db.query(FolderAssignment).filter(
        FolderAssignment.user_id == current_user.id,
        FolderAssignment.can_read == True
    ).all()
    
    return {
        "folders": [
            {
                "folder_path": a.folder_path,
                "can_read": a.can_read,
                "can_write": a.can_write,
                "can_delete": a.can_delete
            }
            for a in assignments
        ],
        "is_admin": False,
        "has_full_access": False
    }

@router.delete("/{assignment_id}")
async def remove_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    assignment = db.query(FolderAssignment).filter(
        FolderAssignment.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    db.delete(assignment)
    db.commit()
    
    return {"message": "Assignment removed successfully"}

@router.delete("/folder/{folder_path:path}/user/{user_id}")
async def remove_user_from_folder(
    folder_path: str,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    normalized_path = "/" + folder_path.strip("/") if folder_path else "/"
    assignment = db.query(FolderAssignment).filter(
        FolderAssignment.folder_path == normalized_path,
        FolderAssignment.user_id == user_id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    db.delete(assignment)
    db.commit()
    
    return {"message": "User removed from folder successfully"}
