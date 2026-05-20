# Integration with Starknet-Agentic Ecosystem

This document explains how the Autonomous Transfer Agent integrates with the broader starknet-agentic infrastructure.

## Architecture Integration

### Within starknet-agentic

```
starknet-agentic/
├── examples/
│   ├── hello-agent/              # Basic agent template
│   ├── defi-agent/               # DeFi operations
│   ├── autonomous-transfer-agent/ # ← This agent
│   ├── carry-agent/
│   ├── secure-defi-demo/
│   └── ...
├── packages/
│   ├── starknet-a2a/             # Agent-to-Agent protocol
│   ├── starknet-mcp-server/      # MCP integration
│   └── ...
├── skills/
│   ├── starknet-wallet/
│   ├── starknet-js/
│   └── ...
└── contracts/
    ├── agent-account/
    ├── session-account/
    └── ...
```

## Protocol Integration

### A2A (Agent-to-Agent) Protocol

The agent can communicate with other agents via the A2A protocol:

```javascript
// Import A2A utilities
import { A2AClient } from '@starknet-agentic/starknet-a2a';

// In callComposableFunction()
'send-to-agent': async (params) => {
  const client = new A2AClient();
  const response = await client.send({
    targetAgent: params.targetAgentId,
    message: {
      type: 'transfer-notification',
      data: params
    }
  });
  return { status: 'sent', response };
}
```

### MCP (Model Context Protocol) Integration

The agent can be exposed as an MCP server:

```javascript
// In a separate mcp-server.mjs
import { MCPServer } from '@starknet-agentic/starknet-mcp-server';

const server = new MCPServer();

// Expose agent methods
server.registerTool('fetch-balance', async (params) => {
  const agent = new AutonomousTransferAgent();
  return await agent.fetchBalance();
});

server.registerTool('execute-transfer', async (params) => {
  const agent = new AutonomousTransferAgent();
  return await agent.executeTransfer(params.amount);
});

server.start();
```

## Skill Integration

### Using Starknet Wallet Skill

```javascript
// Import wallet skill
import { WalletSkill } from '@starknet-agentic/starknet-wallet';

// Extend agent with wallet operations
class EnhancedTransferAgent extends AutonomousTransferAgent {
  constructor() {
    super();
    this.walletSkill = new WalletSkill();
  }

  async executeTransfer(amount) {
    // Use wallet skill for enhanced operations
    const result = await this.walletSkill.transfer({
      token: CONFIG.TOKEN_ADDRESS,
      recipient: CONFIG.TRANSFER_RECIPIENT,
      amount: amount.toString()
    });
    return result.txHash;
  }
}
```

### Using Starknet.js Skill

```javascript
// The agent already uses starknet.js v8
// Compatible with starknet-js skill for advanced operations

import { Contract, Account, RpcProvider } from 'starknet';

// All starknet.js operations available
const token = new Contract({
  abi: ERC20_ABI,
  address: CONFIG.TOKEN_ADDRESS,
  providerOrAccount: this.provider
});
```

## Contract Integration

### Agent Account Contract

The agent can use the agent-account contract for enhanced security:

```javascript
// Use agent-account for transaction execution
import { AgentAccount } from '@starknet-agentic/contracts/agent-account';

class SecureTransferAgent extends AutonomousTransferAgent {
  async executeTransfer(amount) {
    const agentAccount = new AgentAccount({
      provider: this.provider,
      address: CONFIG.ACCOUNT_ADDRESS,
      signer: CONFIG.PRIVATE_KEY
    });

    // Execute with agent-account security features
    const call = {
      contractAddress: CONFIG.TOKEN_ADDRESS,
      entrypoint: 'transfer',
      calldata: CallData.compile({
        recipient: CONFIG.TRANSFER_RECIPIENT,
        amount: cairo.uint256(amount)
      })
    };

    return await agentAccount.execute(call);
  }
}
```

### Session Account Contract

For temporary sessions:

```javascript
import { SessionAccount } from '@starknet-agentic/contracts/session-account';

// Create temporary session for transfer
const session = new SessionAccount({
  provider: this.provider,
  baseAccount: this.account,
  sessionDuration: 3600 // 1 hour
});

const txHash = await session.execute(call);
```

## Composable Function Registry

### Register with Global Registry

```javascript
// In a central registry file
import { FunctionRegistry } from '@starknet-agentic/core';

const registry = new FunctionRegistry();

// Register transfer agent functions
registry.register('autonomous-transfer:fetch-balance', async (params) => {
  const agent = new AutonomousTransferAgent();
  return await agent.fetchBalance();
});

registry.register('autonomous-transfer:execute-transfer', async (params) => {
  const agent = new AutonomousTransferAgent();
  return await agent.executeTransfer(params.amount);
});

// Other agents can discover and call these functions
const result = await registry.call('autonomous-transfer:fetch-balance');
```

## Event Bus Integration

### Emit Events to Global Bus

```javascript
import { EventBus } from '@starknet-agentic/core';

class IntegratedTransferAgent extends AutonomousTransferAgent {
  constructor() {
    super();
    this.eventBus = EventBus.getInstance();
  }

  async executeTransferCycle() {
    try {
      const balance = await this.fetchBalance();
      this.eventBus.emit('transfer-agent:balance-fetched', { balance });

      if (this.validateTransferCondition(balance)) {
        const txHash = await this.executeTransfer(CONFIG.TRANSFER_AMOUNT);
        this.eventBus.emit('transfer-agent:transfer-executed', { txHash });
      }
    } catch (err) {
      this.eventBus.emit('transfer-agent:error', { error: err.message });
    }
  }
}
```

## Metrics & Observability

### Integrate with Metrics System

```javascript
import { MetricsCollector } from '@starknet-agentic/observability';

class ObservableTransferAgent extends AutonomousTransferAgent {
  constructor() {
    super();
    this.metrics = MetricsCollector.getInstance();
  }

  async executeTransferCycle() {
    const startTime = Date.now();

    try {
      const balance = await this.fetchBalance();
      this.metrics.gauge('transfer-agent:balance', Number(balance));

      if (this.validateTransferCondition(balance)) {
        const txHash = await this.executeTransfer(CONFIG.TRANSFER_AMOUNT);
        this.metrics.increment('transfer-agent:transfers-executed');
      }

      const duration = Date.now() - startTime;
      this.metrics.histogram('transfer-agent:cycle-duration', duration);
    } catch (err) {
      this.metrics.increment('transfer-agent:errors');
    }
  }
}
```

## Logging Integration

### Use Starknet-Agentic Logger

```javascript
import { Logger } from '@starknet-agentic/logging';

class LoggedTransferAgent extends AutonomousTransferAgent {
  constructor() {
    super();
    this.logger = Logger.getLogger('autonomous-transfer-agent');
  }

  async fetchBalance() {
    this.logger.info('Fetching balance', {
      account: CONFIG.ACCOUNT_ADDRESS,
      token: CONFIG.TOKEN_ADDRESS
    });

    try {
      const balance = await super.fetchBalance();
      this.logger.info('Balance fetched', { balance: balance.toString() });
      return balance;
    } catch (err) {
      this.logger.error('Failed to fetch balance', { error: err.message });
      throw err;
    }
  }
}
```

## Deployment Integration

### Use Starknet-Agentic Deployment Tools

```bash
# Deploy agent using starknet-agentic CLI
starknet-agentic deploy autonomous-transfer-agent \
  --network sepolia \
  --config .env \
  --registry global
```

### Docker Integration

```dockerfile
FROM starknet-agentic:latest

WORKDIR /app
COPY examples/autonomous-transfer-agent .

RUN pnpm install

ENV STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io
ENV STARKNET_ACCOUNT_ADDRESS=${ACCOUNT_ADDRESS}
ENV STARKNET_PRIVATE_KEY=${PRIVATE_KEY}

CMD ["pnpm", "start"]
```

## Testing Integration

### Use Starknet-Agentic Test Framework

```javascript
import { AgentTestHarness } from '@starknet-agentic/testing';

describe('AutonomousTransferAgent', () => {
  let harness;
  let agent;

  beforeEach(() => {
    harness = new AgentTestHarness();
    agent = new AutonomousTransferAgent();
  });

  it('should fetch balance', async () => {
    const mockBalance = BigInt('5000000000000000000');
    harness.mockRpcCall('balance_of', mockBalance);

    const balance = await agent.fetchBalance();
    expect(balance).toBe(mockBalance);
  });

  it('should execute transfer when condition met', async () => {
    const balance = BigInt('5000000000000000000');
    harness.mockRpcCall('balance_of', balance);
    harness.mockRpcCall('transfer', true);

    await agent.executeTransferCycle();
    expect(agent.transferCount).toBe(1);
  });
});
```

## Security Integration

### Use Starknet-Agentic Security Framework

```javascript
import { SecurityPolicy, PolicyValidator } from '@starknet-agentic/security';

class SecureTransferAgent extends AutonomousTransferAgent {
  constructor() {
    super();
    this.policy = new SecurityPolicy({
      maxTransferAmount: CONFIG.TRANSFER_AMOUNT,
      allowedRecipients: [CONFIG.TRANSFER_RECIPIENT],
      requiresApproval: false
    });
  }

  async executeTransfer(amount) {
    // Validate against security policy
    const validation = await this.policy.validate({
      action: 'transfer',
      amount,
      recipient: CONFIG.TRANSFER_RECIPIENT
    });

    if (!validation.allowed) {
      throw new Error(`Transfer blocked: ${validation.reason}`);
    }

    return await super.executeTransfer(amount);
  }
}
```

## Monitoring Integration

### Connect to Starknet-Agentic Dashboard

```javascript
import { DashboardClient } from '@starknet-agentic/dashboard';

class MonitoredTransferAgent extends AutonomousTransferAgent {
  constructor() {
    super();
    this.dashboard = new DashboardClient({
      endpoint: process.env.DASHBOARD_URL,
      agentId: 'autonomous-transfer-agent'
    });
  }

  async executeTransferCycle() {
    const report = this.getReport();
    await this.dashboard.updateAgentStatus({
      agentId: 'autonomous-transfer-agent',
      status: report.status,
      transferCount: report.transferCount,
      lastUpdate: new Date().toISOString()
    });

    return await super.executeTransferCycle();
  }
}
```

## Interoperability

### Call Other Agents

```javascript
// Discover and call other agents
const otherAgent = await registry.getAgent('defi-agent');
const result = await otherAgent.callComposableFunction('swap', {
  tokenIn: CONFIG.TOKEN_ADDRESS,
  tokenOut: '0x...',
  amount: CONFIG.TRANSFER_AMOUNT
});
```

### Receive Calls from Other Agents

```javascript
// Register as callable agent
registry.registerAgent('autonomous-transfer-agent', {
  fetchBalance: async () => agent.fetchBalance(),
  executeTransfer: async (params) => agent.executeTransfer(params.amount),
  getReport: () => agent.getReport()
});
```

## Best Practices

1. **Use Skill Abstractions** - Leverage existing skills for common operations
2. **Emit Events** - Publish events for other agents to consume
3. **Register Functions** - Make agent functions discoverable
4. **Validate Security** - Use security policies for all operations
5. **Monitor Metrics** - Track performance and errors
6. **Log Comprehensively** - Use structured logging
7. **Handle Errors Gracefully** - Emit error events and continue
8. **Test Integration** - Use test harness for integration tests

## References

- [Starknet-Agentic Documentation](https://github.com/keep-starknet-strange/starknet-agentic)
- [A2A Protocol Spec](../spec/signer-api-v1.openapi.yaml)
- [MCP Integration Guide](../packages/starknet-mcp-server/README.md)
- [Skills Documentation](../skills/README.md)
- [Contract Interfaces](../contracts/)
