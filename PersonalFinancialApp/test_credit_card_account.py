#!/usr/bin/env python3
"""
Test script for credit card account functionality
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_credit_card_account():
    """Test credit card account creation and functionality"""
    
    print("🧪 Testing Credit Card Account Functionality")
    print("=" * 50)
    
    try:
        # 1. Create a test bank
        print("\n1. Creating test bank...")
        bank_data = {"name": "Test Credit Card Bank"}
        response = requests.post(f"{BASE_URL}/banks", json=bank_data)
        if response.status_code == 200:
            bank = response.json()
            bank_id = bank["id"]
            print(f"✅ Bank created: {bank['name']} (ID: {bank_id})")
        else:
            print(f"❌ Failed to create bank: {response.text}")
            return
        
        # 2. Create a credit card account
        print("\n2. Creating credit card account...")
        account_data = {
            "name": "Chase Freedom Unlimited",
            "account_type": "credit"
        }
        response = requests.post(f"{BASE_URL}/banks/{bank_id}/accounts", json=account_data)
        if response.status_code == 200:
            account = response.json()
            account_id = account["id"]
            print(f"✅ Credit card account created: {account['name']} (ID: {account_id})")
            if "is_credit_card" in account:
                print(f"   - Credit card features enabled: {account['is_credit_card']}")
            if "message" in account:
                print(f"   - Message: {account['message']}")
        else:
            print(f"❌ Failed to create credit card account: {response.text}")
            return
        
        # 3. Test credit card info endpoint
        print("\n3. Testing credit card info endpoint...")
        response = requests.get(f"{BASE_URL}/accounts/{account_id}/credit-card-info")
        if response.status_code == 200:
            credit_info = response.json()
            print(f"✅ Credit card info retrieved:")
            print(f"   - Account: {credit_info['account_name']}")
            print(f"   - Type: {credit_info['account_type']}")
            print(f"   - Transaction count: {credit_info['transaction_count']}")
            print(f"   - Current balance: ${credit_info['current_balance']:.2f}")
            print(f"   - Amount owed: ${credit_info['amount_owed']:.2f}")
        else:
            print(f"❌ Failed to get credit card info: {response.text}")
        
        # 4. Test account type validation
        print("\n4. Testing account type validation...")
        invalid_account_data = {
            "name": "Invalid Account",
            "account_type": "invalid_type"
        }
        response = requests.post(f"{BASE_URL}/banks/{bank_id}/accounts", json=invalid_account_data)
        if response.status_code == 422:  # Validation error
            print("✅ Account type validation working: Invalid type rejected")
        else:
            print(f"❌ Account type validation failed: {response.status_code}")
        
        # 5. List accounts to verify
        print("\n5. Listing accounts...")
        response = requests.get(f"{BASE_URL}/banks/{bank_id}/accounts")
        if response.status_code == 200:
            accounts = response.json()
            print(f"✅ Found {len(accounts)} accounts:")
            for acc in accounts:
                print(f"   - {acc['name']} ({acc['account_type']}) - Balance: ${acc['balance']:.2f}")
        else:
            print(f"❌ Failed to list accounts: {response.text}")
        
        print("\n🎉 Credit card account testing completed successfully!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Make sure the backend server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")

if __name__ == "__main__":
    test_credit_card_account()
