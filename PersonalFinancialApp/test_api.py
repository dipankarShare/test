#!/usr/bin/env python3
"""
Test script for the credit card parsing API
"""

import requests
import json

def test_credit_card_api():
    """Test the credit card parsing API endpoints"""
    
    base_url = "http://localhost:8000"
    
    print("🔍 TESTING CREDIT CARD API ENDPOINTS")
    print("=" * 50)
    
    # Test 1: Check if server is running
    try:
        response = requests.get(f"{base_url}/docs")
        if response.status_code == 200:
            print("✅ Server is running")
        else:
            print(f"❌ Server returned status: {response.status_code}")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running on port 8000")
        return
    
    # Test 2: Check available endpoints
    print("\n🔍 Available endpoints:")
    try:
        response = requests.get(f"{base_url}/openapi.json")
        if response.status_code == 200:
            openapi = response.json()
            paths = openapi.get('paths', {})
            for path, methods in paths.items():
                if 'credit' in path.lower() or 'statement' in path.lower():
                    print(f"  {list(methods.keys())} {path}")
        else:
            print(f"❌ Could not get OpenAPI spec: {response.status_code}")
    except Exception as e:
        print(f"❌ Error getting OpenAPI spec: {e}")
    
    # Test 3: Test credit card parsing endpoint (without file)
    print("\n🔍 Testing credit card parsing endpoint...")
    try:
        # Test with empty data to see the error response
        response = requests.post(f"{base_url}/parse-credit-card-statement")
        print(f"Response status: {response.status_code}")
        if response.status_code == 422:  # Validation error expected
            print("✅ Endpoint is working (validation error as expected)")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing endpoint: {e}")
    
    # Test 4: Check if there are any existing credit accounts
    print("\n🔍 Checking existing credit accounts...")
    try:
        response = requests.get(f"{base_url}/credit-accounts")
        if response.status_code == 200:
            accounts = response.json()
            print(f"Found {len(accounts)} credit accounts")
            for account in accounts:
                print(f"  - {account.get('name', 'Unknown')} (ID: {account.get('id', 'Unknown')})")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error checking credit accounts: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 API TEST COMPLETE")
    print("\nTo test with a real PDF:")
    print("1. Use the frontend at http://localhost:3000")
    print("2. Or use curl: curl -X POST -F 'file=@your_statement.pdf' http://localhost:8000/parse-credit-card-statement")

if __name__ == "__main__":
    test_credit_card_api()
