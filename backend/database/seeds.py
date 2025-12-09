"""
Database seeding functions
Creates default roles and admin user if they don't exist
"""

from sqlalchemy.orm import Session
from backend.models.user import User, Role
from backend.auth.security import get_password_hash


def create_default_roles(db: Session):
    """Create default roles if they don't exist (idempotent)"""
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
    """Create default admin user if doesn't exist (idempotent)"""
    admin_username = "admin"
    admin_password = "admin123"
    
    existing_admin = db.query(User).filter(User.username == admin_username).first()
    if not existing_admin:
        admin_user = User(
            username=admin_username,
            hashed_password=get_password_hash(admin_password),
            email="admin@enlitedu.com",
            is_admin=True,
            is_active=True
        )
        
        # Assign Admin role if it exists
        admin_role = db.query(Role).filter(Role.name == "Admin").first()
        if admin_role:
            admin_user.roles.append(admin_role)
        
        db.add(admin_user)
        db.commit()
        print(f"✓ Created admin user: {admin_username}")
        print("  Default password: admin123")
        print("  ⚠️  IMPORTANT: Change the password after first login!")
    else:
        print("✓ Admin user already exists")


def ensure_seed_data(db: Session):
    """
    Ensure all seed data exists in the database (idempotent)
    This function can be called on every startup safely
    """
    try:
        print("Seeding database...")
        create_default_roles(db)
        create_admin_user(db)
        print("✓ Database seeding complete")
    except Exception as e:
        print(f"✗ Error seeding database: {e}")
        db.rollback()
        raise
