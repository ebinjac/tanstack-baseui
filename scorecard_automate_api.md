# Year Data API Documentation

## Overview

The **Year Data API** returns time-series availability and volume metrics for one or more applications over a specified timeframe.

---

## Endpoint

```
POST http://localhost:8008/api/yeardata
```

---

## Request

### Headers

| Header         | Value              | Required |
|----------------|--------------------|----------|
| `Content-Type` | `application/json` | ✅ Yes   |

### Request Body

```json
{
  "timeframe": "2",
  "application": ["Key Management Services V1 Global"],
  "user": "admin"
}
```

### Body Parameters

| Parameter     | Type            | Required | Description                                                                 |
|---------------|-----------------|----------|-----------------------------------------------------------------------------|
| `timeframe`   | `string`        | ✅ Yes   | Number of months of data to retrieve (e.g. `"2"` returns the last 2 months) |
| `application` | `array<string>` | ✅ Yes   | List of application names to query                                          |
| `user`        | `string`        | ✅ Yes   | The username making the request (e.g. `"admin"`) - this is a dummy field for now  |

---

## Response

### Response Body

```json
[
  {
    "data": [
      {
        "volume": "822892",
        "date": "JAN2026",
        "availability": "98.6344",
        "status": "unpublished"
      },
      {
        "volume": "3245566",
        "date": "FEB2026",
        "availability": "99.6344",
        "status": "unpublished"
      }
    ],
    "application": "Key Management Services V1 Global"
  }
]
```

### Response Fields

The response is an **array of application result objects**. Each object contains the following fields:

| Field         | Type            | Description                                              |
|---------------|-----------------|----------------------------------------------------------|
| `application` | `string`        | The name of the application the data belongs to         |
| `data`        | `array<object>` | A list of monthly metric records for the application    |

#### `data` Object Fields

| Field          | Type     | Description                                                             |
|----------------|----------|-------------------------------------------------------------------------|
| `date`         | `string` | The month and year of the record in `MMMYYYY` format (e.g. `JAN2026`)  |
| `volume`       | `string` | Total transaction or request volume for the month                       |
| `availability` | `string` | Availability percentage for the month (e.g. `"98.6344"` = 98.6344%)   |
| `status`       | `string` | Publication status of the record. Possible values: `unpublished`, `published` |

---

## Example

### Request

```bash
curl -X POST http://localhost:8008/api/yeardata \
  -H "Content-Type: application/json" \
  -d '{
    "timeframe": "2",
    "application": ["Key Management Services V1 Global"],
    "user": "admin"
  }'
```

### Response

```json
[
  {
    "application": "Key Management Services V1 Global",
    "data": [
      {
        "date": "JAN2026",
        "volume": "822892",
        "availability": "98.6344",
        "status": "unpublished"
      },
      {
        "date": "FEB2026",
        "volume": "3245566",
        "availability": "99.6344",
        "status": "unpublished"
      }
    ]
  }
]
```

---

## Notes

- The `timeframe` field is passed as a string but represents an integer number of months.
- Multiple applications can be queried in a single request by adding more entries to the `application` array.
- Records with a `status` of `"unpublished"` are considered draft or pending data and may not yet be finalized.
- Dates follow the `MMMYYYY` format (three-letter month abbreviation + four-digit year).