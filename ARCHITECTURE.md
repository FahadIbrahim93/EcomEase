# System Architecture

## Overview

Shopease follows a decoupled architecture with a clear separation between the frontend (Client), the backend (Server), and shared logic (Shared).

### Data Flow

1. **API**: Communication is handled via **tRPC**, providing end-to-end type safety between the server and the client.
2. **Database**: **Drizzle ORM** is used for database interactions, ensuring type-safe queries and schema management.
3. **Security**:
   - **Authentication**: Handled via JWT sessions stored in httpOnly cookies.
   - **CSRF**: Implemented using a Double Submit Cookie pattern with an HttpOnly `__Host-csrf` cookie and a client-readable `XSRF-TOKEN` header.
   - **Validation**: All inputs are validated using **Zod** schemas at the tRPC boundary.

### Components

- **Client**: Built with React and structured into `components`, `pages`, `hooks`, and `contexts`. Uses `@/` alias for clean imports.
- **Server**: Uses a centralized `routers.ts` for tRPC routing and `db.ts` for database access patterns. Core utilities (auth, CSRF, env) are located in `server/_core/`.
- **Shared**: Contains types and constants used by both client and server to prevent duplication and ensure consistency.

## Database Schema

The database consists of the following core tables:
- `users`: Core user profiles.
- `products`: Inventory and catalog management.
- `orders`: Unified order tracking across platforms.
- `posts`: Social media content management.
- `socialConnections`: OAuth tokens for third-party platforms.
- `analytics`: Aggregated performance data.
