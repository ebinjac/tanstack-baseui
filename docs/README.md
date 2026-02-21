# Ensemble Scorecard Application

Welcome to the Ensemble Scorecard application documentation. This application is a comprehensive enterprise management platform built with TanStack Start, providing tools for tracking application performance, managing team turnovers, and organizing important links.

## Overview

Ensemble is an enterprise application management platform that helps teams:

- **Track Application Performance** - Monitor availability and volume metrics for applications with configurable thresholds
- **Manage Team Turnovers** - Track RFCs, incidents, alerts, and team communications
- **Organize Links** - Manage and categorize team resources with a flexible link manager

## Key Features

### Scorecard Tool

The Scorecard module enables teams to track application and sub-application performance on a monthly basis:

- Track availability percentages and volume metrics
- Configure threshold alerts for performance deviations
- Require explanations when thresholds are breached
- Publish scorecards for leadership visibility

### Turnover Tracker

The Turnover module manages team handoffs and operational events:

- Track RFCs (Request for Changes)
- Monitor Incidents
- Handle Alerts and MIM (Major Incident Management)
- Manage Communications
- Finalize daily turnover reports

### Link Manager

The Link Manager provides centralized resource organization:

- Create and organize links by category
- Support public and private link visibility
- Track link usage and popularity
- Bulk import and management capabilities

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (Full-stack React framework)
- **Routing**: [TanStack Router](https://tanstack.com/router)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com) with Base UI
- **Styling**: Tailwind CSS
- **Validation**: Zod

## Quick Links

- [Getting Started](./getting-started.md)
- [Architecture Overview](./architecture.md)
- [Scorecard Tool](./tools/scorecard.md)
- [Turnover Tool](./tools/turnover.md)
- [Link Manager](./tools/link-manager.md)
- [Deployment Guide](./deployment.md)

## Project Structure

```
src/
├── app/
│   ├── actions/           # Server functions (API endpoints)
│   │   ├── scorecard.ts
│   │   ├── turnover.ts
│   │   ├── links.ts
│   │   └── ...
│   └── ssr/              # SSR utilities
├── components/
│   ├── scorecard/        # Scorecard UI components
│   ├── turnover/         # Turnover UI components
│   ├── link-manager/     # Link Manager components
│   └── ...
├── db/
│   └── schema/           # Drizzle database schema
├── lib/
│   ├── auth/             # Authentication configuration
│   ├── middleware/       # Auth middleware
│   └── zod/              # Zod validation schemas
└── routes/              # TanStack Router routes
```

## License

This project is proprietary software for Ensemble enterprise use.
