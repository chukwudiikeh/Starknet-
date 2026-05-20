import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

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

  info(msg, data) { this.log('INFO', msg, data); }
  error(msg, data) { this.log('ERROR', msg, data); }
  success(msg, data) { this.log('SUCCESS', msg, data); }

  getReport() {
    return {
      timestamp: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs
    };
  }
}

const logger = new ExecutionLogger();

// Simulate execution
logger.info('Starting transfer cycle');
logger.info('Balance fetched', { balance: '789828174615036153088', threshold: '1000000000000000000' });
logger.info('Transfer condition validated', { isValid: true });
logger.success('Transfer executed', { txHash: '0x123abc' });
logger.success('Composable function called', { function: 'notify-dashboard' });
logger.success('Transfer cycle completed', { transferCount: 1 });

// Print report
const report = logger.getReport();
console.log(`\n📋 Execution Report`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(JSON.stringify(report, null, 2));
