# EnlitEDU SFTP - Secure File Transfer & Storage Platform

## Overview

EnlitEDU SFTP is a secure cloud-based file storage and transfer platform that enables users to upload, manage, and share files with enterprise-grade security. The application provides role-based access control, AWS S3 integration for reliable storage, and features like file sharing with expiration, file operations (copy, delete, download), comprehensive folder management, and user management for administrators. The platform displays ALL S3 bucket contents (not just app-uploaded files) and supports folder creation, navigation, and breadcrumb trails.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript and Vite for fast development and optimized production builds.

**UI Component System**: Built on shadcn/ui components (Radix UI primitives) with TailwindCSS for styling, following Material Design 3 principles adapted for file management applications. The design emphasizes clarity, efficiency, and trust through consistent patterns and professional appearance.

**State Management**: 
- React Query (@tanstack/react-query) for server state management, data fetching, and caching
- Local React state for UI interactions (view modes, search, selections)
- Session-based authentication with tokens stored in localStorage

**Routing**: Wouter for lightweight client-side routing with protected routes for authenticated users and admin-only sections.

**Key Design Decisions**:
- Grid and list view modes for file browsing flexibility
- Real-time upload progress tracking with visual feedback
- File type detection with appropriate icons and colors
- Folder navigation with breadcrumb trails for hierarchical browsing
- Hybrid file listing showing all S3 bucket files (both tracked and external)
- Folder icons and clickable navigation for intuitive folder browsing
- EnlitEDU branding throughout the application
- Responsive design with mobile-first approach
- Typography using Inter font for clarity and SF Mono for technical data

### Backend Architecture

**Framework**: FastAPI (Python) providing high-performance async API endpoints with automatic OpenAPI documentation.

**Database ORM**: SQLAlchemy with PostgreSQL for relational data persistence. Connection pooling configured with pre-ping validation and automatic connection recycling to handle SSL connection issues reliably.

**Authentication & Authorization**:
- JWT (JSON Web Tokens) for stateless authentication using python-jose
- BCrypt password hashing via bcryptjs for secure credential storage
- HTTP Bearer token scheme for API authentication
- Role-based access control (RBAC) with granular permissions (read, write, copy, delete, share)
- Four default roles: Admin, Editor, Viewer, Contributor

**API Design**:
- RESTful endpoints organized by domain (auth, users, roles, files)
- CORS middleware configured for cross-origin requests
- Structured error handling with appropriate HTTP status codes
- Request/response validation using Pydantic models

**Build & Deployment**:
- Frontend built with Vite, backend bundled with esbuild
- Single server process using Uvicorn (ASGI server) serving both API and static frontend
- Production mode serves pre-built React SPA from FastAPI static file routes

### Data Storage

**Primary Database**: PostgreSQL for structured data including users, roles, file metadata, and share links.

**Database Schema**:
- `users` table with username, email, hashed password, admin flag, and audit fields
- `roles` table defining permission sets (can_read, can_write, can_copy, can_delete, can_share)
- `user_roles` junction table for many-to-many user-role relationships
- `files` table storing file metadata (filename, S3 key, size, content type, folder path, owner)
- `share_links` table for temporary file sharing with tokens and expiration

**File Storage**: AWS S3 for scalable object storage with presigned URLs for secure direct client-to-S3 uploads and downloads.

**Key Design Decisions**:
- File content stored in S3, metadata in PostgreSQL for performance and cost optimization
- Hybrid file listing: combines S3 bucket objects with database metadata to show ALL files (not just app-uploaded ones)
- External S3 files (without database records) are marked as "External" and support download-only
- Folder management using `.keep` sentinel files to mark empty folders in S3
- Sentinel files filtered from display but contribute to folder structure detection
- Presigned URLs eliminate backend bottleneck for file transfers
- Cascade delete on share_links when parent file is deleted
- Connection pooling to prevent SSL timeout issues with serverless databases

### External Dependencies

**Cloud Services**:
- AWS S3 for file storage and retrieval
- AWS SDK (@aws-sdk/client-s3, @aws-sdk/s3-presigned-post, @aws-sdk/s3-request-presigner) for S3 operations

**Database**:
- PostgreSQL (recommended: Neon serverless or similar)
- Connection via DATABASE_URL environment variable

**Authentication**:
- JWT tokens with configurable expiration (default 24 hours)
- SECRET_KEY for token signing (must be set in production)

**Frontend Libraries**:
- Radix UI primitives for accessible component foundation
- React Query for efficient data synchronization
- React Dropzone for drag-and-drop file uploads
- Lucide React for consistent iconography

**Development Tools**:
- TypeScript for type safety across frontend and shared schemas
- ESLint and Prettier for code quality (implied by tooling setup)
- Replit-specific plugins for development experience (@replit/vite-plugin-*)

**Required Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT signing key
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `S3_BUCKET_NAME` - S3 bucket for file storage

**API Integration Pattern**: Frontend uses a centralized API client with fetch-based requests, credential inclusion for session cookies, and standardized error handling. The queryClient provides caching and automatic refetching with configurable unauthorized behavior.

## Recent Changes

### October 30, 2025
- **GitHub Import Complete**: Successfully imported and configured EnlitEDU SFTP application for Replit environment
- **Environment Setup**: Configured all required secrets (DATABASE_URL, SECRET_KEY, AWS credentials, S3_BUCKET_NAME)
- **Dependencies**: Installed Node.js and Python dependencies via npm and uv
- **Workflow Configuration**: Set up "EnlitEDU SFTP App" workflow running on port 5000 with webview output
- **Database Initialization**: Database tables created and seeded with default admin user (admin/admin123)
- **Frontend Build**: Vite configured with allowedHosts: true for Replit proxy compatibility
- **Backend Server**: FastAPI running on 0.0.0.0:5000 serving both API and built React frontend
- **Header Component**: Fixed logout functionality to use api.logout() method and redirect to /login
- **Deployment Config**: Configured autoscale deployment with proper build and run commands
- **Hybrid File Listing**: Implemented complete S3 bucket visibility showing all files (both database-tracked and external S3 files)
- **Folder Management**: Added folder creation, viewing, and navigation with breadcrumb trails
- **Folder Sentinels**: Implemented `.keep` file strategy to mark empty folders in S3 while filtering them from user view
- **Admin Panel Fix**: Resolved 307 redirect errors by adding both "/" and "" route variants for users and roles endpoints
- **Branding Update**: Added EnlitEDU logo throughout application (landing page, login, dashboard)
- **UI Enhancements**: Folder icons, clickable folder cards, and improved visual hierarchy for file/folder distinction
- **User Management**: Admin panel includes role assignment during user creation with multi-select checkboxes
- **Share Links**: 12-hour maximum expiration enforced on file sharing with S3 presigned URLs (not Replit URLs)
- **S3 Listing Fix (v2)**: Fixed S3 service to properly return CommonPrefixes with 'Prefix' field intact, allowing folder detection logic to distinguish between folders and files. All S3 folders now display correctly at root and subfolder levels.
- **Edit User Feature**: Added Edit User functionality in Admin Panel with role assignment checkboxes for existing users, allowing admins to update user roles and email
- **Logo Display Fix**: Converted logo references from public folder paths to Vite asset imports (`import enlitEduLogo from '../assets/enlitedu-logo.png'`). Vite now properly processes and hashes the logo for reliable browser display. Applied to Dashboard, LoginPage, and Landing pages.
- **Upload Refresh Fix**: Resolved file upload UI refresh issue (root cause was S3 listing bug not showing newly uploaded files)
- **File Naming Convention**: UUID prefixes in S3 keys (e.g., `{uuid}_{filename}`) are intentional to prevent filename conflicts. Users see and download files with original names; UUID only exists in backend S3 storage.
- **Landing Page Redesign**: Complete UI overhaul matching user-provided design mockups with hero section (gradient heading, CTA buttons), 4-feature grid (Easy Upload, Secure Storage, Fast Access, Easy Sharing), and bottom CTA section
- **Layout Component System**: Created reusable Layout, Header, and Footer components for consistent branding across all pages (landing, login, dashboard, admin panel)
- **Routing Update**: Separated marketing (/) from authentication (/login) to provide clear user journey from landing page to login to dashboard
- **Auth Flow Fix**: Corrected all logout and session-expired redirects to point to /login instead of / to maintain proper authentication flow without confusing users with marketing content
- **Header Authentication Fix**: Updated Header component to properly fetch user data using JWT token from localStorage via api.getCurrentUser() instead of session cookies
- **Header Visibility Control**: Added conditional rendering so header user info (welcome message, username, buttons) only displays on authenticated pages, not on login/landing pages
- **Admin Button Logic Fix**: Corrected admin detection to use `user?.is_admin === true` instead of non-existent `user?.role === 'admin'`, ensuring only actual admin users see the Admin button
- **Login Form Enhancement**: Added autocomplete="username" and autocomplete="current-password" attributes to login form inputs for better browser compatibility
- **Upload Success Message**: Fixed FileUploadDialog to show "Completed" in green text when file upload succeeds, replacing generic error messages