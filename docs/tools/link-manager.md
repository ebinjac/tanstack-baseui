# Link Manager

The Link Manager provides centralized resource organization for teams, allowing them to store, categorize, and share important links.

## Overview

The Link Manager provides:

- **Link Storage** - Save URLs with titles and descriptions
- **Categories** - Organize links into custom categories
- **Visibility Control** - Public (team-wide) or Private (personal)
- **Usage Tracking** - Monitor link clicks/popularity
- **Bulk Operations** - Import and manage multiple links
- **Search** - Find links quickly

## Key Concepts

### Visibility

| Type | Description | Permissions |
|------|-------------|-------------|
| Public | Visible to all team members | Admin only can create |
| Private | Visible only to creator | Anyone can create own |

### Categories

- User-created groupings for links
- Optional (links can be uncategorized)
- Supports custom descriptions

### Usage Tracking

- Click count tracked per link
- Most popular links highlighted
- Statistics dashboard available

## Features

### 1. Link Management

- Create links with title, URL, description
- Edit link details
- Delete links (with ownership rules)
- Update visibility (admin for public, owner for private)

### 2. Category Management

- Create custom categories
- Edit category names and descriptions
- Delete categories (links set to uncategorized)
- Filter links by category

### 3. Filtering

- By visibility (All, Public, Private)
- By category
- By application
- By search term (title, description, URL)

### 4. Bulk Operations

- Bulk create links from data
- Bulk update multiple links
- Bulk change visibility, category, application

### 5. Import

- Import links from external sources
- CSV or structured data format

### 6. Statistics

- Total links count
- Total clicks
- Top performing links
- Category breakdown
- Application breakdown

## Server Functions

All link operations are handled by server functions in [`src/app/actions/links.ts`](src/app/actions/links.ts):

| Function | Description |
|----------|-------------|
| `getLinks` | Fetch links with filters and pagination |
| `createLink` | Create a new link |
| `updateLink` | Update link details |
| `deleteLink` | Remove a link |
| `trackLinkUsage` | Increment click count |
| `bulkCreateLinks` | Create multiple links |
| `bulkUpdateLinks` | Update multiple links |
| `getLinkCategories` | Fetch categories |
| `createLinkCategory` | Create new category |
| `updateLinkCategory` | Update category |
| `deleteLinkCategory` | Remove category |
| `getLinkStats` | Get usage statistics |

## Database Schema

### Core Tables

- **links** - Saved links
- **linkCategories** - User-defined categories

### Link Schema

```typescript
interface Link {
  id: string;
  teamId: string;
  userEmail: string;        // Creator's email
  title: string;
  url: string;
  description?: string;
  visibility: 'public' | 'private';
  categoryId?: string;
  applicationId?: string;
  tags: string[];
  usageCount: number;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}
```

### Category Schema

```typescript
interface LinkCategory {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
}
```

## Components

### Link Manager Components

| Component | Description |
|-----------|-------------|
| `LinkManagerApp` | Main container |
| `LinkCard` | Individual link display |
| `CreateLinkDialog` | Create new link form |
| `LinkViews` | List/grid view toggle |
| `UniversalImporterDialog` | Bulk import |

### Sub-pages

- `link-manager/` - Main link list
- `link-manager/stats` - Statistics dashboard
- `link-manager/categories` - Category management
- `link-manager/import` - Bulk import

## Usage

### Creating a Link

1. Navigate to the team's link manager
2. Click "Add Link"
3. Enter the URL (validated)
4. Add a title (required)
5. Add optional description
6. Select visibility:
   - Public: Only admins can create
   - Private: Anyone can create
7. Optionally select category and application
8. Save the link

### Managing Links

- **Edit**: Click on a link to modify
- **Delete**: Use delete action (respects ownership)
- **Visit**: Click the link to open (tracks usage)
- **Filter**: Use sidebar filters

### Public vs Private

| Action | Public Links | Private Links |
|--------|--------------|---------------|
| Create | Admin only | Any team member |
| Edit | Admin only | Owner only |
| Delete | Admin only | Owner only |
| View | All team members | Owner only |

### Bulk Operations

1. Select multiple links using checkboxes
2. Choose action: Update visibility, category, or application
3. Apply changes to all selected

### Importing Links

1. Navigate to import page
2. Prepare data (CSV or structured)
3. Upload or paste data
4. Map fields to link properties
5. Review and confirm import

## Statistics Dashboard

The stats page provides:

- **Overview Cards**: Total links, total clicks, categories count
- **Top Links**: Most clicked links (top 5)
- **Category Breakdown**: Links and clicks per category
- **Application Breakdown**: Links and clicks per application

## Best Practices

1. **Use descriptive titles** - Help others find links
2. **Add descriptions** - Provide context for the link
3. **Categorize links** - Makes filtering easier
4. **Use public for team resources** - Shared knowledge
5. **Use private for personal bookmarks** - Individual reference
6. **Review statistics** - Understand what's being used
7. **Clean up unused links** - Maintain relevance

## Filtering Strategies

### For Team Admins
- View all public links
- Monitor private link count
- Review category structure

### For Team Members
- Filter by your private links
- Search across all accessible links
- Filter by category of interest

### For Finding Resources
- Use search for specific terms
- Filter by category to browse
- Check popular links for team favorites
