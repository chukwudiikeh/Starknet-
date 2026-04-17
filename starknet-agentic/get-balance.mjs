#!/usr/bin/env node

import { RpcProvider, Contract } from "https://esm.sh/starknet@6.7.0";

const RPC_URL = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/Kt4UE9JGxg8btn6ftlYcL";
const ACCOUNT_ADDRESS = "0x04C6e22cEC1f6b4Cb9eA778A61E5f15aE99B69A8C9EB816b70882222138aDb8D";
const ETH_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "felt" }],
    outputs: [{ name: "balance", type: "Uint256" }],
    stateMutability: "view",
  },
  {
    name: "decimals",
    type: "function",
    inputs: [],
    outputs: [{ name: "decimals", type: "u8" }],
    stateMutability: "view",
  },
];

const provider = new RpcProvider({ nodeUrl: RPC_URL });

const contract = new Contract(ERC20_ABI, ETH_ADDRESS, provider);

try {
  const [balance, decimals] = await Promise.all([
    contract.balanceOf(ACCOUNT_ADDRESS),
    contract.decimals(),
  ]);

  const balanceBigInt = typeof balance === "bigint" ? balance : BigInt(balance.toString());
  const decimalsNum = typeof decimals === "number" ? decimals : Number(decimals);
  const balanceFormatted = (Number(balanceBigInt) / Math.pow(10, decimalsNum)).toFixed(6);

  console.log("\n=== Starknet Account Balance ===");
  console.log(`Address: ${ACCOUNT_ADDRESS}`);
  console.log(`Token: ETH`);
  console.log(`Balance: ${balanceFormatted} ETH`);
  console.log(`Raw: ${balanceBigInt.toString()}`);
  console.log("================================\n");
} catch (error) {
  console.error("Error fetching balance:", error);
  process.exit(1);
}
