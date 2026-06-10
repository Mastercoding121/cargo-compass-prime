# NextGen Hub - Multi-Cloud Backend Architecture

## Overview

NextGen Hub uses a multi-cloud architecture combining Appwrite and Supabase to deliver high availability, fault tolerance, and load-balanced data management.

## Architecture Diagram

```
┌─────────────────────┐
│  Client Application │
└──────────┬──────────┘
           │
           ▼
┌───────────────────────────┐
│   Database Adapter Layer  │
│   (src/lib/db-adapter.ts) │
└──────────┬────────────────┘
           │
           ├─┬────────────────────────┐
           │ │                        │
           ▼ ▼                        ▼
┌─────────────────┐         ┌───────────────────┐
│  Appwrite (Primary) │         │  Supabase (Primary) │
└─────────────────┘         └───────────────────┘
```

## Components

### 1. DBInterface
The core of the architecture is `DBInterface` (in `src/lib/db-adapter.ts`), which defines a contract for all database operations, including:
- `getAllProducts()`
- `searchProducts()`
- `getRelatedProducts()`
- `createOrder()`
- `updateOrder()`
- `saveToQueue()`
- `logSystemEvent()`

### 2. Concrete Adapters
Two adapter classes implement this interface:
- **AppwriteAdapter**: Uses Appwrite's SDK to connect to Appwrite's Database
- **SupabaseAdapter**: Uses Supabase's JavaScript SDK to connect to Supabase PostgreSQL

### 3. DatabaseFactory
The factory orchestrates interactions with the adapters:
- **Primary/Secondary Configuration**: Defaults to Appwrite as primary, Supabase as secondary
- **Auto-Failover**: If primary throws 429 (Rate Limit) or 503 (Unavailable), it auto-switches to secondary
- **Write Mirroring**: For all write operations, after committing to primary, it asynchronously mirrors the change to the secondary

## Responsibilities Split

| Service | Responsibility |
|---------|----------------|
| **Appwrite** | Authentication (Source of Truth), Products, Pending Queue, System Logs, Primary Database for all write operations |
| **Supabase** | Profiles, Orders, Order Status, Secondary Database for write mirroring |
| **Shared** | Products (Load-Balanced for reads, synced for writes), Orders (read operations use load balancing) |

## Key Features

### 1. Failover Logic
- The DatabaseFactory's `execute()` method catches retryable errors like 429 and 503 and automatically retries against the other provider.
- Non-retryable errors are re-thrown.

### 2. Write Mirroring
- All write operations (create, update, save, log) are mirrored to both providers asynchronously.
- Mirroring failure doesn't block the main operation, it only logs a warning.

### 3. Unified Access
- All code should import from `db` in `db-adapter.ts` instead of direct Appwrite/Supabase calls.

## Example Usage

```typescript
// Import the db instance
import { db } from "@/lib/db-adapter";

// Read operations (auto failover)
const products = await db.getAllProducts();

// Write operations (auto mirror)
const newOrder = await db.createOrder({
  user_id: "123",
  status: "pending",
  total_naira_amount: 5000,
  items: [...],
});
```

## Health Monitoring (Optional)

For advanced health monitoring, you can use `db-monitor.ts`:
```typescript
import { startMonitoring, getHealthStats } from "@/lib/db-monitor";

// Start monitoring
startMonitoring();

// Check stats
console.log(getHealthStats());
```
