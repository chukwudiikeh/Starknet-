#!/usr/bin/env node

import https from 'https';

const payload = {
  jsonrpc: "2.0",
  method: "starknet_call",
  params: {
    request: {
      contract_address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
      entry_point_selector: "0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e",
      calldata: ["0x04C6e22cEC1f6b4Cb9eA778A61E5f15aE99B69A8C9EB816b70882222138aDb8D"]
    },
    block_id: "latest"
  },
  id: 1
};

const url = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/Kt4UE9JGxg8btn6ftlYcL";

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(url, options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.error) {
        console.error('RPC Error:', response.error);
        process.exit(1);
      }
      
      const result = response.result;
      if (!result || result.length < 2) {
        console.error('Invalid response format');
        process.exit(1);
      }
      
      const lowHex = result[0];
      const highHex = result[1];
      
      const low = BigInt(lowHex);
      const high = BigInt(highHex);
      const balance_wei = (high * (BigInt(2) ** BigInt(128))) + low;
      const balance_eth = Number(balance_wei) / 1e18;
      
      console.log('\n' + '='.repeat(50));
      console.log('🏦 STARKNET BALANCE');
      console.log('='.repeat(50));
      console.log(`Address: 0x04C6e22cEC1f6b4Cb9eA778A61E5f15aE99B69A8C9EB816b70882222138aDb8D`);
      console.log(`Network: Starknet Sepolia`);
      console.log(`ETH Balance: ${balance_eth.toFixed(6)}`);
      console.log(`Raw (wei): ${balance_wei.toString()}`);
      console.log('='.repeat(50) + '\n');
    } catch (err) {
      console.error('Parse error:', err.message);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('Network error:', err.message);
  process.exit(1);
});

req.write(JSON.stringify(payload));
req.end();
