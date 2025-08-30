#!/usr/bin/env python3
"""
Test script to verify Chase transaction patterns work with real data
"""

import json
import re

def test_chase_patterns():
    """Test the new Chase transaction patterns"""
    
    print("=== TESTING CHASE TRANSACTION PATTERNS ===")
    
    # Load Chase config
    with open("backend/chase_credit_formats.json", 'r') as f:
        chase_config = json.load(f)
    
    # Your actual transaction examples
    real_transactions = [
        "12/16 Ultra Pure Water Tracy CA 48.00",
        "12/27 UA INFLT 0164460117919 HOUSTON TX 8.00",
        "01/08 SAHI SHEIKH INC SUNNYVALE CA 8.72"
    ]
    
    print("Real Chase transactions:")
    for i, t in enumerate(real_transactions):
        print(f"  {i+1}. {t}")
    
    # Test primary pattern
    primary_pattern = chase_config['chase_credit']['patterns']['transaction_line']['pattern']
    primary_groups = chase_config['chase_credit']['patterns']['transaction_line']['groups']
    
    print(f"\n🔍 Primary pattern: {primary_pattern}")
    print(f"Primary groups: {primary_groups}")
    
    print("\nTesting primary pattern:")
    for i, line in enumerate(real_transactions):
        match = re.search(primary_pattern, line)
        if match:
            print(f"✅ Line {i+1} MATCHES: {line}")
            print(f"  Date: {match.group(primary_groups.get('date', 1))}")
            print(f"  Description: {match.group(primary_groups.get('description', 2)).strip()}")
            if 'location' in primary_groups:
                location = match.group(primary_groups.get('location', 3))
                print(f"  Location: {location}")
            amount = match.group(primary_groups.get('amount', 4 if 'location' in primary_groups else 3))
            print(f"  Amount: {amount}")
        else:
            print(f"❌ Line {i+1} NO MATCH: {line}")
    
    # Test alternative patterns
    alt_patterns = chase_config['chase_credit']['patterns'].get('alternative_transaction_patterns', [])
    print(f"\n🔍 Testing {len(alt_patterns)} alternative patterns...")
    
    for j, pattern_info in enumerate(alt_patterns):
        pattern = pattern_info['pattern']
        groups = pattern_info['groups']
        
        print(f"\nAlternative pattern {j+1}: {pattern}")
        print(f"Groups: {groups}")
        
        for i, line in enumerate(real_transactions):
            match = re.search(pattern, line)
            if match:
                print(f"✅ Line {i+1} MATCHES: {line}")
                print(f"  Date: {match.group(groups.get('date', 1))}")
                print(f"  Description: {match.group(groups.get('description', 2)).strip()}")
                if 'location' in groups:
                    location = match.group(groups.get('location', 3))
                    print(f"  Location: {location}")
                amount = match.group(groups.get('amount', 4 if 'location' in groups else 3))
                print(f"  Amount: {amount}")
            else:
                print(f"❌ Line {i+1} NO MATCH: {line}")
    
    # Test the complete parsing logic
    print(f"\n🔍 Testing complete parsing logic...")
    
    # Simulate the parsing process
    for line in real_transactions:
        print(f"\nProcessing: {line}")
        
        # Try each pattern
        for pattern_info in [{'pattern': primary_pattern, 'groups': primary_groups}] + alt_patterns:
            pattern = pattern_info['pattern']
            groups = pattern_info['groups']
            
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
                
                print(f"✅ Parsed: {transaction}")
                break
        else:
            print(f"❌ No pattern matched")

if __name__ == "__main__":
    test_chase_patterns()
