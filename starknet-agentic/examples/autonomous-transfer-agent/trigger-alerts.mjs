import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

async function sendAlert(message, severity = 'warning') {
  if (!process.env.ALERT_WEBHOOK_URL) {
    console.log(`⚠️  Alert (${severity}): ${message}`);
    console.log(`   (No webhook configured)\n`);
    return;
  }

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

    const response = await fetch(process.env.ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`✅ Alert sent (${severity}): ${message}\n`);
    } else {
      console.log(`❌ Alert failed: ${response.statusText}\n`);
    }
  } catch (err) {
    console.log(`❌ Alert error: ${err.message}\n`);
  }
}

async function checkBalanceThreshold(balance, threshold) {
  console.log(`\n🔔 Checking Balance Threshold`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Current Balance: ${(Number(balance) / 1e18).toFixed(4)} STRK`);
  console.log(`Threshold: ${(Number(threshold) / 1e18).toFixed(4)} STRK`);

  if (balance < threshold) {
    const message = `⚠️ Balance ${(Number(balance) / 1e18).toFixed(4)} STRK is below threshold ${(Number(threshold) / 1e18).toFixed(4)} STRK`;
    await sendAlert(message, 'critical');
  } else {
    console.log(`✅ Balance is above threshold\n`);
  }
}

// Test scenarios
const balance1 = BigInt('789828174615036153088'); // 789.8282 STRK
const threshold = BigInt('1000000000000000000'); // 1 STRK

console.log('Scenario 1: Balance above threshold');
await checkBalanceThreshold(balance1, threshold);

const balance2 = BigInt('500000000000000000'); // 0.5 STRK
console.log('Scenario 2: Balance below threshold');
await checkBalanceThreshold(balance2, threshold);

const balance3 = BigInt('900000000000000000'); // 0.9 STRK (10% drop)
const lastBalance = BigInt('1000000000000000000'); // 1 STRK
console.log('Scenario 3: Balance dropped >10%');
const dropPercent = 100 - (Number(balance3) * 100 / Number(lastBalance));
console.log(`\n📉 Balance Drop Detection`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Previous: ${(Number(lastBalance) / 1e18).toFixed(4)} STRK`);
console.log(`Current: ${(Number(balance3) / 1e18).toFixed(4)} STRK`);
console.log(`Drop: ${dropPercent.toFixed(2)}%`);
if (balance3 < lastBalance * BigInt(90) / BigInt(100)) {
  const message = `⚠️ Balance dropped by ${dropPercent.toFixed(2)}%: ${(Number(lastBalance) / 1e18).toFixed(4)} → ${(Number(balance3) / 1e18).toFixed(4)} STRK`;
  await sendAlert(message, 'warning');
}
