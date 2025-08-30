#!/usr/bin/env python3
"""
Test script for credit card accounts in investment portfolio
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_investment_credit_card():
    """Test credit card account creation in investment portfolio"""
    
    print("🧪 Testing Credit Card Account in Investment Portfolio")
    print("=" * 60)
    
    try:
        # 1. Create a credit card investment account
        print("\n1. Creating credit card investment account...")
        account_data = {
            "name": "Chase Freedom Investment",
            "account_type": "credit",
            "custodian": "Chase Bank",
            "account_number": "1234"
        }
        response = requests.post(f"{BASE_URL}/investment-accounts", json=account_data)
        if response.status_code == 200:
            account = response.json()
            account_id = account["account_id"]
            print(f"✅ Credit card investment account created: {account_data['name']} (ID: {account_id})")
            if "is_credit_card" in account:
                print(f"   - Credit card features enabled: {account['is_credit_card']}")
            if "message" in account:
                print(f"   - Message: {account['message']}")
            if "credit_card_tips" in account:
                print(f"   - Tips: {len(account['credit_card_tips'])} credit card tips provided")
        else:
            print(f"❌ Failed to create credit card investment account: {response.text}")
            return
        
        # 2. List all investment accounts to verify
        print("\n2. Listing investment accounts...")
        response = requests.get(f"{BASE_URL}/investment-accounts")
        if response.status_code == 200:
            accounts = response.json()
            print(f"✅ Found {len(accounts)} investment accounts:")
            for acc in accounts:
                account_type_badge = "💳" if acc['account_type'] == 'credit' else "📊"
                print(f"   {account_type_badge} {acc['name']} ({acc['account_type']}) - ID: {acc['id']}")
        else:
            print(f"❌ Failed to list investment accounts: {response.text}")
        
        # 3. Test account type validation
        print("\n3. Testing investment account type validation...")
        invalid_account_data = {
            "name": "Invalid Investment Account",
            "account_type": "invalid_type"
        }
        response = requests.post(f"{BASE_URL}/investment-accounts", json=invalid_account_data)
        if response.status_code == 422:  # Validation error
            print("✅ Investment account type validation working: Invalid type rejected")
        else:
            print(f"❌ Investment account type validation failed: {response.status_code}")
        
        # 4. Test creating different account types
        print("\n4. Testing different account types...")
        test_accounts = [
            {"name": "Test Brokerage", "account_type": "brokerage", "custodian": "Test Broker"},
            {"name": "Test 401k", "account_type": "401k", "custodian": "Test Employer"},
            {"name": "Test Credit Card 2", "account_type": "credit", "custodian": "Test Bank"}
        ]
        
        for test_acc in test_accounts:
            response = requests.post(f"{BASE_URL}/investment-accounts", json=test_acc)
            if response.status_code == 200:
                print(f"   ✅ {test_acc['account_type']} account created successfully")
            else:
                print(f"   ❌ Failed to create {test_acc['account_type']} account: {response.text}")
        
        print("\n🎉 Investment portfolio credit card testing completed successfully!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Make sure the backend server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")

if __name__ == "__main__":
    test_investment_credit_card()
