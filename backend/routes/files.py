from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid
from backend.database.db import get_db
from backend.models.user import User
from backend.models.file import File, ShareLink
from backend.auth.security import get_current_user, check_permission
from backend.services.s3_service import s3_service

router = APIRouter(prefix="/api/files", tags=["File Management"])

class UploadRequest(BaseModel):
    filename: str
    content_type: str
    folder_path: str = "/"

class FileResponse(BaseModel):
    id: int
    filename: str
    s3_key: str
    file_size: int | None
    content_type: str | None
    folder_path: str
    uploaded_at: datetime
    owner_username: str

class BulkDeleteRequest(BaseModel):
    file_ids: list[int]

class CopyFileRequest(BaseModel):
    destination_folder: str = "/"

class CreateFolderRequest(BaseModel):
    folder_name: str
    parent_folder: str = "/"

class ShareFileRequest(BaseModel):
    expires_in_hours: int = 24

@router.post("/upload-url")
async def get_upload_url(
    request: UploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_permission(current_user, "write"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to upload files"
        )
    
    # Generate S3 key without UUID prefix - use exact filename
    folder_prefix = request.folder_path.strip('/')
    s3_key = f"{folder_prefix}/{request.filename}" if folder_prefix else request.filename
    
    presigned_data = s3_service.generate_presigned_upload_url(
        s3_key,
        request.content_type
    )
    
    if not presigned_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate upload URL"
        )
    
    new_file = File(
        filename=request.filename,
        s3_key=s3_key,
        content_type=request.content_type,
        folder_path=request.folder_path,
        owner_id=current_user.id
    )
    
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    
    return {
        "file_id": new_file.id,
        "upload_url": presigned_data['url'],
        "upload_fields": presigned_data['fields'],
        "s3_key": s3_key
    }

@router.post("/{file_id}/complete-upload")
async def complete_upload(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Get file size from S3
    s3_objects = s3_service.list_objects(prefix=file.s3_key)
    for obj in s3_objects:
        if obj.get('Key') == file.s3_key:
            file.file_size = obj.get('Size')
            break
    
    db.commit()
    db.refresh(file)
    
    return {"message": "Upload completed", "file_size": file.file_size}

@router.get("/folders")
async def list_folders(
    folder_path: str = "/",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_permission(current_user, "read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view folders"
        )
    
    # Convert UI folder path to S3 prefix (root "/" becomes empty string "")
    prefix = folder_path.strip('/') + '/' if folder_path.strip('/') else ''
    s3_objects = s3_service.list_objects(prefix=prefix)
    
    folders = set()
    
    for obj in s3_objects:
        s3_key = obj.get('Key', '')
        relative_path = s3_key[len(prefix):] if prefix else s3_key
        
        # Check if this is a folder marker (ends with /)
        if s3_key.endswith('/'):
            folder_name = s3_key.rstrip('/').split('/')[-1] if s3_key.rstrip('/') else '/'
            if folder_name and len(relative_path.rstrip('/').split('/')) == 1:
                folders.add(folder_name)
            continue
        
        # Extract folder names from file paths (first level only)
        if '/' in relative_path:
            folder_name = relative_path.split('/')[0]
            if folder_name:
                folders.add(folder_name)
    
    # Convert folder named "/" to "slash" for display
    folder_list = []
    for folder in sorted(folders):
        display_name = "[slash]" if folder == "/" else folder
        actual_path = f"{folder_path.rstrip('/')}/{folder}"
        folder_list.append({"name": display_name, "path": actual_path})
    
    return folder_list

@router.get("/", include_in_schema=True)
@router.get("", include_in_schema=False)
async def list_files(
    folder_path: str = "/",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_permission(current_user, "read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view files"
        )
    
    # Get files from database for this folder
    db_files = db.query(File).filter(File.folder_path == folder_path).all()
    db_files_dict = {file.s3_key: file for file in db_files}
    
    # Convert UI folder path to S3 prefix
    # Root "/" becomes empty string ""
    # Other paths like "/arshak" become "arshak/"
    if folder_path == "/":
        prefix = ""
    else:
        prefix = folder_path.strip('/') + '/'
    
    # List S3 objects with delimiter to get folders
    # Returns items from both 'Contents' and 'CommonPrefixes'
    s3_objects = s3_service.list_objects(prefix=prefix, delimiter='/')
    
    files_result = []
    folders_result = set()
    seen_keys = set()
    
    # Process S3 objects
    for obj in s3_objects:
        # Check if this is a CommonPrefix (folder) - has 'Prefix' instead of 'Key'
        if 'Prefix' in obj and 'Key' not in obj:
            # This is a folder from CommonPrefixes
            folder_prefix = obj['Prefix']
            # Extract just the folder name (last part before the trailing /)
            folder_name = folder_prefix.rstrip('/').split('/')[-1]
            if folder_name:
                folders_result.add(folder_name)
            elif folder_prefix == '/':
                # Special case: top-level "/" folder
                folders_result.add('/')
            continue
        
        s3_key = obj.get('Key', '')
        
        # Skip empty keys
        if not s3_key:
            continue
        
        # Skip .keep sentinel files
        if s3_key.endswith('/.keep') or s3_key == '.keep':
            continue
        
        # Get relative path within current folder
        relative_path = s3_key[len(prefix):] if prefix else s3_key
        
        # If it's a folder marker object (ends with /), skip it
        # (These are typically handled by CommonPrefixes)
        if s3_key.endswith('/'):
            continue
        
        # With delimiter, files in subfolders should not appear here
        # But if they do, skip them (they belong in a subfolder)
        if '/' in relative_path:
            continue
        
        # This is a file in the current directory
        seen_keys.add(s3_key)
        
        # Check if we have DB record for this file
        if s3_key in db_files_dict:
            db_file = db_files_dict[s3_key]
            files_result.append({
                "id": db_file.id,
                "filename": db_file.filename,
                "s3_key": s3_key,
                "file_size": obj.get('Size', db_file.file_size),
                "content_type": db_file.content_type,
                "folder_path": folder_path,
                "uploaded_at": db_file.uploaded_at.isoformat(),
                "owner_username": db_file.owner.username if db_file.owner else "Unknown",
                "type": "file"
            })
        else:
            # File exists in S3 but not in DB - add it anyway
            filename = relative_path
            files_result.append({
                "id": None,
                "filename": filename,
                "s3_key": s3_key,
                "file_size": obj.get('Size'),
                "content_type": None,
                "folder_path": folder_path,
                "uploaded_at": obj.get('LastModified').isoformat() if obj.get('LastModified') else None,
                "owner_username": "External",
                "type": "file"
            })
    
    # Add DB files that might not be in S3 anymore (edge case)
    for s3_key, db_file in db_files_dict.items():
        if s3_key not in seen_keys:
            files_result.append({
                "id": db_file.id,
                "filename": db_file.filename,
                "s3_key": s3_key,
                "file_size": db_file.file_size,
                "content_type": db_file.content_type,
                "folder_path": folder_path,
                "uploaded_at": db_file.uploaded_at.isoformat(),
                "owner_username": db_file.owner.username if db_file.owner else "Unknown",
                "type": "file"
            })
    
    # Add folders to the result
    for folder_name in sorted(folders_result):
        # Calculate the actual folder path for navigation
        if folder_name == '/':
            # Special handling for "/" folder at root
            display_name = "/"
            actual_folder_path = "/"
        else:
            display_name = folder_name
            if folder_path == "/":
                actual_folder_path = f"/{folder_name}"
            else:
                actual_folder_path = f"{folder_path.rstrip('/')}/{folder_name}"
        
        # Insert folders at the beginning
        files_result.insert(0, {
            "id": None,
            "filename": display_name,
            "s3_key": None,
            "file_size": None,
            "content_type": None,
            "folder_path": actual_folder_path,
            "uploaded_at": None,
            "owner_username": None,
            "type": "folder"
        })
    
    return files_result

@router.get("/{file_id}/download-url")
async def get_download_url(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_permission(current_user, "read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to download files"
        )
    
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    download_url = s3_service.generate_presigned_download_url(file.s3_key)
    
    if not download_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate download URL"
        )
    
    return {
        "download_url": download_url,
        "filename": file.filename
    }

@router.get("/download-by-key/{s3_key:path}")
async def get_download_url_by_key(
    s3_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_permission(current_user, "read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to download files"
        )
    
    download_url = s3_service.generate_presigned_download_url(s3_key)
    
    if not download_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate download URL"
        )
    
    # Extract filename from S3 key
    filename = s3_key.split('/')[-1]
    
    return {
        "download_url": download_url,
        "filename": filename
    }

@router.post("/{file_id}/copy")
async def copy_file(
    file_id: int,
    request: CopyFileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_permission(current_user, "copy"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to copy files"
        )
    
    original_file = db.query(File).filter(File.id == file_id).first()
    if not original_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    new_s3_key = f"{request.destination_folder.strip('/')}/{original_file.filename}"
    
    success = s3_service.copy_object(original_file.s3_key, new_s3_key)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to copy file in S3"
        )
    
    new_file = File(
        filename=original_file.filename,
        s3_key=new_s3_key,
        file_size=original_file.file_size,
        content_type=original_file.content_type,
        folder_path=request.destination_folder,
        owner_id=current_user.id
    )
    
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    
    return {
        "id": new_file.id,
        "message": "File copied successfully"
    }

@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_permission(current_user, "delete"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete files"
        )
    
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    s3_service.delete_object(file.s3_key)
    
    db.delete(file)
    db.commit()
    
    return {"message": "File deleted successfully"}

@router.delete("/by-key/{s3_key:path}")
async def delete_file_by_key(
    s3_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_permission(current_user, "delete"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete files"
        )
    
    # Delete from S3
    success = s3_service.delete_object(s3_key)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file from S3"
        )
    
    # Also delete from DB if it exists
    file = db.query(File).filter(File.s3_key == s3_key).first()
    if file:
        db.delete(file)
        db.commit()
    
    return {"message": "File deleted successfully"}

@router.post("/bulk-delete")
async def bulk_delete_files(
    request: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_permission(current_user, "delete"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete files"
        )
    
    files = db.query(File).filter(File.id.in_(request.file_ids)).all()
    
    if not files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No files found"
        )
    
    s3_keys = [file.s3_key for file in files]
    s3_service.delete_multiple_objects(s3_keys)
    
    for file in files:
        db.delete(file)
    
    db.commit()
    
    return {"message": f"Deleted {len(files)} files successfully"}

@router.post("/create-folder")
async def create_folder(
    request: CreateFolderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_permission(current_user, "write"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create folders"
        )
    
    # Create folder marker in S3 (folder + .keep file)
    parent_prefix = request.parent_folder.strip('/')
    folder_path = f"{parent_prefix}/{request.folder_name}" if parent_prefix else request.folder_name
    folder_marker_key = f"{folder_path}/.keep"
    
    # Upload empty .keep file to create the folder
    success = s3_service.create_folder(folder_marker_key)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create folder in S3"
        )
    
    return {
        "message": "Folder created successfully",
        "folder_path": f"/{folder_path}"
    }

@router.post("/{file_id}/share")
async def create_share_link(
    file_id: int,
    request: ShareFileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_permission(current_user, "share"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to share files"
        )
    
    # Enforce maximum expiry of 12 hours
    expires_in_hours = min(request.expires_in_hours, 12)
    
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Generate S3 presigned URL directly
    expiration_seconds = expires_in_hours * 3600
    presigned_url = s3_service.generate_presigned_download_url(file.s3_key, expiration=expiration_seconds)
    
    if not presigned_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate share link"
        )
    
    expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
    
    return {
        "share_url": presigned_url,
        "expires_at": expires_at.isoformat(),
        "expires_in_hours": expires_in_hours
    }

@router.get("/share/{share_token}")
async def get_shared_file(
    share_token: str,
    db: Session = Depends(get_db)
):
    share_link = db.query(ShareLink).filter(ShareLink.share_token == share_token).first()
    
    if not share_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found"
        )
    
    if share_link.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Share link has expired"
        )
    
    file = share_link.file
    download_url = s3_service.generate_presigned_download_url(file.s3_key, expiration=3600)
    
    return {
        "filename": file.filename,
        "file_size": file.file_size,
        "content_type": file.content_type,
        "download_url": download_url
    }
