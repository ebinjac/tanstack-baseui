# Scorecard Tool

The Scorecard module enables teams to track application and sub-application performance on a monthly basis.

## Overview

The Scorecard tool provides:

- **Availability Tracking** - Monitor monthly availability percentages
- **Volume Monitoring** - Track monthly transaction/hit volumes
- **Threshold Alerts** - Configure alerts when metrics fall outside acceptable ranges
- **Deviation Reasons** - Require explanations for threshold breaches
- **Publish Workflow** - Share finalized scorecards with leadership

## Key Concepts

### Application vs Sub-application

- **Application**: A main system or service (e.g., KMS, CRM)
- **Sub-application (Entry)**: Logical subdivisions (e.g., KMS-IDEAL, KMS-V1)
- If no sub-applications are defined, the main application appears as a single unit in the scorecard

### Metrics

| Metric       | Description                                  |
| ------------ | -------------------------------------------- |
| Availability | Monthly performance as a percentage (0-100%) |
| Volume       | Monthly hits/transactions count              |

### Thresholds

- **Availability Threshold**: Minimum acceptable availability percentage (default: 98%)
- **Volume Change Threshold**: Maximum acceptable month-over-month change percentage (default: 20%)

## Features

### 1. Application Management

Teams can manage their applications and sub-applications:

- Add new applications to a team
- Create sub-applications (entries) under each application
- Configure per-entry thresholds
- Delete entries when no longer needed

### 2. Data Entry

Users can enter monthly data:

- Direct cell editing in the scorecard table
- Support for all 12 months in a selected year
- Edit previous months within the same year
- Batch updates before saving

### 3. Threshold Breaches

When a metric breaches its threshold:

- Visual highlighting (color, icon)
- Mandatory reason entry required
- Stored reasons displayed for reviewers

### 4. Publish Workflow

Team admins can:

- Publish monthly data for leadership visibility
- Only published data appears in global scorecard views
- Publish status tracked per team/month

## Server Functions

All scorecard operations are handled by server functions in [`src/app/actions/scorecard.ts`](src/app/actions/scorecard.ts):

| Function                   | Description                                   |
| -------------------------- | --------------------------------------------- |
| `getScorecardData`         | Fetch scorecard data for a team and year      |
| `createScorecardEntry`     | Create a new sub-application entry            |
| `updateScorecardEntry`     | Update entry details and thresholds           |
| `deleteScorecardEntry`     | Remove an entry                               |
| `upsertAvailability`       | Create/update availability for a month        |
| `upsertVolume`             | Create/update volume for a month              |
| `checkScorecardIdentifier` | Validate unique identifier                    |
| `getGlobalScorecardData`   | Get scorecard for all teams (leadership view) |
| `publishScorecard`         | Publish team's monthly data                   |
| `unpublishScorecard`       | Unpublish team's data                         |

## Database Schema

### Core Tables

- **applications** - Team applications
- **scorecardEntries** - Sub-applications/entries
- **scorecardAvailability** - Monthly availability records
- **scorecardVolume** - Monthly volume records
- **scorecardPublishStatus** - Publish state per team/month

### Entry Schema

```typescript
interface ScorecardEntry {
  id: string // UUID
  applicationId: string // Foreign key to applications
  scorecardIdentifier: string // Unique slug
  name: string // Display name
  availabilityThreshold: string // e.g., "98"
  volumeChangeThreshold: string // e.g., "20"
  createdAt: Date
  createdBy: string
  updatedAt?: Date
  updatedBy?: string
}
```

### Availability Schema

```typescript
interface ScorecardAvailability {
  id: string
  scorecardEntryId: string
  year: number
  month: number // 1-12
  availability: string // Percentage as string
  reason?: string // Required if below threshold
  createdAt: Date
  createdBy: string
  updatedAt?: Date
  updatedBy?: string
}
```

## Components

### Scorecard Components

| Component            | Description                  |
| -------------------- | ---------------------------- |
| `ScorecardApp`       | Main scorecard container     |
| `ApplicationSection` | Section for each application |
| `EntryRows`          | Data entry rows              |
| `DataCell`           | Editable cell for metrics    |
| `StatsCard`          | Summary statistics           |

### Dialogs

- `AddEntryDialog` - Create new sub-application
- `EditEntryDialog` - Edit existing entry
- `DeleteEntryDialog` - Confirm deletion
- `MetricsChartDialog` - View historical charts

## Usage

### Creating a New Entry

1. Navigate to the team's scorecard page
2. Click "Add Entry" for an application
3. Enter the entry name and optional identifier
4. Configure availability and volume thresholds
5. Save the entry

### Entering Monthly Data

1. Select the year using the year selector
2. Click on a cell to edit the value
3. Enter availability (0-100) or volume (number)
4. If below threshold, enter a reason
5. Data is saved automatically

### Publishing Scorecard

1. Ensure all data is entered for the month
2. Click "Publish" button
3. Confirm the publish action
4. Data becomes visible in global scorecard views

## Global Scorecard (Leadership View)

Leadership users can view scorecards across all teams:

- Filter by SVP, VP, Director, App Owner, etc.
- Only shows published data
- Rolling view of current and previous year

## Best Practices

1. **Set appropriate thresholds** - Default 98% availability, 20% volume change
2. **Enter reasons for breaches** - Helps future review
3. **Publish monthly** - Keeps leadership informed
4. **Review historical trends** - Use the metrics chart dialog
5. **Keep entries organized** - Use clear naming conventions
