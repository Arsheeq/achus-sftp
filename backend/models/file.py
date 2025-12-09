from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database.db import Base

class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    s3_key = Column(String, unique=True, nullable=False)
    file_size = Column(BigInteger)
    content_type = Column(String)
    folder_path = Column(String, default="/")
    owner_id = Column(Integer, ForeignKey('users.id'))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="files")
    share_links = relationship("ShareLink", back_populates="file", cascade="all, delete-orphan")

class FolderAssignment(Base):
    __tablename__ = "folder_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    folder_path = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    can_read = Column(Boolean, default=True)
    can_write = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
    assigned_by = Column(Integer, ForeignKey('users.id'))
    assigned_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", foreign_keys=[user_id], backref="folder_assignments")
    assigner = relationship("User", foreign_keys=[assigned_by])

class ShareLink(Base):
    __tablename__ = "share_links"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey('files.id'))
    share_token = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('users.id'))
    
    file = relationship("File", back_populates="share_links")
