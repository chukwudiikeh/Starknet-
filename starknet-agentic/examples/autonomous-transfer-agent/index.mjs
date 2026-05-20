import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Account, RpcProvider, Contract, CallData, cairo } from 'starknet';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  RPC_URL: process.env.STARKNET_RPC_URL,
  ACCOUNT_ADDRESS: process.env.STARKNET_ACCOUNT_ADDRESS,
  PRIVATE_KEY: process.env.STARKNET_PRIVATE_KEY,
  TOKEN_ADDRESS: process.env.TOKEN_ADDRESS,
  TRANSFER_RECIPIENT: process.env.TRANSFER_RECIPIENT,
  MIN_BALANCE_THRESHOLD: BigInt(process.env.MIN_BALANCE_THRESHOLD || '1000000000000000000'),
  TRANSFER_AMOUNT: BigInt(process.env.TRANSFER_AMOUNT || '100000000000000000'),
  ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL,
  CHECK_INTERVAL_MS: 30000,
};

// Validate required env vars
const required = ['RPC_URL', 'ACCOUNT_ADDRESS', 'PRIVATE_KEY', 'TOKEN_ADDRESS', 'TRANSFER_RECIPIENT'];
for (const key of required) {
  if (!CONFIG[key]) throw new Error(`Missing env var: ${key}`);
}

// ERC20 ABI
const ERC20_ABI = [
  {
    type: 'interface',
    name: 'openzeppelin::token::erc20::interface::IERC20',
    items: [
      {
        type: 'function',
        name: 'balance_of',
        inputs: [{ name: 'account', type: 'core::starknet::contract_address::ContractAddress' }],
        outputs: [{ type: 'core::integer::u256' }],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'decimals',
        inputs: [],
        outputs: [{ type: 'core::integer::u8' }],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'transfer',
        inputs: [
          { name: 'recipient', type: 'core::starknet::contract_address::ContractAddress' },
          { name: 'amount', type: 'core::integer::u256' },
        ],
        outputs: [{ type: 'core::bool' }],
        state_mutability: 'external',
      },
    ],
  },
];

// ============================================================================
// Execution Logger
// ============================================================================

class ExecutionLogger {
  constructor() {
    this.logs = [];
  }

  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data,
    };
    this.logs.push(entry);
    console.log(`[${level}] ${message}`, data);
  }

  info(msg, data) {
    this.log('INFO', msg, data);
  }

  error(msg, data) {
    this.log('ERROR', msg, data);
  }

  success(msg, data) {
    this.log('SUCCESS', msg, data);
  }

  getLogs() {
    return this.logs;
  }
}

// ============================================================================
// Alert System
// ============================================================================

async function sendAlert(message, severity = 'warning') {
  if (!CONFIG.ALERT_WEBHOOK_URL) return;

  try {
    const payload = {
      text: `🚨 Transfer Agent Alert [${severity.toUpperCase()}]`,
      attachments: [
        {
          color: severity === 'critical' ? 'danger' : 'warning',
          text: message,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await fetch(CONFIG.ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Failed to send alert:', err.message);
  }
}

// ============================================================================
// Autonomous Transfer Agent
// ============================================================================

class AutonomousTransferAgent {
  constructor() {
    this.provider = new RpcProvider({ nodeUrl: CONFIG.RPC_URL });
    this.account = new Account({
      provider: this.provider,
      address: CONFIG.ACCOUNT_ADDRESS,
      signer: CONFIG.PRIVATE_KEY,
    });
    this.logger = new ExecutionLogger();
    this.isRunning = false;
    this.transferCount = 0;
    this.lastBalance = null;
  }

  // ========================================================================
  // Core Agent Functions
  // ========================================================================

  /**
   * Fetch wallet balance
   */
  async fetchBalance() {
    try {
      const token = new Contract({
        abi: ERC20_ABI,
        address: CONFIG.TOKEN_ADDRESS,
        providerOrAccount: this.provider,
      });

      const balance = await token.balance_of(this.account.address);
      const balanceBn = typeof balance === 'bigint' ? balance : BigInt(balance);

      this.logger.info('Balance fetched', {
        balance: balanceBn.toString(),
        threshold: CONFIG.MIN_BALANCE_THRESHOLD.toString(),
      });

      return balanceBn;
    } catch (err) {
      this.logger.error('Failed to fetch balance', { error: err.message });
      throw err;
    }
  }

  /**
   * Validate transfer condition: balance > threshold
   */
  validateTransferCondition(balance) {
    const isValid = balance > CONFIG.MIN_BALANCE_THRESHOLD;

    this.logger.info('Transfer condition validated', {
      balance: balance.toString(),
      threshold: CONFIG.MIN_BALANCE_THRESHOLD.toString(),
      isValid,
    });

    return isValid;
  }

  /**
   * Execute token transfer
   */
  async executeTransfer(amount) {
    try {
      this.logger.info('Executing transfer', {
        amount: amount.toString(),
        recipient: CONFIG.TRANSFER_RECIPIENT,
      });

      const call = {
        contractAddress: CONFIG.TOKEN_ADDRESS,
        entrypoint: 'transfer',
        calldata: CallData.compile({
          recipient: CONFIG.TRANSFER_RECIPIENT,
          amount: cairo.uint256(amount),
        }),
      };

      const res = await this.account.execute(call);
      this.logger.success('Transfer executed', { txHash: res.transaction_hash });

      await this.waitForTransaction(res.transaction_hash);
      this.transferCount++;

      return res.transaction_hash;
    } catch (err) {
      this.logger.error('Transfer failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash, timeoutMs = 300000) {
    try {
      await Promise.race([
        this.provider.waitForTransaction(txHash),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Transaction timeout: ${txHash}`)), timeoutMs);
        }),
      ]);
      this.logger.success('Transaction confirmed', { txHash });
    } catch (err) {
      this.logger.error('Transaction confirmation failed', { txHash, error: err.message });
      throw err;
    }
  }

  /**
   * Call another agent or function (composability hook)
   */
  async callComposableFunction(functionName, params = {}) {
    this.logger.info('Calling composable function', { functionName, params });

    // Example: Can be extended to call other agents via A2A protocol
    // or invoke other smart contracts
    const handlers = {
      'notify-dashboard': async () => {
        this.logger.info('Notifying dashboard', params);
        return { status: 'notified' };
      },
      'trigger-rebalance': async () => {
        this.logger.info('Triggering rebalance', params);
        return { status: 'rebalance_initiated' };
      },
      'log-metrics': async () => {
        this.logger.info('Logging metrics', params);
        return { status: 'metrics_logged' };
      },
    };

    const handler = handlers[functionName];
    if (!handler) {
      throw new Error(`Unknown composable function: ${functionName}`);
    }

    return await handler();
  }

  /**
   * Check balance threshold and trigger alerts
   */
  async checkBalanceThreshold(balance) {
    if (balance < CONFIG.MIN_BALANCE_THRESHOLD) {
      const message = `⚠️ Balance ${balance.toString()} is below threshold ${CONFIG.MIN_BALANCE_THRESHOLD.toString()}`;
      this.logger.error('Balance threshold breached', { balance: balance.toString() });
      await sendAlert(message, 'critical');
    }

    // Alert if balance dropped significantly
    if (this.lastBalance && balance < this.lastBalance * BigInt(90) / BigInt(100)) {
      const message = `⚠️ Balance dropped by >10%: ${this.lastBalance.toString()} → ${balance.toString()}`;
      this.logger.error('Significant balance drop', { previous: this.lastBalance.toString(), current: balance.toString() });
      await sendAlert(message, 'warning');
    }

    this.lastBalance = balance;
  }

  /**
   * Main agent execution cycle
   */
  async executeTransferCycle() {
    try {
      this.logger.info('Starting transfer cycle');

      // 1. Fetch balance
      const balance = await this.fetchBalance();

      // 2. Check thresholds and alerts
      await this.checkBalanceThreshold(balance);

      // 3. Validate transfer condition
      if (!this.validateTransferCondition(balance)) {
        this.logger.info('Transfer condition not met, skipping transfer');
        return;
      }

      // 4. Execute transfer
      const txHash = await this.executeTransfer(CONFIG.TRANSFER_AMOUNT);

      // 5. Call composable function
      await this.callComposableFunction('notify-dashboard', {
        txHash,
        amount: CONFIG.TRANSFER_AMOUNT.toString(),
        recipient: CONFIG.TRANSFER_RECIPIENT,
      });

      // 6. Log execution result
      this.logger.success('Transfer cycle completed', {
        transferCount: this.transferCount,
        txHash,
      });
    } catch (err) {
      this.logger.error('Transfer cycle failed', { error: err.message });
    }
  }

  /**
   * Start the agent
   */
  async start() {
    console.log('\n🤖 Autonomous Transfer Agent Starting...');
    console.log(`📍 Address: ${this.account.address}`);
    console.log(`💰 Token: ${CONFIG.TOKEN_ADDRESS}`);
    console.log(`📤 Recipient: ${CONFIG.TRANSFER_RECIPIENT}`);
    console.log(`⏱️  Check interval: ${CONFIG.CHECK_INTERVAL_MS / 1000}s\n`);

    this.isRunning = true;

    // Initial cycle
    await this.executeTransferCycle();

    // Periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.executeTransferCycle();
    }, CONFIG.CHECK_INTERVAL_MS);
  }

  /**
   * Stop the agent
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.isRunning = false;
    console.log('\n✅ Agent stopped');
    console.log(`📊 Total transfers: ${this.transferCount}`);
    console.log(`📝 Execution logs: ${this.logger.getLogs().length} entries`);
  }

  /**
   * Get execution report
   */
  getReport() {
    return {
      status: this.isRunning ? 'running' : 'stopped',
      transferCount: this.transferCount,
      logs: this.logger.getLogs(),
      config: {
        token: CONFIG.TOKEN_ADDRESS,
        recipient: CONFIG.TRANSFER_RECIPIENT,
        minThreshold: CONFIG.MIN_BALANCE_THRESHOLD.toString(),
        transferAmount: CONFIG.TRANSFER_AMOUNT.toString(),
      },
    };
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const agent = new AutonomousTransferAgent();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n📋 Final Report:');
    console.log(JSON.stringify(agent.getReport(), null, 2));
    agent.stop();
    process.exit(0);
  });

  try {
    await agent.start();
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
