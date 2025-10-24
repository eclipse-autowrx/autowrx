# Route Organization

This directory contains the API routes organized by functional groups:

## 📁 user-management/
Routes related to user authentication, authorization, and asset management:
- `/auth` - Authentication (login, logout, register, SSO, password reset)
- `/users` - User management (CRUD operations, self-management)
- `/assets` - Asset management (create, read, update, delete assets)
- `/permissions` - Permission and role management

## 📁 vehicle-data/
Routes related to vehicle data models, prototypes, and APIs:
- `/prototypes` - Vehicle prototype management
- `/models` - Vehicle model management
- `/apis` - VSS API management
- `/extendedApis` - Extended API management

## 📁 content/
Routes related to user-generated content and interactions:
- `/discussions` - Discussion threads and comments
- `/feedbacks` - User feedback and ratings

## 📁 system/
Routes related to system functionality and utilities:
- `/search` - Search functionality across the platform
- `/change-logs` - System change logs and audit trails
- `/file` - File upload and management

## Usage

Each folder contains an `index.js` file that exports the grouped routes. The main `index.js` file imports and mounts all route groups under the `/v2` base path.

All routes maintain their original API endpoints - only the file organization has changed.
