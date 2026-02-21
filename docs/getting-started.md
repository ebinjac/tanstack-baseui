# Getting Started

This guide will help you set up and run the Ensemble Scorecard application locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (preferred package manager)
- **PostgreSQL** (v14 or higher) - for local development
- **Git**

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ensemble-tanstack-baseui
```

### 2. Install Dependencies

Using pnpm (recommended):

```bash
pnpm install
```

Or using npm:

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ensemble

# Session Secret (generate a secure random string)
SESSION_SECRET=your-session-secret-here

# Application
NODE_ENV=development
PORT=3000
```

### 4. Database Setup

#### Initialize the Database

Run the database migrations to create all required tables:

```bash
pnpm db:push
```

This will apply all migrations from the `drizzle/` directory.

#### (Optional) Seed Data

If you need initial data, check for any seed scripts or manually insert data through the application.

### 5. Start Development Server

```bash
pnpm dev
```

The application will start at `http://localhost:3000`.

## Development Commands

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `pnpm dev`         | Start development server        |
| `pnpm build`       | Build for production            |
| `pnpm start`       | Start production server         |
| `pnpm db:generate` | Generate database migrations    |
| `pnpm db:push`     | Push schema changes to database |
| `pnpm lint`        | Run ESLint                      |
| `pnpm format`      | Format code with Prettier       |

## Project Structure Overview

```
src/
├── app/
│   ├── actions/              # Server functions (API layer)
│   │   ├── scorecard.ts     # Scorecard CRUD operations
│   │   ├── turnover.ts      # Turnover tracking
│   │   ├── links.ts         # Link management
│   │   └── teams.ts         # Team operations
│   └── ssr/                 # Server-side rendering utilities
├── components/
│   ├── scorecard/           # Scorecard UI components
│   ├── turnover/            # Turnover UI components
│   ├── link-manager/        # Link Manager components
│   ├── shared/              # Shared UI components
│   └── admin/               # Admin dashboard components
├── db/
│   ├── schema/              # Database schemas
│   │   ├── schema.ts        # Main schema definitions
│   │   ├── turnover.ts      # Turnover-specific schema
│   │   └── links.ts         # Links-specific schema
│   └── index.ts             # Database connection
├── lib/
│   ├── auth/                # Authentication configuration
│   ├── middleware/          # Auth middleware functions
│   └── zod/                 # Validation schemas
└── routes/
    └── ...                  # TanStack Router route files
```

## Authentication

The application uses session-based authentication with iron-session. Upon successful authentication, user information is stored in the session and available through the router context.

## Next Steps

- Read the [Architecture Overview](./architecture.md) to understand the technical design
- Explore the [Scorecard Tool](./tools/scorecard.md) documentation
- Learn about [Turnover Tracking](./tools/turnover.md)
- Check [Link Manager](./tools/link-manager.md) features

## Troubleshooting

### Database Connection Issues

Ensure your PostgreSQL server is running and the `DATABASE_URL` is correct in your `.env` file.

### Port Already in Use

If port 3000 is already in use, you can specify a different port:

```bash
pnpm dev --port 3001
```

### Migration Errors

If you encounter migration errors, you can reset your database (⚠️ this will delete all data):

```bash
pnpm db:push --force
```

## Contributing

When working on this project:

1. Follow the existing code style and conventions
2. Use TypeScript for all new code
3. Validate inputs using Zod schemas
4. Write server functions for all database operations
5. Follow the component structure in `src/components/`
