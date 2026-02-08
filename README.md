# Shopease

Shopease is a modern, full-stack e-commerce and social management dashboard designed for small business owners. It provides a unified platform to manage products, orders, and social media presence across Facebook, Instagram, and TikTok.

## Tech Stack

- **Frontend**: React, Tailwind CSS, Radix UI, Lucide Icons, TanStack Query, wouter.
- **Backend**: Node.js, Express, tRPC.
- **Database**: MySQL with Drizzle ORM.
- **Authentication**: Manus OAuth integration.
- **Testing**: Vitest, Playwright.

## Getting Started

### Prerequisites

- Node.js (v20+)
- pnpm (v10+)
- MySQL Database

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables in `.env`:
   ```env
   DATABASE_URL=mysql://user:pass@localhost:3306/shopease
   JWT_SECRET=your_secret
   VITE_APP_ID=your_app_id
   OAUTH_SERVER_URL=...
   ```
4. Push database schema:
   ```bash
   pnpm db:push
   ```

### Development

Run the development server:
```bash
pnpm dev
```

Run tests:
```bash
pnpm test
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed breakdown of the system design.
