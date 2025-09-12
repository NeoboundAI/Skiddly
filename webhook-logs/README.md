# VAPI Webhook Logs

This directory contains logged webhook responses from VAPI for analysis purposes.

## File Naming Convention

Files are named using the pattern: `vapi-webhooks-{YYYY-MM-DD}.log`

Example: `vapi-webhooks-2025-09-11.log`

## File Structure

Each log file contains one JSON object per line (JSONL format):

```json
{"timestamp":"2025-09-11T15:30:45.123Z","callId":"c7447fc3-f064-4025","eventType":"call-started","headers":{"signature":"sha256=...","timestamp":"1694445045","userAgent":"VAPI-Webhook/1.0"},"webhook":{...}}
{"timestamp":"2025-09-11T15:31:12.456Z","callId":"c7447fc3-f064-4025","eventType":"call-ended","headers":{"signature":"sha256=...","timestamp":"1694445072","userAgent":"VAPI-Webhook/1.0"},"webhook":{...}}
```

## Reading the Logs

Each line is a complete JSON object. You can:

1. **Read line by line**: Process each webhook separately
2. **Filter by call ID**: `grep "c7447fc3-f064-4025" vapi-webhooks-2025-09-11.log`
3. **Filter by event type**: `grep "call-started" vapi-webhooks-2025-09-11.log`
4. **Parse with jq**: `cat vapi-webhooks-2025-09-11.log | jq '.eventType'`

## Common Webhook Types

Based on VAPI documentation, expect these event types:

- `call-started` - Call initiated
- `call-ended` - Call completed/terminated
- `call-status-update` - Status changes during call
- `transcript-update` - Real-time transcript updates
- `function-call` - Function tool calls during conversation

## Analysis Tips

1. **Call Flow Analysis**: Look at the sequence of events for a single call ID
2. **Status Progression**: Track how call status changes over time
3. **Data Structure**: Understand what data VAPI provides at each stage
4. **Error Patterns**: Identify common failure scenarios
5. **Performance**: Analyze call duration and response times

## Cleanup

These files are for development/analysis only. Consider:

- Deleting old logs regularly (they can get large)
- Adding `webhook-logs/` to `.gitignore` if not already present
- Implementing log rotation if needed

## Security Note

These files may contain sensitive data (phone numbers, conversation content).
Keep them secure and don't commit to version control.
