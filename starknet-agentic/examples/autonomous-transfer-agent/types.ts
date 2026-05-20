/**
 * Type definitions for Autonomous Transfer Agent
 */

export interface ExecutionLogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'SUCCESS' | 'WARNING';
  message: string;
  [key: string]: any;
}

export interface TransferConfig {
  RPC_URL: string;
  ACCOUNT_ADDRESS: string;
  PRIVATE_KEY: string;
  TOKEN_ADDRESS: string;
  TRANSFER_RECIPIENT: string;
  MIN_BALANCE_THRESHOLD: bigint;
  TRANSFER_AMOUNT: bigint;
  ALERT_WEBHOOK_URL?: string;
  CHECK_INTERVAL_MS: number;
}

export interface ComposableFunctionResult {
  status: string;
  [key: string]: any;
}

export interface AgentReport {
  status: 'running' | 'stopped';
  transferCount: number;
  logs: ExecutionLogEntry[];
  config: {
    token: string;
    recipient: string;
    minThreshold: string;
    transferAmount: string;
  };
}

export interface TransferCondition {
  balance: bigint;
  threshold: bigint;
  isValid: boolean;
}

export interface AlertPayload {
  text: string;
  attachments: Array<{
    color: string;
    text: string;
    ts: number;
  }>;
}

export type ComposableFunctionHandler = (params: Record<string, any>) => Promise<ComposableFunctionResult>;
