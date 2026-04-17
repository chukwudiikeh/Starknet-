#!/usr/bin/env python3
"""
Fetch Starknet ETH balance for your account
"""

import json
import urllib.request
from urllib.error import URLError

RPC_URL = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/Kt4UE9JGxg8btn6ftlYcL"
ACCOUNT_ADDRESS = "0x04C6e22cEC1f6b4Cb9eA778A61E5f15aE99B69A8C9EB816b70882222138aDb8D"
ETH_CONTRACT = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
BALANCE_SELECTOR = "0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e"

payload = {
    "jsonrpc": "2.0",
    "method": "starknet_call",
    "params": {
        "request": {
            "contract_address": ETH_CONTRACT,
            "entry_point_selector": BALANCE_SELECTOR,
            "calldata": [ACCOUNT_ADDRESS]
        },
        "block_id": "latest"
    },
    "id": 1
}

try:
    req = urllib.request.Request(
        RPC_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    
    with urllib.request.urlopen(req, timeout=15) as response:
        result_json = json.load(response)
        
        if "error" in result_json:
            print(f"❌ RPC Error: {result_json['error']}")
        elif "result" in result_json:
            result = result_json["result"]
            
            # Parse Uint256 (low, high) from hex
            low = int(result[0], 16) if result else 0
            high = int(result[1], 16) if len(result) > 1 else 0
            
            # Combine: balance = high * 2^128 + low
            balance_wei = (high * (2**128)) + low
            
            # Convert from wei (10^18) to ETH
            balance_eth = balance_wei / 1e18
            
            print("\n" + "="*50)
            print("🏦 STARKNET ACCOUNT BALANCE")
            print("="*50)
            print(f"Address: {ACCOUNT_ADDRESS}")
            print(f"Network: Starknet Sepolia")
            print(f"Balance: {balance_eth:.6f} ETH")
            print(f"Balance (wei): {balance_wei}")
            print("="*50 + "\n")
        else:
            print("❌ Unexpected response format:")
            print(json.dumps(result_json, indent=2))

except URLError as e:
    print(f"❌ Network error: {e}")
except json.JSONDecodeError as e:
    print(f"❌ JSON parse error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
