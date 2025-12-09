"""
Database initialization script
Creates initial admin user and default roles
"""

from sqlalchemy.orm import Session
from backend.database.db import SessionLocal, init_db
from backend.models.user import User, Role
from backend.auth.security import get_password_hash

def create_default_roles(db: Session):
    """Create default roles if they don't exist"""
    roles_data = [
        {
            "name": "Admin",
            "description": "Full access to all features",
            "can_read": True,
            "can_write": True,
            "can_copy": True,
            "can_delete": True,
            "can_share": True
        },
        {
            "name": "Editor",
            "description": "Can read, write, and share files",
            "can_read": True,
            "can_write": True,
            "can_copy": False,
            "can_delete": False,
            "can_share": True
        },
        {
            "name": "Viewer",
            "description": "Can only view files",
            "can_read": True,
            "can_write": False,
            "can_copy": False,
            "can_delete": False,
            "can_share": False
        },
        {
            "name": "Contributor",
            "description": "Can read, write, and copy files",
            "can_read": True,
            "can_write": True,
            "can_copy": True,
            "can_delete": False,
            "can_share": False
        }
    ]
    
    for role_data in roles_data:
        existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing_role:
            role = Role(**role_data)
            db.add(role)
            print(f"Created role: {role_data['name']}")
    
    db.commit()

def create_admin_user(db: Session):
    """Create default admin user if doesn't exist"""
    admin_username = "admin"
    admin_password = "admin123"  # Should be changed after first login
    
    existing_admin = db.query(User).filter(User.username == admin_username).first()
    if not existing_admin:
        admin_user = User(
            username=admin_username,
            hashed_password=get_password_hash(admin_password),
            email="admin@enlitedu.com",
            is_admin=True,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print(f"Created admin user: {admin_username} / {admin_password}")
        print("IMPORTANT: Please change the admin password after first login!")
    else:
        print("Admin user already exists")

def main():
    print("Initializing database...")
    init_db()
    print("Database tables created")
    
    db = SessionLocal()
    try:
        create_default_roles(db)
        create_admin_user(db)
        print("\nDatabase initialization complete!")
        print("\nDefault credentials:")
        print("Username: admin")
        print("Password: admin123")
        print("\nPlease change the password after first login!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
