import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const composableFunctions = {
  'notify-dashboard': async (params) => {
    console.log(`\n📢 Notifying Dashboard`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Transaction: ${params.txHash}`);
    console.log(`Amount: ${params.amount}`);
    console.log(`Recipient: ${params.recipient}`);
    console.log(`Status: ✅ Notification sent\n`);
    return { status: 'notified', timestamp: new Date().toISOString() };
  },

  'trigger-rebalance': async (params) => {
    console.log(`\n⚖️  Triggering Rebalance`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Current Balance: ${params.balance}`);
    console.log(`Target Threshold: ${params.threshold}`);
    console.log(`Status: ✅ Rebalance initiated\n`);
    return { status: 'rebalance_initiated', timestamp: new Date().toISOString() };
  },

  'log-metrics': async (params) => {
    console.log(`\n📊 Logging Metrics`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Transfer Count: ${params.transferCount}`);
    console.log(`Avg Gas Used: ${params.avgGasUsed}`);
    console.log(`Status: ✅ Metrics logged\n`);
    return { status: 'metrics_logged', timestamp: new Date().toISOString() };
  },
};

async function callComposableFunction(name, params) {
  const handler = composableFunctions[name];
  if (!handler) {
    throw new Error(`Function not found: ${name}`);
  }
  return await handler(params);
}

// Example calls
await callComposableFunction('notify-dashboard', {
  txHash: '0x123abc',
  amount: '100000000000000000',
  recipient: process.env.TRANSFER_RECIPIENT || '0x...'
});

await callComposableFunction('trigger-rebalance', {
  balance: '789.8282',
  threshold: '1.0000'
});

await callComposableFunction('log-metrics', {
  transferCount: 5,
  avgGasUsed: '50000'
});
