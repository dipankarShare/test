#!/usr/bin/env python3
"""
Comprehensive debug script for transaction extraction to identify why transactions aren't being imported
"""

import json
import re
import os
from typing import Dict, List, Optional

def test_transaction_patterns():
    """Test transaction patterns with sample data"""
    
    print("=== TESTING TRANSACTION PATTERNS ===")
    
    # Load Chase config
    with open("backend/chase_credit_formats.json", 'r') as f:
        chase_config = json.load(f)
    
    # Sample transaction lines that might appear in Chase statements
    sample_transactions = [
        "12/14  AMAZON.COM PURCHASE 12/14  $45.67",
        "12/15  STARBUCKS COFFEE  $4.50",
        "12/16  WALMART SUPERCENTER  $89.99",
        "12/17  GAS STATION  $35.00",
        "12/18  RESTAURANT  $67.89",
        "12/19  ONLINE PURCHASE  $123.45",
        "12/20  GROCERY STORE  $78.90",
        "12/21  PHARMACY  $23.45",
        "12/22  UTILITY BILL  $156.78",
        "12/23  INSURANCE  $89.99"
    ]
    
    # Test primary pattern
    primary_pattern = chase_config['chase_credit']['patterns']['transaction_line']['pattern']
    print(f"\n🔍 Primary pattern: {primary_pattern}")
    
    matches = 0
    for i, line in enumerate(sample_transactions):
        match = re.search(primary_pattern, line)
        if match:
            print(f"✅ Line {i+1} MATCHES: {line}")
            print(f"  Groups: {match.groups()}")
            matches += 1
        else:
            print(f"❌ Line {i+1} NO MATCH: {line}")
    
    print(f"\nPrimary pattern matches: {matches}/{len(sample_transactions)}")
    
    # Test alternative patterns
    alt_patterns = chase_config['chase_credit']['patterns'].get('alternative_transaction_patterns', [])
    print(f"\n🔍 Testing {len(alt_patterns)} alternative patterns...")
    
    for j, pattern_info in enumerate(alt_patterns):
        pattern = pattern_info['pattern']
        groups = pattern_info['groups']
        print(f"\nAlternative pattern {j+1}: {pattern}")
        
        matches = 0
        for i, line in enumerate(sample_transactions):
            match = re.search(pattern, line)
            if match:
                print(f"✅ Line {i+1} MATCHES: {line}")
                print(f"  Groups: {match.groups()}")
                matches += 1
            else:
                print(f"❌ Line {i+1} NO MATCH: {line}")
        
        print(f"Alternative pattern {j+1} matches: {matches}/{len(sample_transactions)}")

def test_section_markers():
    """Test section marker detection"""
    
    print("\n=== TESTING SECTION MARKERS ===")
    
    # Load Chase config
    with open("backend/chase_credit_formats.json", 'r') as f:
        chase_config = json.load(f)
    
    section_patterns = chase_config['chase_credit']['patterns']['transactions_section']
    start_markers = section_patterns.get('start_patterns', [])
    end_markers = section_patterns.get('end_patterns', [])
    
    print(f"Start markers: {start_markers}")
    print(f"End markers: {end_markers}")
    
    # Sample text that might contain these markers
    sample_text = """
    ACCOUNT SUMMARY
    PURCHASE TRANSACTIONS
    12/14  AMAZON.COM PURCHASE 12/14  $45.67
    12/15  STARBUCKS COFFEE  $4.50
    12/16  WALMART SUPERCENTER  $89.99
    Total Purchases
    Payment Information
    """
    
    lines = sample_text.split('\n')
    in_transactions = False
    transaction_lines = []
    
    print(f"\n🔍 Testing section detection with sample text:")
    print(f"Sample text:\n{sample_text}")
    
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
    return transaction_lines

def test_improved_patterns():
    """Test improved transaction patterns"""
    
    print("\n=== TESTING IMPROVED PATTERNS ===")
    
    # More realistic Chase transaction formats
    realistic_transactions = [
        "12/14  AMAZON.COM PURCHASE 12/14  $45.67",
        "12/15  STARBUCKS COFFEE  $4.50",
        "12/16  WALMART SUPERCENTER  $89.99",
        "12/17  GAS STATION  $35.00",
        "12/18  RESTAURANT  $67.89",
        "12/19  ONLINE PURCHASE  $123.45",
        "12/20  GROCERY STORE  $78.90",
        "12/21  PHARMACY  $23.45",
        "12/22  UTILITY BILL  $156.78",
        "12/23  INSURANCE  $89.99"
    ]
    
    # Improved pattern that should work better
    improved_pattern = r"(\d{1,2}/\d{1,2})\s+(.+?)\s+\$?([\d,]+\.?\d*)"
    print(f"Improved pattern: {improved_pattern}")
    
    matches = 0
    for i, line in enumerate(realistic_transactions):
        match = re.search(improved_pattern, line)
        if match:
            print(f"✅ Line {i+1} MATCHES: {line}")
            print(f"  Date: {match.group(1)}")
            print(f"  Description: {match.group(2).strip()}")
            print(f"  Amount: {match.group(3)}")
            matches += 1
        else:
            print(f"❌ Line {i+1} NO MATCH: {line}")
    
    print(f"\nImproved pattern matches: {matches}/{len(realistic_transactions)}")

def main():
    """Run all tests"""
    print("🔍 COMPREHENSIVE TRANSACTION EXTRACTION DEBUG")
    print("=" * 50)
    
    # Test 1: Transaction patterns
    test_transaction_patterns()
    
    # Test 2: Section markers
    test_section_markers()
    
    # Test 3: Improved patterns
    test_improved_patterns()
    
    print("\n" + "=" * 50)
    print("🔍 DEBUG COMPLETE")

if __name__ == "__main__":
    main()
