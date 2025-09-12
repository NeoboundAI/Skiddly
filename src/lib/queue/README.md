# Queue Service Documentation

## Overview

The Queue Service module provides a centralized system for managing all scheduled tasks and background jobs in the Skiddly application. It uses `node-cron` for scheduling and provides a unified interface for different types of queues.

## Architecture

```
src/lib/queue/
├── QueueService.js      # Core queue management service
├── CartScannerQueue.js  # Cart abandonment scanner
├── index.js            # Main exports and initialization
└── README.md           # This documentation
```

## Features

- **Centralized Job Management**: All scheduled tasks managed through a single service
- **Overlap Prevention**: Prevents multiple instances of the same job from running simultaneously
- **Error Handling**: Comprehensive error logging and handling
- **Manual Triggering**: Ability to manually trigger jobs for testing
- **Dynamic Configuration**: Update job schedules without restarting the server
- **Status Monitoring**: Real-time status monitoring for all jobs
- **Graceful Shutdown**: Proper cleanup when stopping services

## Usage

### Basic Setup

```javascript
import { initializeAllQueues, stopAllQueues, getAllQueuesStatus } from '@/lib/queue';

// Initialize all queue services
await initializeAllQueues();

// Get status of all queues
const status = getAllQueuesStatus();

// Stop all queues
await stopAllQueues();
```

### Individual Queue Management

```javascript
import { queueService, cartScannerQueue } from '@/lib/queue';

// Cart Scanner specific operations
await cartScannerQueue.initialize();
const cartStatus = cartScannerQueue.getStatus();
await cartScannerQueue.triggerManualScan();
cartScannerQueue.stop();

// Direct queue service operations
await queueService.registerJob(
  'my-job',
  '*/30 * * * * *', // Every 30 seconds
  async (correlationId) => {
    console.log('Job executing with correlation:', correlationId);
  },
  {
    runOnStart: true,
    startDelay: 5000,
    preventOverlap: true,
    metadata: { type: 'custom-job' }
  }
);
```

### Creating New Queue Types

To add a new queue type, follow the pattern used in `CartScannerQueue.js`:

```javascript
import queueService from "./QueueService.js";

class MyCustomQueue {
  constructor() {
    this.jobId = "my-custom-queue";
    this.config = {
      INTERVAL: "*/60 * * * * *", // Every minute
    };
  }

  async initialize() {
    await queueService.registerJob(
      this.jobId,
      this.config.INTERVAL,
      this.processTask.bind(this),
      {
        runOnStart: true,
        preventOverlap: true,
        metadata: { type: "my-custom-queue" }
      }
    );
  }

  async processTask(correlationId) {
    // Your task logic here
    console.log('Processing custom task with correlation:', correlationId);
  }

  getStatus() {
    return queueService.getJobStatus(this.jobId);
  }

  stop() {
    return queueService.stopJob(this.jobId);
  }
}

export default new MyCustomQueue();
```

## Configuration

### Cart Scanner Configuration

The cart scanner can be configured by updating its configuration:

```javascript
import { cartScannerQueue } from '@/lib/queue';

// Update configuration
cartScannerQueue.updateConfig({
  ABANDONED_CART_CHECK_DELAY: 20, // 20 minutes
  SCANNER_INTERVAL: "*/5 * * * *", // Every 5 minutes
});
```

### Cron Schedule Syntax

The queue service uses standard cron syntax:

```
# ┌────────────── second (0 - 59)
# │ ┌──────────── minute (0 - 59)
# │ │ ┌────────── hour (0 - 23)
# │ │ │ ┌──────── day of month (1 - 31)
# │ │ │ │ ┌────── month (1 - 12)
# │ │ │ │ │ ┌──── day of week (0 - 6) (Sunday to Saturday)
# │ │ │ │ │ │
# │ │ │ │ │ │
# * * * * * *
```

Examples:
- `*/10 * * * * *` - Every 10 seconds
- `0 */5 * * * *` - Every 5 minutes
- `0 0 */6 * * *` - Every 6 hours
- `0 0 0 * * 0` - Every Sunday at midnight

## API Endpoints

### Get Queue Status

```
GET /api/scanner-status
```

Returns the status of all queue services:

```json
{
  "success": true,
  "status": {
    "queueService": {
      "totalJobs": 1,
      "runningJobs": 0,
      "isInitialized": true,
      "jobs": [...]
    },
    "cartScanner": {
      "jobId": "cart-scanner",
      "schedule": "*/10 * * * * *",
      "isScheduled": true,
      "isRunning": false,
      "config": {...}
    }
  },
  "timestamp": "2025-09-10T15:30:00.000Z"
}
```

## Migration from Legacy Code

The queue service maintains backward compatibility with the old cart scanner implementation:

### Old Code
```javascript
import { initializeCartScanner, getCartScannerStatus } from '@/lib/cartScanner';
```

### New Code (Recommended)
```javascript
import { cartScannerQueue } from '@/lib/queue';
// or
import { initializeAllQueues, getAllQueuesStatus } from '@/lib/queue';
```

Legacy functions still work but show deprecation warnings. Update your code gradually to use the new queue service.

## Error Handling

The queue service provides comprehensive error handling:

- **Job Execution Errors**: Logged with correlation IDs for tracking
- **Initialization Errors**: Prevent server startup if critical queues fail
- **Database Connection Errors**: Automatic retry logic (handled by MongoDB connection)
- **Overlap Prevention**: Prevents resource conflicts

## Logging

All queue operations are logged with appropriate correlation IDs:

- Job registration and startup
- Job execution start/completion
- Error conditions
- Configuration changes
- Service shutdown

## Best Practices

1. **Always use correlation IDs** for tracking related operations
2. **Prevent overlapping executions** for resource-intensive jobs
3. **Set appropriate timeouts** based on expected job duration
4. **Monitor queue status** regularly in production
5. **Use graceful shutdown** when restarting services
6. **Test manually** before deploying schedule changes

## Future Enhancements

The queue service is designed to support additional queue types:

- **Notification Queue**: Email/SMS notification scheduling
- **Cleanup Queue**: Database cleanup and maintenance tasks
- **Analytics Queue**: Data processing and reporting
- **Backup Queue**: Automated backup scheduling
- **Health Check Queue**: System monitoring and alerting

Each new queue type should follow the established patterns and integrate with the centralized QueueService.
