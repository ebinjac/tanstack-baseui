# Turnover Tool

The Turnover module manages team handoffs and operational events, tracking RFCs, incidents, alerts, and team communications.

## Overview

The Turnover tool provides:

- **RFC Tracking** - Monitor Request for Changes
- **Incident Management** - Track related incidents
- **Alert Handling** - Document and manage alerts
- **MIM Support** - Major Incident Management tracking
- **Communication Logging** - Record team communications
- **Finalization** - Create daily turnover reports

## Key Concepts

### Sections

The turnover tracker supports multiple section types:

| Section | Description               | Specific Fields                  |
| ------- | ------------------------- | -------------------------------- |
| RFC     | Request for Change        | RFC Number, Status, Validated By |
| INC     | Incident                  | Incident Number                  |
| ALERTS  | System Alerts             | (General tracking)               |
| MIM     | Major Incident Management | MIM Link, Slack Link             |
| COMMS   | Communications            | Email Subject, Slack Link        |
| FYI     | For Your Information      | Description                      |

### Status

- **OPEN** - Entry is active and needs attention
- **RESOLVED** - Entry has been addressed

### Finalization

Turnover finalization creates a snapshot of the current state:

- Locks in entries for a specific time period
- Creates historical record
- 5-hour cooldown between finalizations

## Features

### 1. Entry Management

- Create turnover entries for any section type
- Mark entries as important (pin to top)
- Update entry details
- Delete entries
- Mark entries as resolved

### 2. Filtering and Search

- Filter by section (RFC, INC, ALERTS, MIM, COMMS, FYI)
- Filter by status (Open, Resolved)
- Filter by application
- Include recently resolved (last 24 hours)

### 3. Dispatch View

Special view for dispatching turnover:

- Shows OPEN entries
- Shows entries resolved today
- Sorted by importance and date

### 4. Metrics Dashboard

- Turnover volume metrics
- Trend analysis
- Section breakdown

### 5. Transition History

- View past finalized turnovers
- Historical snapshots

### 6. Pass the Baton

- Structured handoff process
- Track baton recipients

## Server Functions

All turnover operations are handled by server functions in [`src/app/actions/turnover.ts`](src/app/actions/turnover.ts):

| Function                | Description                      |
| ----------------------- | -------------------------------- |
| `createTurnoverEntry`   | Create new turnover entry        |
| `updateTurnoverEntry`   | Update entry details             |
| `deleteTurnoverEntry`   | Remove an entry                  |
| `toggleImportantEntry`  | Mark/unmark as important         |
| `resolveTurnoverEntry`  | Mark entry as resolved           |
| `getTurnoverEntries`    | Fetch entries with filters       |
| `getDispatchEntries`    | Get entries for dispatch view    |
| `canFinalizeTurnover`   | Check if can finalize (cooldown) |
| `finalizeTurnover`      | Create turnover snapshot         |
| `getFinalizedTurnovers` | Get historical turnovers         |
| `getTurnoverMetrics`    | Get metrics data                 |

## Database Schema

### Core Tables

- **turnoverEntries** - Main turnover records
- **turnoverRfcDetails** - RFC-specific data
- **turnoverIncDetails** - Incident-specific data
- **turnoverMimDetails** - MIM-specific data
- **turnoverCommsDetails** - Communication-specific data
- **finalizedTurnovers** - Finalized snapshots

### Entry Schema

```typescript
interface TurnoverEntry {
  id: string
  teamId: string
  applicationId?: string
  section: 'RFC' | 'INC' | 'ALERTS' | 'MIM' | 'COMMS' | 'FYI'
  title: string
  description?: string
  comments?: string
  status: 'OPEN' | 'RESOLVED'
  isImportant: boolean
  resolvedBy?: string
  resolvedAt?: Date
  createdAt: Date
  createdBy: string
  updatedAt?: Date
  updatedBy?: string
}
```

## Components

### Turnover Components

| Component     | Description              |
| ------------- | ------------------------ |
| `TurnoverApp` | Main turnover container  |
| `EntryCard`   | Individual entry display |
| `EntryDialog` | Create/edit entry form   |

### Sub-pages

- `turnover-metrics` - Metrics dashboard
- `transition-history` - Historical turnovers
- `pass-the-baton` - Handoff process
- `dispatch-turnover` - Dispatch view

## Usage

### Creating an Entry

1. Navigate to the team's turnover page
2. Click "Add Entry" or the + button
3. Select the section type
4. Fill in relevant fields based on section:
   - RFC: RFC Number, Status, Validated By
   - INC: Incident Number
   - MIM: MIM Link, Slack Link
   - COMMS: Email Subject, Slack Link
   - FYI: Description
5. Optionally mark as important
6. Save the entry

### Managing Entries

- **Mark Important**: Click the star/pin icon to prioritize
- **Resolve**: Click resolve when addressed
- **Edit**: Click on the entry to modify details
- **Delete**: Use the delete action (with confirmation)

### Finalizing Turnover

1. Ensure all relevant entries are added
2. Click "Finalize Turnover"
3. System checks 5-hour cooldown
4. Creates snapshot of all current entries
5. Historical record is created

### Viewing Metrics

1. Navigate to turnover-metrics
2. View charts and summaries
3. Analyze trends over time

## Best Practices

1. **Add RFCs promptly** - Track changes early
2. **Mark important items** - Help reviewers prioritize
3. **Resolve entries** - Keep status current
4. **Finalize daily** - Maintain good history
5. **Use sections appropriately** - Different tracking for different event types
6. **Include relevant links** - MIM and Slack links help follow-up

## Filtering Tips

- Use "Include Recently Resolved" to see entries that were resolved in the last 24 hours
- Filter by application to focus on specific systems
- Combine filters for targeted views
