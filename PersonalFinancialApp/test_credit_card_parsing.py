#!/usr/bin/env python3
"""
Test script for credit card statement parsing
"""

import requests
import json
import os
import sys

BASE_URL = "http://localhost:8000"

def test_credit_card_parsing():
    """Test credit card statement parsing functionality"""
    
    print("🧪 Testing Credit Card Statement Parsing")
    print("=" * 60)
    
    try:
        # 1. Test the parser configuration loading
        print("\n1. Testing parser configuration...")
        from credit_card_parser import CreditCardParser
        
        parser = CreditCardParser()
        print(f"✅ Loaded {len(parser.providers)} credit card providers:")
        for provider_key, provider_config in parser.providers.items():
            print(f"   - {provider_config.get('name', provider_key)}")
        
        # 2. Test provider detection
        print("\n2. Testing provider detection...")
        test_texts = [
            "Chase Freedom Unlimited Credit Card Statement",
            "Citi Double Cash Credit Card Statement", 
            "FSU Credit Union Credit Card Statement",
            "Generic Credit Card Statement"
        ]
        
        for test_text in test_texts:
            detected = parser.detect_provider(test_text)
            print(f"   '{test_text}' → {detected}")
        
        # 3. Test API endpoint availability
        print("\n3. Testing API endpoint...")
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print("❌ Backend is not responding")
            return
        
        # 4. Test credit card parsing endpoint
        print("\n4. Testing credit card parsing endpoint...")
        
        # Create a test PDF file (you would normally upload a real PDF)
        print("   Note: This test requires a real PDF file to be uploaded")
        print("   Use the endpoint: POST /parse-credit-card-statement")
        
        # 5. Test with sample data
        print("\n5. Testing parser with sample data...")
        
        # Test Chase credit card patterns
        chase_config = parser.providers.get('chase_credit', {})
        if chase_config:
            patterns = chase_config.get('patterns', {})
            
            # Test statement date extraction
            test_text = "Statement Date: 12/15/2024"
            if 'statement_date' in patterns:
                extracted = parser.extract_field(test_text, patterns['statement_date']['pattern'])
                print(f"   Statement Date: '{test_text}' → '{extracted}'")
            
            # Test due date extraction
            test_text = "Payment Due Date: 01/15/2025"
            if 'due_date' in patterns:
                extracted = parser.extract_field(test_text, patterns['due_date']['pattern'])
                print(f"   Due Date: '{test_text}' → '{extracted}'")
            
            # Test ending balance extraction
            test_text = "New Balance: $1,234.56"
            if 'ending_balance' in patterns:
                extracted = parser.extract_field(test_text, patterns['ending_balance']['pattern'])
                print(f"   Ending Balance: '{test_text}' → '{extracted}'")
            
            # Test minimum payment extraction
            test_text = "Minimum Payment Due: $25.00"
            if 'minimum_payment' in patterns:
                extracted = parser.extract_field(test_text, patterns['minimum_payment']['pattern'])
                print(f"   Minimum Payment: '{test_text}' → '{extracted}'")
        
        print("\n🎉 Credit card parsing testing completed successfully!")
        print("\n📋 Next Steps:")
        print("   1. Upload a real credit card PDF statement")
        print("   2. Use POST /parse-credit-card-statement endpoint")
        print("   3. The parser will automatically detect the provider")
        print("   4. Extract: Statement Date, Due Date, New Balance, Minimum Payment")
        print("   5. Import transactions with: date, description, amount")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("   Make sure you're in the backend directory")
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")

def test_with_real_pdf(pdf_file_path: str):
    """Test parsing with a real PDF file"""
    if not os.path.exists(pdf_file_path):
        print(f"❌ File not found: {pdf_file_path}")
        return
    
    print(f"🧪 Testing with real PDF: {pdf_file_path}")
    
    try:
        from credit_card_parser import CreditCardParser
        parser = CreditCardParser()
        
        # Parse the statement
        result = parser.parse_statement(pdf_file_path)
        
        if "error" in result:
            print(f"❌ Parsing error: {result['error']}")
            return
        
        print("\n✅ Parsed Result:")
        print(json.dumps(result, indent=2))
        
        # Format for import
        formatted = parser.format_for_import(result)
        print("\n📋 Formatted for Import:")
        print(json.dumps(formatted, indent=2))
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Test with a real PDF file
        test_with_real_pdf(sys.argv[1])
    else:
        # Run general tests
        test_credit_card_parsing()
