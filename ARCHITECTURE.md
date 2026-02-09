# System Architecture

## Overview

Shopease follows a decoupled architecture with a clear separation between the frontend (Client), the backend (Server), and shared logic (Shared).

### Data Flow

1. **API**: Communication is handled via **tRPC**, providing end-to-end type safety between the server and the client.
2. **Database**: **Drizzle ORM** is used for database interactions, ensuring type-safe queries and schema management.
3. **Security**:
   - **Authentication**: Handled via JWT sessions stored in httpOnly cookies.
   - **CSRF**: Implemented using a Double Submit Cookie pattern with an HttpOnly cookie (`__Host-csrf` in production, `csrf_token` in dev) and a client-readable `XSRF-TOKEN` cookie/header.
   - **Rate Limiting**: In-memory rate limiting middleware with periodic cleanup to prevent memory leaks.
   - **Validation**: All inputs are validated using **Zod** schemas at the tRPC boundary.
   - **Observability**: Structured JSON logging via a centralized `logger` utility.

### Backend Structure

The backend is organized into domain-driven routers under `server/routers/`:
- `auth.ts`: Session management and logout.
- `dashboard.ts`: Quick stats and activity feed.
- `social.ts`: Social platform account connections.
- `products.ts`: Inventory management with pagination support.
- `posts.ts`: Social media content creation and scheduling.
- `orders.ts`: Unified order tracking with normalized storage.
- `invoices.ts`: Invoice generation and status tracking.
- `analytics.ts`: Sales performance and platform stats.

### Core Infrastructure (`server/_core/`)

- `logger.ts`: Centralized structured logging.
- `csrf.ts`: CSRF token generation and verification.
- `context.ts`: tRPC context initialization.
- `sdk.ts`: Manus OAuth and session handling.

## Database Schema

The database consists of the following core tables:
- `users`: Core user profiles.
- `products`: Inventory and catalog management.
- `orders`: Unified order tracking.
- `orderItems`: Normalized order line items (New).
- `posts`: Social media content management.
- `socialConnections`: OAuth tokens for third-party platforms.
- `analytics`: Aggregated performance data.

### Performance Optimizations
- **Indexing**: All foreign keys (`userId`, `orderId`, etc.) and frequently filtered columns are indexed.
- **Aggregation**: Dashboard stats use SQL-level `COUNT` and `SUM` for efficiency.
- **Pagination**: List endpoints support `limit` and `offset`.
