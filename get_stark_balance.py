#!/usr/bin/env python3
"""
Fetch Starknet balances (ETH and STRK)
"""

import json
import urllib.request

RPC_URL = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/Kt4UE9JGxg8btn6ftlYcL"
ACCOUNT = "0x04C6e22cEC1f6b4Cb9eA778A61E5f15aE99B69A8C9EB816b70882222138aDb8D"

# Token addresses on Starknet Sepolia
TOKENS = {
    "ETH": "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    "STRK": "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"
}

def get_balance(token_address):
    payload = {
        "jsonrpc": "2.0",
        "method": "starknet_call",
        "params": {
            "request": {
                "contract_address": token_address,
                "entry_point_selector": "0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e",
                "calldata": [ACCOUNT]
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
            data = json.load(response)
            
            if "error" in data:
                return None
            
            result = data.get("result", [])
            if not result or len(result) < 2:
                return None
            
            low = int(result[0], 16) if isinstance(result[0], str) else result[0]
            high = int(result[1], 16) if isinstance(result[1], str) else result[1]
            
            balance_wei = (high * (2**128)) + low
            balance_token = balance_wei / 1e18
            
            return balance_token
    except Exception as e:
        print(f"Error fetching {token_address}: {e}")
        return None

# Fetch all balances
print("\n" + "="*60)
print("💰 STARKNET ACCOUNT BALANCES")
print("="*60)
print(f"Address: {ACCOUNT}")
print(f"Network: Starknet Sepolia")
print("-"*60)

for token_name, token_addr in TOKENS.items():
    balance = get_balance(token_addr)
    if balance is not None:
        print(f"{token_name:8} Balance: {balance:20.6f}")
    else:
        print(f"{token_name:8} Balance: ERROR")

print("="*60 + "\n")
