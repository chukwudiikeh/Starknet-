# Autonomous Transfer Agent - Architecture

## Overview

The Autonomous Transfer Agent is a composable, event-driven system for autonomous token transfers on Starknet. It combines balance monitoring, conditional execution, and extensible function composition.

## Core Components

### 1. ExecutionLogger
Centralized logging system that records all agent operations with timestamps and context.

```
ExecutionLogger
├── log(level, message, data)
├── info/error/success(msg, data)
└── getLogs() → ExecutionLogEntry[]
```

### 2. Alert System
Webhook-based notification system for threshold breaches and anomalies.

```
sendAlert(message, severity)
├── Slack integration (configurable)
├── Critical alerts (balance below threshold)
└── Warning alerts (significant drops >10%)
```

### 3. AutonomousTransferAgent
Main agent orchestrator implementing the transfer cycle.

```
AutonomousTransferAgent
├── fetchBalance()
│   └── Query ERC20 contract via starknet.js
├── validateTransferCondition(balance)
│   └── Check: balance > MIN_BALANCE_THRESHOLD
├── executeTransfer(amount)
│   └── Call transfer() on token contract
├── waitForTransaction(txHash)
│   └── Poll provider with timeout
├── callComposableFunction(name, params)
│   └── Extensible function dispatch
├── checkBalanceThreshold(balance)
│   └── Trigger alerts if needed
└── executeTransferCycle()
    └── Orchestrate all steps
```

## Execution Flow

```
START
  ↓
[Fetch Balance]
  ↓
[Check Thresholds & Alerts]
  ↓
[Validate Transfer Condition]
  ├─ NO → Skip & Wait
  │
  └─ YES
      ↓
    [Execute Transfer]
      ↓
    [Wait for Confirmation]
      ↓
    [Call Composable Function]
      ↓
    [Log Results]
      ↓
[Wait CHECK_INTERVAL_MS]
  ↓
REPEAT
```

## Composability Model

The agent supports extensible function composition through the `callComposableFunction` interface:

### Built-in Handlers

1. **notify-dashboard**
   - Sends transfer notification to external system
   - Params: `{ txHash, amount, recipient }`

2. **trigger-rebalance**
   - Initiates portfolio rebalancing
   - Params: `{ balance, threshold }`

3. **log-metrics**
   - Records performance metrics
   - Params: `{ transferCount, avgGasUsed }`

### Extension Pattern

```javascript
const handlers = {
  'custom-function': async (params) => {
    // Your logic
    return { status: 'success', data: {...} };
  }
};
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Starknet Network                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ERC20 Token Contract                            │   │
│  │  ├── balance_of(account) → u256                  │   │
│  │  ├── transfer(recipient, amount) → bool          │   │
│  │  └── decimals() → u8                             │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↑
                          │ (starknet.js)
                          │
┌─────────────────────────────────────────────────────────┐
│              AutonomousTransferAgent                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │ fetchBalance() ──→ RpcProvider.call()            │   │
│  │ executeTransfer() ──→ Account.execute()          │   │
│  │ waitForTransaction() ──→ Provider.waitFor()      │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ExecutionLogger                                  │   │
│  │ └── Audit trail of all operations               │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Alert System                                     │   │
│  │ └── Webhook notifications                       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
                    Composable Functions
                    (notify, rebalance, etc.)
```

## State Management

The agent maintains minimal state:

```javascript
{
  isRunning: boolean,
  transferCount: number,
  lastBalance: bigint | null,
  monitoringInterval: NodeJS.Timeout | null,
  logger: ExecutionLogger,
  provider: RpcProvider,
  account: Account
}
```

## Error Handling

Three-tier error strategy:

1. **Fetch Errors** - Log and continue monitoring
2. **Transfer Errors** - Log, alert, and retry on next cycle
3. **Fatal Errors** - Log, report, and exit

```javascript
try {
  await executeTransferCycle();
} catch (err) {
  logger.error('Transfer cycle failed', { error: err.message });
  // Continue monitoring
}
```

## Configuration

Environment-based configuration with sensible defaults:

```
STARKNET_RPC_URL          (required)
STARKNET_ACCOUNT_ADDRESS  (required)
STARKNET_PRIVATE_KEY      (required)
TOKEN_ADDRESS             (required)
TRANSFER_RECIPIENT        (required)
MIN_BALANCE_THRESHOLD     (default: 1e18)
TRANSFER_AMOUNT           (default: 1e17)
ALERT_WEBHOOK_URL         (optional)
CHECK_INTERVAL_MS         (default: 30000)
```

## Security Model

### Key Management
- Private keys loaded from `.env` only
- Never logged or exposed in output
- Account uses starknet.js v8 signer

### Transaction Safety
- Timeout protection (300s default)
- Transaction hash verification
- Confirmation polling

### Access Control
- Single account per agent instance
- No cross-agent communication
- Webhook URL validation

## Performance Characteristics

- **Balance Check**: ~100-500ms (RPC call)
- **Transfer Execution**: ~2-5s (on-chain)
- **Confirmation Wait**: ~30-60s (network dependent)
- **Memory**: ~50MB baseline + logs
- **CPU**: Minimal (event-driven)

## Monitoring & Observability

### Logs
- Structured JSON format
- Timestamp, level, message, context
- Accessible via `agent.getReport()`

### Metrics
- Transfer count
- Success/failure rates
- Average confirmation time
- Balance trends

### Alerts
- Slack webhook integration
- Critical: Balance below threshold
- Warning: Significant drops (>10%)

## Extension Points

1. **Custom Composable Functions** - Add handlers in `callComposableFunction`
2. **Alert Conditions** - Modify `checkBalanceThreshold`
3. **Transfer Logic** - Extend `validateTransferCondition`
4. **Logging** - Implement custom logger interface
5. **RPC Provider** - Swap provider implementation

## Testing Strategy

### Unit Tests
- Balance validation logic
- Condition checking
- Alert triggering

### Integration Tests
- Full transfer cycle
- Transaction confirmation
- Composable function calls

### E2E Tests
- Against Starknet Sepolia
- Real token transfers
- Alert delivery

## Deployment Considerations

### Local Development
```bash
pnpm start
```

### Production
- Use environment secrets manager
- Enable alert webhooks
- Monitor logs and metrics
- Set appropriate check intervals
- Use dedicated account with limited funds

### Scaling
- Multiple agents with different tokens
- Shared logging backend
- Centralized alert aggregation
- Load balancing across RPC endpoints
