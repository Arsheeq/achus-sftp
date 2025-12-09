# EnlitEDU SFTP Application

A secure file transfer and management system built with FastAPI (Python) and React.

## Features

- **User Authentication** - Secure login system with JWT tokens
- **Role-Based Access Control** - Admin, Editor, Viewer, and Contributor roles
- **File Management** - Upload, download, copy, and delete files
- **S3 Integration** - Secure file storage using AWS S3
- **File Sharing** - Generate temporary share links with expiration
- **Admin Panel** - Manage users and roles

## Technology Stack

### Backend
- FastAPI (Python)
- PostgreSQL
- SQLAlchemy ORM
- AWS S3 for file storage
- JWT authentication

### Frontend
- React with TypeScript
- Vite
- TailwindCSS
- shadcn/ui components
- React Query for data fetching

## Setup

### Prerequisites
- Python 3.11+
- PostgreSQL database
- AWS S3 bucket and credentials

### Environment Variables

Set the following environment variables in your Repl Secrets:

- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `S3_BUCKET_NAME` - S3 bucket name

### Running the Application

1. **Initialize the database**:
   ```bash
   python backend/init_db.py
   ```

2. **Start the application**:
   The application will start automatically when you click the Run button, or run:
   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 5000 --reload
   ```

3. **Access the application**:
   - Open your browser to the Replit web view
   - Default admin credentials:
     - Username: `admin`
     - Password: `admin123`

   ⚠️ **IMPORTANT**: Change the admin password after first login!

## Default Roles

The system comes with 4 pre-configured roles:

- **Admin** - Full access to all features
- **Editor** - Can read, write, and share files
- **Viewer** - Can only view files
- **Contributor** - Can read, write, and copy files

## API Documentation

Once the backend is running, visit `/docs` for interactive API documentation powered by FastAPI's built-in Swagger UI.

## Admin Features

As an admin user, you can:

- Create and manage user accounts
- Assign roles to users
- View all users and their permissions
- Delete users (except yourself)

## File Operations

### For Users with Write Permission:
- Upload files via drag-and-drop or file picker
- Files are securely stored in S3 with unique keys

### For Users with Copy Permission:
- Copy files to different folders
- Duplicate files within the same folder

### For Users with Delete Permission:
- Delete individual files
- Bulk delete multiple files

### For Users with Share Permission:
- Generate temporary share links
- Set expiration time (1-168 hours)
- Set maximum download limits