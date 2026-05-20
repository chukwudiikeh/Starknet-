# Autonomous Transfer Agent - Quick Reference

## Setup (2 minutes)

```bash
cd examples/autonomous-transfer-agent
pnpm install
cp .env.example .env
# Edit .env with your credentials
pnpm start
```

## Core API

### AutonomousTransferAgent

```javascript
const agent = new AutonomousTransferAgent();

// Start monitoring
await agent.start();

// Stop monitoring
agent.stop();

// Get status report
const report = agent.getReport();
// {
//   status: 'running' | 'stopped',
//   transferCount: number,
//   logs: ExecutionLogEntry[],
//   config: {...}
// }
```

### Main Methods

```javascript
// Fetch current balance
const balance = await agent.fetchBalance();
// Returns: bigint (wei)

// Check if transfer should happen
const isValid = agent.validateTransferCondition(balance);
// Returns: boolean

// Execute a transfer
const txHash = await agent.executeTransfer(amount);
// Returns: string (transaction hash)

// Wait for confirmation
await agent.waitForTransaction(txHash);
// Returns: void

// Call composable function
const result = await agent.callComposableFunction('notify-dashboard', {
  txHash: '0x...',
  amount: '1000000000000000000'
});
// Returns: { status: string, ... }

// Check balance thresholds
await agent.checkBalanceThreshold(balance);
// Triggers alerts if needed
```

## Configuration

```env
# Required
STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io
STARKNET_ACCOUNT_ADDRESS=0x...
STARKNET_PRIVATE_KEY=0x...
TOKEN_ADDRESS=0x...
TRANSFER_RECIPIENT=0x...

# Optional (with defaults)
MIN_BALANCE_THRESHOLD=1000000000000000000
TRANSFER_AMOUNT=100000000000000000
ALERT_WEBHOOK_URL=https://hooks.slack.com/...
```

## Execution Cycle

```
1. Fetch Balance
   ↓
2. Check Thresholds & Alerts
   ↓
3. Validate Transfer Condition
   ├─ NO → Skip
   └─ YES
      ↓
4. Execute Transfer
   ↓
5. Wait for Confirmation
   ↓
6. Call Composable Function
   ↓
7. Log Results
   ↓
8. Wait 30s → Repeat
```

## Composable Functions

### Built-in Handlers

```javascript
// Notify external system
await agent.callComposableFunction('notify-dashboard', {
  txHash: '0x...',
  amount: '1000000000000000000',
  recipient: '0x...'
});

// Trigger rebalancing
await agent.callComposableFunction('trigger-rebalance', {
  balance: '5000000000000000000',
  threshold: '1000000000000000000'
});

// Log metrics
await agent.callComposableFunction('log-metrics', {
  transferCount: 5,
  avgGasUsed: '50000'
});
```

### Add Custom Handler

```javascript
// In callComposableFunction() method:
const handlers = {
  'my-function': async (params) => {
    // Your logic
    return { status: 'success' };
  }
};
```

## Logging

```javascript
// Access logs
const report = agent.getReport();
const logs = report.logs;

// Log structure
{
  timestamp: '2026-05-20T14:33:42.276Z',
  level: 'INFO' | 'ERROR' | 'SUCCESS' | 'WARNING',
  message: 'Operation description',
  // ... additional context fields
}
```

## Alerts

### Trigger Conditions

- **Critical**: `balance < MIN_BALANCE_THRESHOLD`
- **Warning**: `balance < lastBalance * 0.9` (>10% drop)

### Send Alert

```javascript
await sendAlert('Your message', 'critical' | 'warning');
// Requires ALERT_WEBHOOK_URL in .env
```

## Multi-Agent Coordination

```javascript
const coordinator = new AgentCoordinator();

// Register agents
coordinator.registerAgent('agent-1', agent1);
coordinator.registerAgent('agent-2', agent2);

// Register functions
coordinator.registerFunction('my-function', async (params) => {
  return { status: 'done' };
});

// Call functions
const result = await coordinator.callFunction('my-function', {});

// Emit events
coordinator.emitEvent('transfer-complete', { txHash: '0x...' });

// Get events
const events = coordinator.getEvents('transfer-complete');

// Get status
const status = coordinator.getStatus();
```

## Error Handling

```javascript
try {
  await agent.executeTransferCycle();
} catch (err) {
  console.error('Cycle failed:', err.message);
  // Agent continues monitoring
}
```

## Common Tasks

### Change Transfer Amount

```env
TRANSFER_AMOUNT=500000000000000000  # 0.5 tokens
```

### Change Check Interval

```javascript
// In index.mjs
CHECK_INTERVAL_MS: 10000  // Check every 10s
```

### Add Custom Alert Logic

```javascript
// Modify checkBalanceThreshold()
async checkBalanceThreshold(balance) {
  if (balance < CONFIG.MIN_BALANCE_THRESHOLD) {
    await sendAlert('Critical: Balance too low', 'critical');
  }
}
```

### Extend Transfer Condition

```javascript
// Modify validateTransferCondition()
validateTransferCondition(balance) {
  const hour = new Date().getHours();
  const isBusinessHours = hour >= 9 && hour <= 17;
  
  return balance > CONFIG.MIN_BALANCE_THRESHOLD && isBusinessHours;
}
```

## Monitoring

```javascript
// Get current status
const report = agent.getReport();
console.log(`Transfers: ${report.transferCount}`);
console.log(`Status: ${report.status}`);
console.log(`Logs: ${report.logs.length}`);

// View recent logs
const recentLogs = report.logs.slice(-10);
console.log(JSON.stringify(recentLogs, null, 2));
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing env var" | Check all required vars in `.env` |
| "Transaction timeout" | Increase timeout or check RPC |
| "Balance fetch failed" | Verify token address and RPC URL |
| "Transfer failed" | Check account balance and recipient |
| "Alert not sent" | Verify webhook URL is correct |

## Files

```
autonomous-transfer-agent/
├── index.mjs                    # Main agent
├── composable-example.mjs       # Multi-agent example
├── types.ts                     # TypeScript definitions
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── .env.example                # Configuration template
├── README.md                   # Overview
├── ARCHITECTURE.md             # Design details
├── IMPLEMENTATION_GUIDE.md     # Full guide
└── QUICK_REFERENCE.md          # This file
```

## Examples

### Run Single Agent

```bash
pnpm start
```

### Run Multi-Agent Example

```bash
node composable-example.mjs
```

### Development Mode

```bash
pnpm dev  # Auto-reload on changes
```

## Key Concepts

- **Balance Threshold**: Minimum balance to trigger transfer
- **Transfer Condition**: Logic to decide if transfer should happen
- **Composable Function**: Extensible function that can be called by agent
- **Execution Logger**: Records all operations with timestamps
- **Alert System**: Sends notifications on threshold breaches
- **Monitoring Loop**: Periodic execution of transfer cycle

## Performance

- Balance check: ~100-500ms
- Transfer execution: ~2-5s
- Confirmation wait: ~30-60s
- Memory: ~50MB baseline
- CPU: Minimal (event-driven)

## Security

✅ Private keys from `.env` only  
✅ Transaction timeout protection  
✅ Comprehensive error logging  
✅ Webhook URL validation  
✅ No sensitive data in logs  

## Next Steps

1. ✅ Setup and run agent
2. ✅ Monitor logs and transfers
3. ✅ Add custom composable functions
4. ✅ Deploy to production
5. ✅ Integrate with other systems

---

**Need help?** Check README.md, ARCHITECTURE.md, or IMPLEMENTATION_GUIDE.md
