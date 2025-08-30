#!/usr/bin/env python3
"""
Test script for Chase credit card parsing
"""

import requests
import json

def test_chase_parsing():
    """Test parsing a Chase credit card PDF"""
    
    # Test the credit card parsing endpoint
    url = "http://localhost:8000/parse-credit-card-statement"
    
    # Test with a Chase PDF file
    pdf_path = r"D:\Personal\Finance\BankStatements\chase\ChaseCreditCard2025Aug.pdf"
    
    try:
        with open(pdf_path, 'rb') as f:
            files = {'file': ('ChaseCreditCard2025Aug.pdf', f, 'application/pdf')}
            
            print(f"Testing credit card parsing with: {pdf_path}")
            response = requests.post(url, files=files)
            
            print(f"Status Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                print("Success! Parsed data:")
                print(json.dumps(result, indent=2))
            else:
                print(f"Error: {response.text}")
                
    except Exception as e:
        print(f"Error testing credit card parsing: {e}")

if __name__ == "__main__":
    test_chase_parsing()
