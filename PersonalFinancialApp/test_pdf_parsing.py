#!/usr/bin/env python3
"""
Test script to debug PDF parsing issues
"""

import json
import re
from credit_card_parser import CreditCardParser

def test_with_sample_data():
    """Test the parser with sample text data"""
    
    print("=== TESTING WITH SAMPLE DATA ===")
    
    # Sample Chase statement text
    sample_text = """
    CHASE CREDIT CARD STATEMENT
    
    Statement Date: 12/14/24
    Payment Due Date: 01/08/25
    New Balance: $64.72
    Minimum Payment Due: $25.00
    
    ACCOUNT SUMMARY
    PURCHASE TRANSACTIONS
    12/14  AMAZON.COM PURCHASE 12/14  $45.67
    12/15  STARBUCKS COFFEE  $4.50
    12/16  WALMART SUPERCENTER  $89.99
    12/17  GAS STATION  $35.00
    12/18  RESTAURANT  $67.89
    Total Purchases
    Payment Information
    """
    
    print("Sample text:")
    print(sample_text)
    
    # Test the parser's transaction extraction logic
    parser = CreditCardParser()
    
    # Load Chase config
    chase_config = parser.providers.get('chase_credit', {})
    if not chase_config:
        print("❌ Chase config not found!")
        return
    
    print(f"\nChase config loaded: {chase_config.get('name', 'Unknown')}")
    
    # Test transaction section detection
    section_patterns = chase_config['patterns']['transactions_section']
    start_markers = section_patterns.get('start_patterns', [])
    end_markers = section_patterns.get('end_patterns', [])
    
    print(f"\nStart markers: {start_markers}")
    print(f"End markers: {end_markers}")
    
    # Find transaction section
    lines = sample_text.split('\n')
    in_transactions = False
    transaction_lines = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Check if we're entering transactions section
        if any(marker.lower() in line.lower() for marker in start_markers):
            print(f"✅ FOUND START MARKER at line {i}: '{line}'")
            in_transactions = True
            continue
        
        # Check if we're leaving transactions section
        if in_transactions and any(marker.lower() in line.lower() for marker in end_markers):
            print(f"🛑 FOUND END MARKER at line {i}: '{line}'")
            break
        
        # Collect transaction lines
        if in_transactions and line:
            transaction_lines.append(line)
            print(f"📝 Added transaction line: '{line}'")
    
    print(f"\nTotal transaction lines found: {len(transaction_lines)}")
    
    # Test transaction patterns
    transaction_patterns = []
    
    # Primary pattern
    primary_pattern = chase_config['patterns'].get('transaction_line', {}).get('pattern', '')
    if primary_pattern:
        transaction_patterns.append({
            'pattern': primary_pattern,
            'groups': chase_config['patterns'].get('transaction_line', {}).get('groups', {})
        })
    
    # Alternative patterns
    alt_patterns = chase_config['patterns'].get('alternative_transaction_patterns', [])
    transaction_patterns.extend(alt_patterns)
    
    print(f"\n🔍 Testing {len(transaction_patterns)} transaction patterns...")
    
    transactions = []
    for pattern_info in transaction_patterns:
        pattern = pattern_info['pattern']
        groups = pattern_info['groups']
        
        print(f"\nTesting pattern: {pattern}")
        
        for line in transaction_lines:
            match = re.search(pattern, line)
            if match:
                transaction = {
                    'date': match.group(groups.get('date', 1)),
                    'description': match.group(groups.get('description', 2)).strip(),
                    'amount': match.group(groups.get('amount', 3))
                }
                
                # Check if this transaction is already added (avoid duplicates)
                if not any(t['date'] == transaction['date'] and 
                         t['description'] == transaction['description'] and 
                         t['amount'] == transaction['amount'] 
                         for t in transactions):
                    transactions.append(transaction)
                    print(f"✅ Parsed transaction: {transaction}")
            else:
                print(f"❌ Line didn't match pattern: '{line}'")
        
        # If we found transactions with this pattern, break
        if transactions:
            print(f"✅ Successfully extracted {len(transactions)} transactions with pattern: {pattern}")
            break
    
    print(f"\nFinal result: {len(transactions)} transactions extracted")
    for i, t in enumerate(transactions):
        print(f"  {i+1}. {t['date']} - {t['description']} - {t['amount']}")

def main():
    """Run the test"""
    print("🔍 PDF PARSING DEBUG TEST")
    print("=" * 50)
    
    test_with_sample_data()
    
    print("\n" + "=" * 50)
    print("🔍 TEST COMPLETE")

if __name__ == "__main__":
    main()

