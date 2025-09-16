# Call Queue Processor Architecture

## Before Refactoring (Monolithic)
```
CallQueueProcessor.js (932 lines)
├── Eligibility checking logic
├── VAPI call operations
├── Queue management
├── Data validation
├── Error handling
└── Business logic
```

## After Refactoring (Modular)

```
CallQueueProcessor.js (280 lines) - Main Orchestrator
├── Imports and coordinates services
├── Handles concurrent processing
├── Manages job scheduling
└── Error handling coordination

Services/
├── EligibilityChecker.js (280 lines)
│   ├── checkCallEligibility()
│   ├── checkCartValueCondition()
│   ├── checkCustomerTypeCondition()
│   ├── checkProductsCondition()
│   └── Other condition checks...
│
├── CallService.js (200 lines)
│   ├── initiateCall()
│   ├── formatPhoneNumber()
│   ├── buildCallVariables()
│   ├── createCallRecord()
│   └── VAPI operations...
│
├── QueueManager.js (250 lines)
│   ├── getPendingCalls()
│   ├── markAsProcessing()
│   ├── updateCallQueueStatus()
│   ├── scheduleRetry()
│   └── Queue operations...
│
└── ValidationService.js (200 lines)
    ├── validateCallQueueEntry()
    ├── validateAgentConfiguration()
    ├── validateCartData()
    ├── validatePhoneNumber()
    └── Data validation...
```

## Data Flow

```
1. CallQueueProcessor.processNextCall()
   ↓
2. QueueManager.getPendingCalls()
   ↓
3. For each call:
   a. QueueManager.markAsProcessing()
   b. ValidationService.validateCallQueueEntry()
   c. EligibilityChecker.checkCallEligibility()
   d. CallService.initiateCall()
   e. QueueManager.markAsCompleted/Failed()
```

## Benefits

### 1. **Maintainability**
- Each service has a single responsibility
- Changes are isolated to specific services
- Easier to debug and fix issues

### 2. **Testability**
- Each service can be unit tested independently
- Mock dependencies easily
- Test specific functionality in isolation

### 3. **Readability**
- Clear separation of concerns
- Smaller, focused files
- Easy to understand what each service does

### 4. **Reusability**
- Services can be used in other parts of the application
- API endpoints can use ValidationService
- Webhook handlers can use CallService

### 5. **Scalability**
- Easy to add new condition types
- Easy to add new validation rules
- Easy to extend queue functionality

## Service Dependencies

```
CallQueueProcessor
├── EligibilityChecker (no dependencies)
├── CallService (depends on VAPI client)
├── QueueManager (depends on database models)
└── ValidationService (depends on database models)
```

## Error Handling Strategy

Each service returns consistent response objects:

```javascript
// Success
{
  success: true,
  data: result,
  error: null
}

// Failure
{
  success: false,
  data: null,
  error: "Error message"
}
```

## Logging Strategy

- **Business Events**: Important actions (call initiated, eligibility checked)
- **API Errors**: Service failures and exceptions
- **Database Operations**: Data changes and updates

## Future Enhancements

1. **Add caching layer** for frequently accessed data
2. **Add metrics collection** for monitoring
3. **Add circuit breaker pattern** for external API calls
4. **Add retry policies** with exponential backoff
5. **Add health checks** for each service
