#!/usr/bin/env python3
"""
Test script to test the credit card parser integration
"""

import os
import json
import sys
sys.path.append('backend')

from credit_card_parser import CreditCardParser

def test_parser_integration():
    """Test the credit card parser with sample data"""
    
    print("🔍 TESTING CREDIT CARD PARSER INTEGRATION")
    print("=" * 50)
    
    # Change to backend directory to load configs
    original_dir = os.getcwd()
    os.chdir('backend')
    
    try:
        # Create parser instance
        parser = CreditCardParser()
        
        # Check if Chase config is loaded
        if 'chase_credit' not in parser.providers:
            print("❌ Chase config not loaded!")
            print(f"Available providers: {list(parser.providers.keys())}")
            return
        
        print("✅ Chase config loaded successfully")
        print(f"Provider: {parser.providers['chase_credit']['name']}")
        
        # Test with sample Chase statement text
        sample_text = """
        CHASE CREDIT CARD STATEMENT
        
        Statement Date: 12/14/24
        Payment Due Date: 01/08/25
        New Balance: $64.72
        Minimum Payment Due: $25.00
        
        ACCOUNT SUMMARY
        PURCHASE TRANSACTIONS
        12/16 Ultra Pure Water Tracy CA 48.00
        12/27 UA INFLT 0164460117919 HOUSTON TX 8.00
        01/08 SAHI SHEIKH INC SUNNYVALE CA 8.72
        Total Purchases
        Payment Information
        """
        
        print("\n📄 Sample Chase statement text:")
        print(sample_text)
        
        # Test the parsing logic directly
        print("\n🔍 Testing transaction extraction...")
        
        # Get Chase config
        chase_config = parser.providers['chase_credit']
        patterns = chase_config['patterns']
        
        # Find transaction section
        section_patterns = patterns['transactions_section']
        start_markers = section_patterns.get('start_patterns', [])
        end_markers = section_patterns.get('end_patterns', [])
        
        print(f"Start markers: {start_markers}")
        print(f"End markers: {end_markers}")
        
        # Find transactions section
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
        primary_pattern = patterns.get('transaction_line', {}).get('pattern', '')
        if primary_pattern:
            transaction_patterns.append({
                'pattern': primary_pattern,
                'groups': patterns.get('transaction_line', {}).get('groups', {})
            })
        
        # Alternative patterns
        alt_patterns = patterns.get('alternative_transaction_patterns', [])
        transaction_patterns.extend(alt_patterns)
        
        print(f"\n🔍 Testing {len(transaction_patterns)} transaction patterns...")
        
        transactions = []
        for pattern_info in transaction_patterns:
            pattern = pattern_info['pattern']
            groups = pattern_info['groups']
            
            print(f"\nTesting pattern: {pattern}")
            
            for line in transaction_lines:
                import re
                match = re.search(pattern, line)
                if match:
                    transaction = {
                        'date': match.group(groups.get('date', 1)),
                        'description': match.group(groups.get('description', 2)).strip(),
                        'amount': match.group(groups.get('amount', 4 if 'location' in groups else 3))
                    }
                    
                    # If we have a location field, append it to the description
                    if 'location' in groups and groups.get('location'):
                        location = match.group(groups.get('location'))
                        if location:
                            transaction['description'] = f"{transaction['description']} {location}"
                    
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
        
        # Test the format_for_import method
        if transactions:
            print("\n🔍 Testing format_for_import...")
            
            # Create mock parsed data
            mock_parsed_data = {
                'provider': 'Chase Credit Card',
                'provider_key': 'chase_credit',
                'statement_date': '12/14/24',
                'payment_due_date': '01/08/25',
                'new_balance': '64.72',
                'minimum_payment_due': '25.00',
                'transactions': transactions
            }
            
            # Format for import
            import_data = parser.format_for_import(mock_parsed_data)
            
            print("Formatted import data:")
            print(json.dumps(import_data, indent=2))
            
            print(f"\n✅ Import summary:")
            print(f"  Provider: {import_data.get('provider')}")
            print(f"  Statement Date: {import_data.get('statement_date')}")
            print(f"  Total Transactions: {import_data.get('total_transactions')}")
            print(f"  New Balance: {import_data.get('new_balance')}")
    
    finally:
        # Restore original directory
        os.chdir(original_dir)
    
    print("\n" + "=" * 50)
    print("🎯 PARSER INTEGRATION TEST COMPLETE")

if __name__ == "__main__":
    test_parser_integration()
