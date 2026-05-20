import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { RpcProvider, Contract } from 'starknet';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

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
    ],
  },
];

async function fetchBalance() {
  const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });
  const token = new Contract({
    abi: ERC20_ABI,
    address: process.env.TOKEN_ADDRESS,
    providerOrAccount: provider,
  });

  const balance = await token.balance_of(process.env.STARKNET_ACCOUNT_ADDRESS);
  const balanceBn = typeof balance === 'bigint' ? balance : BigInt(balance);
  const balanceTokens = Number(balanceBn) / 1e18;

  console.log(`\n💰 Wallet Balance`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Account: ${process.env.STARKNET_ACCOUNT_ADDRESS}`);
  console.log(`Token: ${process.env.TOKEN_ADDRESS}`);
  console.log(`Balance: ${balanceTokens.toFixed(4)} STRK`);
  console.log(`Raw: ${balanceBn.toString()} wei\n`);
  
  return balanceBn;
}

fetchBalance().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
