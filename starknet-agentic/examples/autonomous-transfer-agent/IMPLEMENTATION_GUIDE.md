# Autonomous Transfer Agent - Implementation Guide

## Quick Start

### 1. Installation

```bash
cd examples/autonomous-transfer-agent
pnpm install
cp .env.example .env
```

### 2. Configuration

Edit `.env` with your Starknet credentials:

```env
STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io
STARKNET_ACCOUNT_ADDRESS=0x...your_account...
STARKNET_PRIVATE_KEY=0x...your_private_key...
TOKEN_ADDRESS=0x...token_contract...
TRANSFER_RECIPIENT=0x...recipient_address...
MIN_BALANCE_THRESHOLD=1000000000000000000
TRANSFER_AMOUNT=100000000000000000
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Run the Agent

```bash
# Start the agent
pnpm start

# Or with auto-reload (development)
pnpm dev
```

## Core Features Implemented

### ✅ Fetch Wallet Balance
```javascript
const balance = await agent.fetchBalance();
// Returns: bigint (wei)
```
- Queries ERC20 token contract
- Uses starknet.js v8 Contract API
- Handles Cairo 1 ABI format

### ✅ Validate Transfer Condition
```javascript
const isValid = agent.validateTransferCondition(balance);
// Returns: boolean
```
- Checks: `balance > MIN_BALANCE_THRESHOLD`
- Logs validation result
- Prevents transfers when balance is insufficient

### ✅ Execute Transfer
```javascript
const txHash = await agent.executeTransfer(amount);
// Returns: transaction hash
```
- Calls `transfer()` on token contract
- Uses Account.execute() for transaction
- Handles Cairo uint256 encoding

### ✅ Call Composable Functions
```javascript
const result = await agent.callComposableFunction('notify-dashboard', {
  txHash: '0x...',
  amount: '1000000000000000000',
  recipient: '0x...'
});
```

Built-in handlers:
- `notify-dashboard` - Send transfer notification
- `trigger-rebalance` - Initiate rebalancing
- `log-metrics` - Record metrics

### ✅ Log Execution Results
```javascript
const report = agent.getReport();
// Returns: { status, transferCount, logs, config }
```

Logs include:
- Timestamp
- Operation level (INFO, ERROR, SUCCESS)
- Message and context data
- Full audit trail

### ✅ Trigger Alerts
```javascript
await sendAlert(message, severity);
// Sends to Slack webhook
```

Alert triggers:
- **Critical**: Balance < MIN_BALANCE_THRESHOLD
- **Warning**: Balance drops >10%

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│         AutonomousTransferAgent                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  executeTransferCycle()                             │
│  ├─ fetchBalance()                                  │
│  ├─ checkBalanceThreshold()                         │
│  ├─ validateTransferCondition()                     │
│  ├─ executeTransfer()                               │
│  ├─ waitForTransaction()                            │
│  ├─ callComposableFunction()                        │
│  └─ logger.success()                                │
│                                                     │
│  Monitoring Loop (every 30s)                        │
│  └─ executeTransferCycle()                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Execution Flow

```
START AGENT
  ↓
INITIAL CYCLE
  ├─ Fetch balance
  ├─ Check thresholds
  ├─ Validate condition
  ├─ Execute transfer (if valid)
  ├─ Call composable function
  └─ Log results
  ↓
MONITORING LOOP (30s interval)
  ├─ Repeat cycle
  ├─ Accumulate logs
  └─ Track transfers
  ↓
GRACEFUL SHUTDOWN (Ctrl+C)
  ├─ Stop monitoring
  ├─ Print final report
  └─ Exit
```

## Composability Model

### Single Agent Composition

```javascript
// Extend with custom composable functions
agent.callComposableFunction('custom-handler', {
  data: 'value'
});
```

### Multi-Agent Coordination

See `composable-example.mjs` for:
- Agent registration
- Function registry
- Event bus
- Coordinated operations

```javascript
const coordinator = new AgentCoordinator();
coordinator.registerAgent('agent-1', agent1);
coordinator.registerAgent('agent-2', agent2);

// Call functions across agents
await coordinator.callFunction('broadcast-transfer', {
  agentId: 'agent-1',
  txHash: '0x...',
  amount: '1000000000000000000'
});
```

## Configuration Options

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `STARKNET_RPC_URL` | string | - | Starknet RPC endpoint |
| `STARKNET_ACCOUNT_ADDRESS` | string | - | Agent account address |
| `STARKNET_PRIVATE_KEY` | string | - | Account private key |
| `TOKEN_ADDRESS` | string | - | ERC20 token contract |
| `TRANSFER_RECIPIENT` | string | - | Transfer destination |
| `MIN_BALANCE_THRESHOLD` | bigint | 1e18 | Minimum balance (wei) |
| `TRANSFER_AMOUNT` | bigint | 1e17 | Transfer amount (wei) |
| `ALERT_WEBHOOK_URL` | string | - | Slack webhook (optional) |
| `CHECK_INTERVAL_MS` | number | 30000 | Monitoring interval (ms) |

## Error Handling

### Balance Fetch Errors
```javascript
try {
  const balance = await agent.fetchBalance();
} catch (err) {
  logger.error('Failed to fetch balance', { error: err.message });
  // Continue monitoring
}
```

### Transfer Execution Errors
```javascript
try {
  const txHash = await agent.executeTransfer(amount);
} catch (err) {
  logger.error('Transfer failed', { error: err.message });
  // Alert and retry on next cycle
}
```

### Transaction Confirmation Errors
```javascript
try {
  await agent.waitForTransaction(txHash, 300000);
} catch (err) {
  logger.error('Transaction confirmation failed', { txHash, error: err.message });
  // Log and continue
}
```

## Logging & Monitoring

### View Logs
```javascript
const report = agent.getReport();
console.log(report.logs);
// [
//   { timestamp: '2026-05-20T14:33:42.276Z', level: 'INFO', message: '...', ... },
//   { timestamp: '2026-05-20T14:34:12.123Z', level: 'SUCCESS', message: '...', ... },
//   ...
// ]
```

### Export Report
```bash
# On agent shutdown (Ctrl+C), prints:
📋 Final Report:
{
  "status": "stopped",
  "transferCount": 5,
  "logs": [...],
  "config": {...}
}
```

## Extension Examples

### Custom Transfer Condition

```javascript
// Modify validateTransferCondition() to add time-based logic
validateTransferCondition(balance) {
  const hour = new Date().getHours();
  const isBusinessHours = hour >= 9 && hour <= 17;
  
  return balance > CONFIG.MIN_BALANCE_THRESHOLD && isBusinessHours;
}
```

### Custom Composable Function

```javascript
// Add to callComposableFunction() handlers
'price-check': async (params) => {
  const price = await fetchTokenPrice(params.token);
  return { status: 'checked', price };
}
```

### Custom Alert Logic

```javascript
// Modify checkBalanceThreshold() for custom alerts
async checkBalanceThreshold(balance) {
  if (balance < CONFIG.MIN_BALANCE_THRESHOLD * BigInt(2)) {
    await sendAlert('Balance approaching threshold', 'warning');
  }
}
```

## Testing

### Unit Test Example

```javascript
// Test balance validation
const balance = BigInt('5000000000000000000');
const threshold = BigInt('1000000000000000000');
const isValid = agent.validateTransferCondition(balance);
assert(isValid === true);
```

### Integration Test Example

```javascript
// Test full cycle with mock provider
const agent = new AutonomousTransferAgent();
await agent.executeTransferCycle();
const report = agent.getReport();
assert(report.transferCount > 0);
```

## Deployment

### Local Development
```bash
pnpm start
```

### Production Checklist
- [ ] Use environment secrets manager (not .env)
- [ ] Enable alert webhooks
- [ ] Monitor logs and metrics
- [ ] Set appropriate check intervals
- [ ] Use dedicated account with limited funds
- [ ] Test on Sepolia first
- [ ] Monitor gas usage
- [ ] Set up log aggregation

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
CMD ["pnpm", "start"]
```

## Troubleshooting

### "Missing env var"
- Ensure all required variables are set in `.env`
- Check for typos in variable names

### "Transaction timeout"
- Increase `timeoutMs` in `waitForTransaction()`
- Check RPC endpoint availability
- Verify network congestion

### "Balance fetch failed"
- Verify token address is correct
- Check RPC URL is accessible
- Ensure account has read permissions

### "Transfer failed"
- Verify account has sufficient balance
- Check recipient address is valid
- Ensure token contract is accessible
- Verify private key is correct

### "Alert not sent"
- Verify webhook URL is correct
- Check network connectivity
- Ensure webhook endpoint is accessible

## Performance Tuning

### Reduce Check Interval
```javascript
CHECK_INTERVAL_MS: 10000  // Check every 10s instead of 30s
```

### Increase Transfer Amount
```javascript
TRANSFER_AMOUNT: BigInt('1000000000000000000')  // 1 token instead of 0.1
```

### Batch Multiple Transfers
```javascript
// Modify executeTransferCycle() to batch transfers
for (let i = 0; i < 5; i++) {
  await agent.executeTransfer(CONFIG.TRANSFER_AMOUNT);
}
```

## Security Best Practices

1. **Never commit `.env`** - Use `.env.example` as template
2. **Use environment secrets** - In production, use AWS Secrets Manager, etc.
3. **Limit account funds** - Only fund with necessary amount
4. **Monitor transactions** - Review all transfers regularly
5. **Validate recipients** - Ensure recipient addresses are correct
6. **Use HTTPS webhooks** - For alert delivery
7. **Rotate keys regularly** - Change private keys periodically
8. **Test on Sepolia** - Before mainnet deployment

## References

- [Starknet.js Documentation](https://www.starknetjs.com/)
- [Cairo 1 ABI Format](https://docs.starknet.io/)
- [ERC20 Standard](https://eips.ethereum.org/EIPS/eip-20)
- [Starknet RPC API](https://docs.starknet.io/api/v0_7/)

## Support

For issues or questions:
1. Check TROUBLESHOOTING section above
2. Review ARCHITECTURE.md for design details
3. Check logs in agent report
4. Open issue on GitHub
