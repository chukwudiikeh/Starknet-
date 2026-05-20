# Autonomous Transfer Agent

A composable autonomous agent that monitors wallet balance, validates transfer conditions, executes transfers, and triggers alerts when thresholds are breached.

## Features

✅ **Fetch Wallet Balance** - Real-time ERC20 token balance monitoring  
✅ **Validate Transfer Condition** - Check if balance exceeds threshold  
✅ **Execute Transfers** - Automatic token transfers when conditions are met  
✅ **Composable Functions** - Call other agents or functions (extensible hooks)  
✅ **Execution Logging** - Complete audit trail of all operations  
✅ **Alert System** - Slack/webhook notifications when balance drops below threshold  

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:
   - `STARKNET_RPC_URL` - Starknet RPC endpoint
   - `STARKNET_ACCOUNT_ADDRESS` - Your account address
   - `STARKNET_PRIVATE_KEY` - Your private key
   - `TOKEN_ADDRESS` - ERC20 token contract address
   - `TRANSFER_RECIPIENT` - Recipient address
   - `MIN_BALANCE_THRESHOLD` - Minimum balance to trigger transfer (in wei)
   - `TRANSFER_AMOUNT` - Amount to transfer (in wei)
   - `ALERT_WEBHOOK_URL` - (Optional) Slack webhook for alerts

## Usage

**Start the agent:**
```bash
pnpm start
```

**Development mode with auto-reload:**
```bash
pnpm dev
```

## How It Works

### Execution Cycle

1. **Fetch Balance** - Query current token balance
2. **Check Thresholds** - Verify balance against minimum threshold
3. **Validate Condition** - Confirm balance > threshold
4. **Execute Transfer** - Send tokens if condition is met
5. **Call Composable Function** - Notify dashboard or trigger rebalance
6. **Log Results** - Record all execution details

### Alert Triggers

- **Critical**: Balance drops below minimum threshold
- **Warning**: Balance drops >10% from previous check

### Composable Functions

The agent supports extensible function calls:
- `notify-dashboard` - Send transfer notification
- `trigger-rebalance` - Initiate portfolio rebalancing
- `log-metrics` - Record performance metrics

Extend by adding handlers in the `callComposableFunction` method.

## Example Output

```
🤖 Autonomous Transfer Agent Starting...
📍 Address: 0x...
💰 Token: 0x...
📤 Recipient: 0x...
⏱️  Check interval: 30s

[INFO] Starting transfer cycle
[INFO] Balance fetched { balance: '5000000000000000000', threshold: '1000000000000000000' }
[INFO] Transfer condition validated { balance: '5000000000000000000', threshold: '1000000000000000000', isValid: true }
[INFO] Executing transfer { amount: '100000000000000000', recipient: '0x...' }
[SUCCESS] Transfer executed { txHash: '0x...' }
[SUCCESS] Transfer cycle completed { transferCount: 1, txHash: '0x...' }
```

## Architecture

```
AutonomousTransferAgent
├── fetchBalance()           → Query ERC20 balance
├── validateTransferCondition() → Check balance > threshold
├── executeTransfer()        → Send tokens
├── waitForTransaction()     → Confirm on-chain
├── callComposableFunction() → Extensible hooks
├── checkBalanceThreshold()  → Alert system
└── executeTransferCycle()   → Main loop
```

## Security Considerations

- Private keys are loaded from `.env` (never commit this file)
- Transactions use Cairo 1 ABI format
- Timeout protection on transaction confirmation
- Comprehensive error logging for debugging

## Extending the Agent

### Add Custom Composable Functions

```javascript
const handlers = {
  'your-function': async () => {
    // Your logic here
    return { status: 'success' };
  },
};
```

### Modify Alert Conditions

Edit `checkBalanceThreshold()` to add custom alert logic.

### Change Transfer Logic

Modify `validateTransferCondition()` to implement custom conditions (e.g., time-based, price-based).

## Troubleshooting

**"Missing env var"** - Ensure all required environment variables are set  
**"Transaction timeout"** - Increase `timeoutMs` in `waitForTransaction()` or check RPC endpoint  
**"Balance fetch failed"** - Verify token address and RPC URL are correct  

## License

MIT
