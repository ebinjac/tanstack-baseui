# API Documentation

---

## 📘 Change API

### Endpoint

```
GET http://localhost:8008/api/change
```

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `assignment_group` | string | Yes | Assignment group name (auto-populated from UI dropdown or selection) |
| `opened_at_min` | date (YYYY-MM-DD) | Yes | Minimum opened date filter |
| `opened_at_max` | date (YYYY-MM-DD) | Yes | Maximum opened date filter |

### Example Request

```
GET http://localhost:8008/api/change?assignment_group=BOT_Mitigation&opened_at_min=2026-01-26&opened_at_max=2026-01-28
```

### Response Structure

```json
{
  "Data": [
    {
      "number": "string",
      "opened_at": "datetime",
      "priority": "string",
      "cmdb_ci": "string",
      "description": "string",
      "short_description": "string",
      "state": "string",
      "close_code": "string",
      "approval": "string",
      "assignment_group": "string",
      "start_date": "datetime",
      "end_date": "datetime"
    }
  ]
}
```

### Sample Response (6 Entries)

```json
{
  "Data": [
    {
      "number": "CHG015997350",
      "opened_at": "2026-01-26T01:00:28",
      "priority": "4 - Low",
      "cmdb_ci": "Rockstar Detection - E3-Production",
      "description": "SRFC to utilize Threat Protection functions found within the Detector Dashboard",
      "short_description": "SRFC Detector Dashboard for Threat Protection",
      "state": "Closed",
      "close_code": "Closed - Success",
      "approval": "Approved",
      "assignment_group": "BOT_Mitigation",
      "start_date": "2026-01-26T01:01:27",
      "end_date": "2026-01-26T12:00:27"
    },
    {
      "number": "CHG015997351",
      "opened_at": "2026-01-26T03:10:10",
      "priority": "3 - Moderate",
      "cmdb_ci": "Payment Gateway - E3-Production",
      "description": "Upgrade TLS certificates for payment gateway",
      "short_description": "TLS Certificate Upgrade",
      "state": "Closed",
      "close_code": "Closed - Success",
      "approval": "Approved",
      "assignment_group": "BOT_Mitigation",
      "start_date": "2026-01-26T04:00:00",
      "end_date": "2026-01-26T06:30:00"
    },
    {
      "number": "CHG015997352",
      "opened_at": "2026-01-27T07:20:45",
      "priority": "2 - High",
      "cmdb_ci": "API Gateway - E3-Production",
      "description": "Deploy new rate limiting rules",
      "short_description": "API Rate Limit Enhancement",
      "state": "Closed",
      "close_code": "Closed - Success",
      "approval": "Approved",
      "assignment_group": "BOT_Mitigation",
      "start_date": "2026-01-27T08:00:00",
      "end_date": "2026-01-27T09:00:00"
    },
    {
      "number": "CHG015997353",
      "opened_at": "2026-01-27T09:15:00",
      "priority": "4 - Low",
      "cmdb_ci": "Scheduler Service - E3-Production",
      "description": "Config update for log rotation",
      "short_description": "Log Rotation Config Change",
      "state": "Closed",
      "close_code": "Closed - Success",
      "approval": "Approved",
      "assignment_group": "BOT_Mitigation",
      "start_date": "2026-01-27T10:00:00",
      "end_date": "2026-01-27T11:00:00"
    },
    {
      "number": "CHG015997354",
      "opened_at": "2026-01-28T02:45:12",
      "priority": "1 - Critical",
      "cmdb_ci": "Authentication Service - E3-Production",
      "description": "Emergency patch deployment",
      "short_description": "Critical Security Patch",
      "state": "Closed",
      "close_code": "Closed - Success",
      "approval": "Emergency Approved",
      "assignment_group": "BOT_Mitigation",
      "start_date": "2026-01-28T03:00:00",
      "end_date": "2026-01-28T05:00:00"
    },
    {
      "number": "CHG015997355",
      "opened_at": "2026-01-28T05:30:00",
      "priority": "3 - Moderate",
      "cmdb_ci": "Reporting Service - E3-Production",
      "description": "Database index optimization",
      "short_description": "DB Performance Optimization",
      "state": "Closed",
      "close_code": "Closed - Success",
      "approval": "Approved",
      "assignment_group": "BOT_Mitigation",
      "start_date": "2026-01-28T06:00:00",
      "end_date": "2026-01-28T07:30:00"
    }
  ]
}
```

---

## 📘 Incident API

### Endpoint

```
GET http://localhost:8008/api/incidents
```

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `assignment_group` | string | Yes | Assignment group name (auto-populated from UI selection) |
| `opened_at_min` | date (YYYY-MM-DD) | Yes | Minimum opened date filter |
| `opened_at_max` | date (YYYY-MM-DD) | Yes | Maximum opened date filter |

### Example Request

```
GET http://localhost:8008/api/incidents?assignment_group=BOT_Mitigation&opened_at_min=2026-01-26&opened_at_max=2026-01-28
```

### Response Structure

```json
{
  "Data": [
    {
      "number": "string",
      "short_description": "string",
      "priority": "string",
      "incident_state": "string",
      "opened_at": "datetime",
      "assigned_to": "string"
    }
  ]
}
```

### Sample Response (6 Entries)

```json
{
  "Data": [
    {
      "number": "INC031456549",
      "short_description": "Error in scheduler logs",
      "priority": "4 - Low",
      "incident_state": "Closed",
      "opened_at": "2026-01-26T05:22:10",
      "assigned_to": "SRAVANTHI GANTA"
    },
    {
      "number": "INC031456550",
      "short_description": "API timeout error",
      "priority": "3 - Moderate",
      "incident_state": "Closed",
      "opened_at": "2026-01-26T07:15:20",
      "assigned_to": "RAHUL SHARMA"
    },
    {
      "number": "INC031456551",
      "short_description": "Database connection failure",
      "priority": "2 - High",
      "incident_state": "Closed",
      "opened_at": "2026-01-27T01:12:33",
      "assigned_to": "ANITA MENON"
    },
    {
      "number": "INC031456552",
      "short_description": "Memory spike observed",
      "priority": "3 - Moderate",
      "incident_state": "Closed",
      "opened_at": "2026-01-27T03:45:10",
      "assigned_to": "KARTHIK REDDY"
    },
    {
      "number": "INC031456553",
      "short_description": "Authentication service latency",
      "priority": "2 - High",
      "incident_state": "Closed",
      "opened_at": "2026-01-28T02:05:18",
      "assigned_to": "PRIYA NAIR"
    },
    {
      "number": "INC031456554",
      "short_description": "Certificate expiry alert",
      "priority": "4 - Low",
      "incident_state": "Closed",
      "opened_at": "2026-01-28T06:25:00",
      "assigned_to": "ARUN KUMAR"
    }
  ]
}
```