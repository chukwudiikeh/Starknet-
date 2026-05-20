/**
 * Composable Agent Example
 *
 * Demonstrates how to compose multiple autonomous transfer agents
 * and coordinate them through shared composable functions.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

// ============================================================================
// Composable Agent Coordinator
// ============================================================================

class AgentCoordinator {
  constructor() {
    this.agents = new Map();
    this.functionRegistry = new Map();
    this.eventBus = [];
    this.setupDefaultFunctions();
  }

  /**
   * Register an agent
   */
  registerAgent(agentId, agent) {
    this.agents.set(agentId, agent);
    console.log(`✅ Agent registered: ${agentId}`);
  }

  /**
   * Register a composable function
   */
  registerFunction(name, handler) {
    this.functionRegistry.set(name, handler);
    console.log(`✅ Function registered: ${name}`);
  }

  /**
   * Call a composable function
   */
  async callFunction(name, params = {}) {
    const handler = this.functionRegistry.get(name);
    if (!handler) {
      throw new Error(`Function not found: ${name}`);
    }
    return await handler(params);
  }

  /**
   * Emit an event
   */
  emitEvent(eventType, data) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data,
    };
    this.eventBus.push(event);
    console.log(`📢 Event: ${eventType}`, data);
  }

  /**
   * Get events of a specific type
   */
  getEvents(eventType) {
    return this.eventBus.filter(e => e.type === eventType);
  }

  /**
   * Setup default composable functions
   */
  setupDefaultFunctions() {
    // Notify all agents of a transfer
    this.registerFunction('broadcast-transfer', async (params) => {
      const { agentId, txHash, amount } = params;
      this.emitEvent('transfer-broadcast', { agentId, txHash, amount });
      return { status: 'broadcasted', recipientCount: this.agents.size - 1 };
    });

    // Aggregate metrics from all agents
    this.registerFunction('aggregate-metrics', async () => {
      const metrics = {
        totalTransfers: 0,
        totalAgents: this.agents.size,
        agents: {},
      };

      for (const [agentId, agent] of this.agents) {
        const report = agent.getReport();
        metrics.totalTransfers += report.transferCount;
        metrics.agents[agentId] = {
          transfers: report.transferCount,
          status: report.status,
        };
      }

      this.emitEvent('metrics-aggregated', metrics);
      return metrics;
    });

    // Trigger coordinated rebalance
    this.registerFunction('coordinated-rebalance', async (params) => {
      const { sourceAgentId, targetAgentId, amount } = params;
      this.emitEvent('rebalance-initiated', { sourceAgentId, targetAgentId, amount });
      return { status: 'rebalance_queued', agents: [sourceAgentId, targetAgentId] };
    });

    // Emergency stop all agents
    this.registerFunction('emergency-stop', async () => {
      for (const [agentId, agent] of this.agents) {
        if (agent.isRunning) {
          agent.stop();
          this.emitEvent('agent-stopped', { agentId, reason: 'emergency' });
        }
      }
      return { status: 'all_agents_stopped', count: this.agents.size };
    });

    // Health check all agents
    this.registerFunction('health-check', async () => {
      const health = {
        timestamp: new Date().toISOString(),
        agents: {},
      };

      for (const [agentId, agent] of this.agents) {
        const report = agent.getReport();
        health.agents[agentId] = {
          status: report.status,
          transferCount: report.transferCount,
          logCount: report.logs.length,
        };
      }

      this.emitEvent('health-check-complete', health);
      return health;
    });
  }

  /**
   * Get coordinator status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      agentCount: this.agents.size,
      functionCount: this.functionRegistry.size,
      eventCount: this.eventBus.length,
      agents: Array.from(this.agents.keys()),
      functions: Array.from(this.functionRegistry.keys()),
    };
  }
}

// ============================================================================
// Multi-Agent Orchestration Example
// ============================================================================

class MultiAgentOrchestrator {
  constructor() {
    this.coordinator = new AgentCoordinator();
  }

  /**
   * Setup multiple agents with shared coordinator
   */
  async setupAgents(agentConfigs) {
    console.log('\n🚀 Setting up multi-agent system...\n');

    for (const config of agentConfigs) {
      // In a real scenario, you would instantiate actual agents here
      // For this example, we create mock agents
      const mockAgent = {
        id: config.id,
        isRunning: false,
        transferCount: 0,
        getReport: () => ({
          status: this.isRunning ? 'running' : 'stopped',
          transferCount: this.transferCount,
          logs: [],
          config: {
            token: config.token,
            recipient: config.recipient,
            minThreshold: config.minThreshold,
            transferAmount: config.transferAmount,
          },
        }),
        stop: () => {
          this.isRunning = false;
        },
      };

      this.coordinator.registerAgent(config.id, mockAgent);
    }
  }

  /**
   * Demonstrate composable function calls
   */
  async demonstrateComposition() {
    console.log('\n📋 Demonstrating Composable Functions:\n');

    // 1. Health check
    console.log('1️⃣  Running health check...');
    const health = await this.coordinator.callFunction('health-check');
    console.log(JSON.stringify(health, null, 2));

    // 2. Aggregate metrics
    console.log('\n2️⃣  Aggregating metrics...');
    const metrics = await this.coordinator.callFunction('aggregate-metrics');
    console.log(JSON.stringify(metrics, null, 2));

    // 3. Broadcast transfer
    console.log('\n3️⃣  Broadcasting transfer...');
    const broadcast = await this.coordinator.callFunction('broadcast-transfer', {
      agentId: 'agent-1',
      txHash: '0x123abc',
      amount: '1000000000000000000',
    });
    console.log(JSON.stringify(broadcast, null, 2));

    // 4. Coordinated rebalance
    console.log('\n4️⃣  Initiating coordinated rebalance...');
    const rebalance = await this.coordinator.callFunction('coordinated-rebalance', {
      sourceAgentId: 'agent-1',
      targetAgentId: 'agent-2',
      amount: '500000000000000000',
    });
    console.log(JSON.stringify(rebalance, null, 2));

    // 5. Get coordinator status
    console.log('\n5️⃣  Coordinator Status:');
    console.log(JSON.stringify(this.coordinator.getStatus(), null, 2));

    // 6. View event bus
    console.log('\n6️⃣  Event Bus (last 5 events):');
    const events = this.coordinator.eventBus.slice(-5);
    console.log(JSON.stringify(events, null, 2));
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const orchestrator = new MultiAgentOrchestrator();

  // Setup multiple agents
  const agentConfigs = [
    {
      id: 'agent-1',
      token: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      recipient: '0x1234567890abcdef',
      minThreshold: '1000000000000000000',
      transferAmount: '100000000000000000',
    },
    {
      id: 'agent-2',
      token: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
      recipient: '0xfedcba0987654321',
      minThreshold: '500000000000000000',
      transferAmount: '50000000000000000',
    },
    {
      id: 'agent-3',
      token: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
      recipient: '0xabcdef1234567890',
      minThreshold: '2000000000000000000',
      transferAmount: '200000000000000000',
    },
  ];

  await orchestrator.setupAgents(agentConfigs);

  // Demonstrate composition
  await orchestrator.demonstrateComposition();

  console.log('\n✅ Multi-agent orchestration example complete!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
