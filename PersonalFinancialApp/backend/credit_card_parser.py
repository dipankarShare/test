#!/usr/bin/env python3
"""
Credit Card Statement Parser
Parses credit card statements from different providers using provider-specific configurations
"""

import json
import re
import os
from typing import Dict, List, Optional, Tuple
import PyPDF2
import pdfplumber
import tabula
import pandas as pd

class CreditCardParser:
    def __init__(self):
        self.providers = {}
        self.load_provider_configs()
    
    def load_provider_configs(self):
        """Load all credit card provider configurations"""
        config_files = [
            "chase_credit_formats.json",
            "citi_credit_formats.json", 
            "fsu_credit_formats.json",
            "generic_credit_formats.json"
        ]
        
        for config_file in config_files:
            if os.path.exists(config_file):
                try:
                    with open(config_file, 'r') as f:
                        config = json.load(f)
                        for provider_key, provider_config in config.items():
                            self.providers[provider_key] = provider_config
                    print(f"Loaded {config_file}")
                except Exception as e:
                    print(f"Error loading {config_file}: {e}")
        
        print(f"Loaded {len(self.providers)} credit card providers")
    
    def detect_provider(self, text: str) -> str:
        """Detect which credit card provider the statement is from"""
        best_match = None
        best_score = 0
        
        for provider_key, provider_config in self.providers.items():
            keywords = provider_config.get('keywords', [])
            score = 0
            
            for keyword in keywords:
                if keyword.lower() in text.lower():
                    score += 1
            
            if score > best_score:
                best_score = score
                best_match = provider_key
        
        return best_match or "generic_credit_card"
    
    def extract_field(self, text: str, pattern: str) -> Optional[str]:
        """Extract a field using a regex pattern"""
        try:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        except Exception as e:
            print(f"Error extracting field with pattern {pattern}: {e}")
        return None
    
    def extract_transactions(self, text: str, provider_config: Dict) -> List[Dict]:
        """Extract transactions from the statement text"""
        transactions = []
        
        # Find transactions section
        patterns = provider_config['patterns']
        section_patterns = patterns.get('transactions_section', {})
        
        # Look for transaction section boundaries
        start_markers = section_patterns.get('start_patterns', [])
        end_markers = section_patterns.get('end_patterns', [])
        
        print(f"🔍 Looking for transaction section with start markers: {start_markers}")
        print(f"🔍 Looking for transaction section with end markers: {end_markers}")
        
        # Find the transactions section
        lines = text.split('\n')
        in_transactions = False
        transaction_lines = []
        
        print(f"🔍 Total lines in PDF: {len(lines)}")
        
        for i, line in enumerate(lines):
            line = line.strip()
            
            # Check if we're entering transactions section
            if any(marker.lower() in line.lower() for marker in start_markers):
                print(f"🔍 FOUND START MARKER at line {i}: '{line}'")
                in_transactions = True
                continue
            
            # Check if we're leaving transactions section
            if in_transactions and any(marker.lower() in line.lower() for marker in end_markers):
                print(f"🔍 FOUND END MARKER at line {i}: '{line}'")
                break
            
            # Collect transaction lines
            if in_transactions and line:
                transaction_lines.append(line)
                print(f"🔍 Added transaction line: '{line}'")
        
        print(f"🔍 Found {len(transaction_lines)} potential transaction lines")
        
        # Try multiple transaction patterns for better extraction
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
        
        print(f"🔍 Trying {len(transaction_patterns)} transaction patterns")
        
        # Parse individual transactions using all patterns
        for pattern_info in transaction_patterns:
            pattern = pattern_info['pattern']
            groups = pattern_info['groups']
            
            print(f"🔍 Testing pattern: {pattern}")
            
            for line in transaction_lines:
                match = re.search(pattern, line)
                if match:
                    transaction = {
                        'date': match.group(groups.get('date', 1)),
                        'description': match.group(groups.get('description', 2)).strip(),
                        'amount': match.group(groups.get('amount', 3))
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
                        print(f"🔍 Parsed transaction: {transaction}")
                else:
                    print(f"🔍 Line didn't match pattern: '{line}'")
            
            # If we found transactions with this pattern, break
            if transactions:
                print(f"🔍 Successfully extracted {len(transactions)} transactions with pattern: {pattern}")
                break
        
        print(f"🔍 Total transactions extracted: {len(transactions)}")
        return transactions
    
    def parse_statement(self, file_path: str, debug: bool = False) -> Dict:
        """Parse a credit card statement PDF"""
        try:
            # Extract text from PDF
            text = self.extract_text_from_pdf(file_path)
            if not text:
                return {"error": "Could not extract text from PDF"}
            
            if debug:
                print(f"🔍 DEBUG: Extracted text length: {len(text)}")
                print(f"🔍 DEBUG: First 1000 chars: {text[:1000]}")
                print(f"🔍 DEBUG: Last 1000 chars: {text[-1000:]}")
            
            # Detect provider
            provider_key = self.detect_provider(text)
            provider_config = self.providers.get(provider_key, {})
            
            print(f"Detected provider: {provider_config.get('name', provider_key)}")
            
            if debug:
                print(f"🔍 DEBUG: Provider config: {json.dumps(provider_config, indent=2)}")
            
            # Extract required fields
            patterns = provider_config.get('patterns', {})
            extracted_data = {}
            
            # Extract statement date
            if 'statement_date' in patterns:
                extracted_data['statement_date'] = self.extract_field(
                    text, patterns['statement_date']['pattern']
                )
            
            # Extract payment due date
            if 'payment_due_date' in patterns:
                extracted_data['payment_due_date'] = self.extract_field(
                    text, patterns['payment_due_date']['pattern']
                )
            elif 'due_date' in patterns:  # Fallback for backward compatibility
                extracted_data['payment_due_date'] = self.extract_field(
                    text, patterns['due_date']['pattern']
                )
            
            # Extract new balance
            if 'new_balance' in patterns:
                extracted_data['new_balance'] = self.extract_field(
                    text, patterns['new_balance']['pattern']
                )
            elif 'ending_balance' in patterns:  # Fallback for backward compatibility
                extracted_data['new_balance'] = self.extract_field(
                    text, patterns['ending_balance']['pattern']
                )
            
            # Extract minimum payment due
            if 'minimum_payment_due' in patterns:
                extracted_data['minimum_payment_due'] = self.extract_field(
                    text, patterns['minimum_payment_due']['pattern']
                )
            elif 'minimum_payment' in patterns:  # Fallback for backward compatibility
                extracted_data['minimum_payment_due'] = self.extract_field(
                    text, patterns['minimum_payment']['pattern']
                )
            
            # Extract transactions
            transactions = self.extract_transactions(text, provider_config)
            extracted_data['transactions'] = transactions
            
            # Add metadata
            extracted_data['provider'] = provider_config.get('name', provider_key)
            extracted_data['provider_key'] = provider_key
            extracted_data['total_transactions'] = len(transactions)
            
            if debug:
                print(f"🔍 DEBUG: Extracted data: {json.dumps(extracted_data, indent=2)}")
            
            # Validate required fields
            required_fields = provider_config.get('required_fields', [])
            missing_fields = [field for field in required_fields if not extracted_data.get(field)]
            
            if missing_fields:
                extracted_data['warnings'] = f"Missing required fields: {', '.join(missing_fields)}"
            
            return extracted_data
            
        except Exception as e:
            return {"error": f"Error parsing statement: {str(e)}"}
    
    def extract_text_from_pdf(self, file_path: str) -> str:
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
    
    def format_for_import(self, parsed_data: Dict) -> Dict:
        """Format parsed data for import into the system"""
        if 'error' in parsed_data:
            return parsed_data
        
        # Format transactions for import
        formatted_transactions = []
        for transaction in parsed_data.get('transactions', []):
            formatted_transaction = {
                'date': transaction.get('date', ''),
                'description': transaction.get('description', ''),
                'amount': transaction.get('amount', '0'),
                'category': 'Uncategorized',
                'type': 'credit_card_transaction'
            }
            formatted_transactions.append(formatted_transaction)
        
        # Create import summary
        import_summary = {
            'provider': parsed_data.get('provider', 'Unknown'),
            'statement_date': parsed_data.get('statement_date', ''),
            'payment_due_date': parsed_data.get('payment_due_date', ''),
            'new_balance': parsed_data.get('new_balance', '0'),
            'minimum_payment_due': parsed_data.get('minimum_payment_due', '0'),
            'total_transactions': parsed_data.get('total_transactions', 0),
            'transactions': formatted_transactions,
            'import_fields': ['date', 'description', 'amount'],
            'warnings': parsed_data.get('warnings', ''),
            'provider_key': parsed_data.get('provider_key', '')
        }
        
        return import_summary

def main():
    """Test the credit card parser"""
    parser = CreditCardParser()
    
    # Test with a sample file if provided
    import sys
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        print(f"Parsing: {file_path}")
        
        result = parser.parse_statement(file_path)
        print("\nParsed Result:")
        print(json.dumps(result, indent=2))
        
        formatted = parser.format_for_import(result)
        print("\nFormatted for Import:")
        print(json.dumps(formatted, indent=2))
    else:
        print("Credit Card Parser loaded successfully!")
        print("Usage: python credit_card_parser.py <pdf_file_path>")

if __name__ == "__main__":
    main()
