#!/usr/bin/env python3
"""
Debug script for Chase credit card parsing to see transaction extraction
"""

import json
import re
import os
from typing import Dict, List, Optional
import PyPDF2
import pdfplumber

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF using multiple methods"""
    text = ""
    
    try:
        # Method 1: Try PyPDF2 first (better for Chase statements)
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        if text.strip():
            return text
    except Exception as e:
        print(f"PyPDF2 failed: {e}")
    
    try:
        # Method 2: Try pdfplumber as fallback
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"pdfplumber failed: {e}")
    
    return text

def debug_chase_parsing():
    """Debug the Chase credit card parsing process"""
    
    pdf_path = r"D:\Personal\Finance\BankStatements\chase\ChaseCreditCard2025Aug.pdf"
    
    print("=== DEBUGGING CHASE CREDIT CARD PARSING ===")
    print(f"PDF Path: {pdf_path}")
    
    # Load Chase config
    with open("backend/chase_credit_formats.json", 'r') as f:
        chase_config = json.load(f)
    
    print(f"\nChase Config: {json.dumps(chase_config, indent=2)}")
    
    # Extract text
    text = extract_text_from_pdf(pdf_path)
    print(f"\nExtracted text length: {len(text)}")
    print(f"First 500 chars: {text[:500]}")
    
    # Check for transaction section markers
    section_patterns = chase_config['chase_credit']['patterns']['transactions_section']
    start_markers = section_patterns.get('start_patterns', [])
    end_markers = section_patterns.get('end_patterns', [])
    
    print(f"\nStart markers: {start_markers}")
    print(f"End markers: {end_markers}")
    
    # Look for these markers in the text
    lines = text.split('\n')
    print(f"\nTotal lines: {len(lines)}")
    
    # Find transaction section
    in_transactions = False
    transaction_lines = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Check if we're entering transactions section
        if any(marker.lower() in line.lower() for marker in start_markers):
            print(f"FOUND START MARKER at line {i}: '{line}'")
            in_transactions = True
            continue
        
        # Check if we're leaving transactions section
        if in_transactions and any(marker.lower() in line.lower() for marker in end_markers):
            print(f"FOUND END MARKER at line {i}: '{line}'")
            break
        
        # Collect transaction lines
        if in_transactions and line:
            transaction_lines.append(line)
            if len(transaction_lines) <= 10:  # Show first 10 lines
                print(f"Transaction line {len(transaction_lines)}: '{line}'")
    
    print(f"\nTotal transaction lines found: {len(transaction_lines)}")
    
    # Test transaction pattern
    transaction_pattern = chase_config['chase_credit']['patterns']['transaction_line']['pattern']
    print(f"\nTransaction pattern: {transaction_pattern}")
    
    # Test pattern on first few transaction lines
    for i, line in enumerate(transaction_lines[:5]):
        match = re.search(transaction_pattern, line)
        if match:
            print(f"Line {i+1} MATCHES: {line}")
            print(f"  Groups: {match.groups()}")
        else:
            print(f"Line {i+1} NO MATCH: {line}")

if __name__ == "__main__":
    debug_chase_parsing()
