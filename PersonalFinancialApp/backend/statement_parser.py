import json
import re
import os
from typing import Dict, List, Optional, Any
import pdfplumber

class StatementParser:
    """Configurable statement parser using JSON pattern definitions"""
    
    def __init__(self, formats_file: str = "statement_formats.json"):
        """Initialize parser with statement format configurations"""
        self.formats_file = formats_file
        self.formats = self._load_formats()
        # Add generic fallback patterns
        self.generic_patterns = self._get_generic_patterns()
    
    def _load_formats(self) -> Dict[str, Any]:
        """Load statement format configurations from JSON file"""
        try:
            with open(self.formats_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: {self.formats_file} not found. Using default patterns.")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error parsing {self.formats_file}: {e}")
            return {}
    
    def _get_generic_patterns(self) -> Dict[str, Any]:
        """Get generic patterns for fallback parsing"""
        return {
            "generic_investment": {
                "name": "Generic Investment Statement",
                "type": "investment",
                "keywords": ["portfolio", "securities", "holdings", "investment", "brokerage", "401k", "ira"],
                "patterns": {
                    "statement_date": {
                        "pattern": r"(?:Statement Date|Date|Period|As of)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
                        "description": "Generic date pattern"
                    },
                    "opening_balance": {
                        "pattern": r"(?:Beginning|Opening|Starting|Previous)[\s\w]*[Bb]alance[:\s]*\$?([-\d,]+\.?\d*)",
                        "description": "Generic opening balance pattern"
                    },
                    "ending_balance": {
                        "pattern": r"(?:Ending|Closing|Current|New)[\s\w]*[Bb]alance[:\s]*\$?([-\d,]+\.?\d*)",
                        "description": "Generic ending balance pattern"
                    },
                    "total_market_value": {
                        "pattern": r"(?:Total|Current)[\s\w]*[Mm]arket[:\s\w]*[Vv]alue[:\s]*\$?([-\d,]+\.?\d*)",
                        "description": "Generic market value pattern"
                    },
                    "total_cost_basis": {
                        "pattern": r"(?:Total|Current)[\s\w]*[Cc]ost[:\s\w]*[Bb]asis[:\s]*\$?([-\d,]+\.?\d*)",
                        "description": "Generic cost basis pattern"
                    },
                    "period_gain_loss": {
                        "pattern": r"(?:Period|Total|Net)[\s\w]*[Gg]ain[:\s\w]*[Ll]oss[:\s]*\$?([-\d,]+\.?\d*)",
                        "description": "Generic gain/loss pattern"
                    }
                }
            }
        }
    
    def detect_statement_type(self, text: str) -> Optional[str]:
        """Auto-detect statement type based on text content"""
        # First try specific formats
        for format_key, format_config in self.formats.items():
            if self._matches_format(text, format_config):
                print(f"Detected specific format: {format_key}")
                return format_key
        
        # Then try generic formats
        for format_key, format_config in self.generic_patterns.items():
            if self._matches_format(text, format_config):
                print(f"Detected generic format: {format_key}")
                return format_key
        
        print("No format detected, will use fallback parsing")
        return None
    
    def _matches_format(self, text: str, format_config: Dict[str, Any]) -> bool:
        """Check if text matches a specific format"""
        # Look for format-specific keywords
        keywords = format_config.get('keywords', [])
        if keywords:
            keyword_matches = sum(1 for keyword in keywords if keyword.lower() in text.lower())
            if keyword_matches >= 2:  # Require at least 2 keyword matches
                return True
        
        # Check if any patterns match
        patterns = format_config.get('patterns', {})
        pattern_matches = 0
        for field, pattern_config in patterns.items():
            if isinstance(pattern_config, dict) and 'pattern' in pattern_config:
                if re.search(pattern_config['pattern'], text, re.IGNORECASE):
                    pattern_matches += 1
        
        # Require at least 2 pattern matches for format detection
        return pattern_matches >= 2
    
    def parse_statement(self, pdf_file: str, format_key: Optional[str] = None) -> Dict[str, Any]:
        """Parse PDF statement using specified or auto-detected format"""
        try:
            # Extract text from PDF
            with pdfplumber.open(pdf_file) as pdf:
                full_text = ""
                for page in pdf.pages:
                    full_text += page.extract_text() or ""
            
            print(f"Extracted {len(full_text)} characters from PDF")
            print(f"First 200 characters: {full_text[:200]}...")
            
            # Auto-detect format if not specified
            if not format_key:
                format_key = self.detect_statement_type(full_text)
            
            # Parse based on detected format or use fallback
            if format_key and format_key in self.formats:
                format_config = self.formats[format_key]
                print(f"Using specific format: {format_config.get('name', format_key)}")
                if format_config.get('type') == 'investment':
                    return self._parse_investment_statement(full_text, format_config)
                elif format_config.get('type') == 'banking':
                    return self._parse_banking_statement(full_text, format_config)
            elif format_key and format_key in self.generic_patterns:
                format_config = self.generic_patterns[format_key]
                print(f"Using generic format: {format_config.get('name', format_key)}")
                if format_config.get('type') == 'investment':
                    return self._parse_investment_statement(full_text, format_config)
            
            # Fallback parsing if no format detected
            print("Using fallback parsing for unknown format")
            return self._parse_fallback(full_text)
                
        except Exception as e:
            raise Exception(f"PDF parsing failed: {str(e)}")
    
    def _parse_investment_statement(self, text: str, format_config: Dict[str, Any]) -> Dict[str, Any]:
        """Parse investment portfolio statement"""
        patterns = format_config.get('patterns', {})
        
        portfolio_data = {
            "statement_date": None,
            "opening_balance": None,
            "period_gain_loss": None,
            "ending_balance": None,
            "total_market_value": None,
            "total_cost_basis": None,
            "total_unrealized_gain_loss": None,
            "securities": [],
            "format_detected": format_config.get('name', 'Unknown')
        }
        
        # Extract basic fields
        for field, pattern_config in patterns.items():
            if field in ['opening_balance', 'ending_balance', 'total_market_value', 
                        'total_cost_basis', 'total_unrealized_gain_loss', 'statement_date']:
                value = self._extract_field(text, pattern_config)
                if value is not None:
                    portfolio_data[field] = value
        
        # Calculate period gain/loss if we have opening and ending balances
        if portfolio_data["opening_balance"] and portfolio_data["ending_balance"]:
            portfolio_data["period_gain_loss"] = portfolio_data["ending_balance"] - portfolio_data["opening_balance"]
        
        # Parse securities if available
        if 'securities_section' in patterns:
            portfolio_data["securities"] = self._parse_securities_section(
                text, patterns['securities_section'], patterns.get('security_line', {})
            )
        
        return portfolio_data
    
    def _parse_banking_statement(self, text: str, format_config: Dict[str, Any]) -> Dict[str, Any]:
        """Parse banking statement"""
        patterns = format_config.get('patterns', {})
        
        banking_data = {
            "statement_date": None,
            "opening_balance": None,
            "ending_balance": None,
            "transactions": [],
            "format_detected": format_config.get('name', 'Unknown')
        }
        
        # Extract basic fields
        for field, pattern_config in patterns.items():
            if field in ['opening_balance', 'ending_balance', 'statement_date']:
                value = self._extract_field(text, pattern_config)
                if value is not None:
                    banking_data[field] = value
        
        # Parse transactions if available
        if 'transactions_section' in patterns:
            banking_data["transactions"] = self._parse_transactions_section(
                text, patterns['transactions_section']
            )
        
        return banking_data
    
    def _extract_field(self, text: str, pattern_config: Dict[str, Any]) -> Optional[Any]:
        """Extract field value using pattern configuration"""
        if not isinstance(pattern_config, dict) or 'pattern' not in pattern_config:
            return None
        
        pattern = pattern_config['pattern']
        group = pattern_config.get('group', 1)
        
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = match.group(group)
            
            # Convert to appropriate type
            if pattern_config.get('type') == 'number':
                return float(value.replace(',', ''))
            elif pattern_config.get('type') == 'date':
                return value
            else:
                # Try to convert to number if it looks like one
                try:
                    return float(value.replace(',', ''))
                except ValueError:
                    return value
        
        return None
    
    def _parse_securities_section(self, text: str, section_config: Dict[str, Any], 
                                 security_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse securities section from investment statement"""
        securities = []
        
        # Find securities section boundaries
        header_pattern = section_config.get('header_pattern', '')
        end_patterns = section_config.get('end_patterns', [])
        
        if not header_pattern:
            return securities
        
        # Split text into lines
        lines = text.split('\n')
        in_securities_section = False
        
        for line in lines:
            line = line.strip()
            
            # Check if we're entering securities section
            if re.search(header_pattern, line, re.IGNORECASE):
                in_securities_section = True
                continue
            
            # Check if we're leaving securities section
            if in_securities_section and any(re.search(end_pattern, line, re.IGNORECASE) 
                                          for end_pattern in end_patterns):
                in_securities_section = False
                continue
            
            # Parse security lines
            if in_securities_section and line:
                security = self._parse_security_line(line, security_config)
                if security:
                    securities.append(security)
        
        return securities
    
    def _parse_security_line(self, line: str, security_config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse individual security line"""
        if not security_config.get('pattern'):
            return None
        
        pattern = security_config['pattern']
        groups = security_config.get('groups', {})
        
        match = re.search(pattern, line)
        if not match:
            return None
        
        security = {}
        for field, group_num in groups.items():
            if group_num <= len(match.groups()):
                value = match.group(group_num)
                
                # Convert to appropriate type
                if field in ['quantity', 'share_price', 'total_cost', 'market_value', 'unrealized_gain_loss']:
                    try:
                        security[field] = float(value.replace(',', ''))
                    except ValueError:
                        security[field] = 0.0
                else:
                    security[field] = value
        
        # Set default values for missing fields
        security.setdefault('security_type', 'Unknown')
        security.setdefault('statement_date', None)
        
        return security if security else None
    
    def _parse_transactions_section(self, text: str, section_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse transactions section from banking statement"""
        # This is a placeholder for banking transaction parsing
        # You can extend this based on your banking statement needs
        return []
    
    def get_available_formats(self) -> List[str]:
        """Get list of available statement formats"""
        return list(self.formats.keys())
    
    def get_format_info(self, format_key: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific format"""
        return self.formats.get(format_key)
    
    def add_custom_format(self, format_key: str, format_config: Dict[str, Any]):
        """Add a custom statement format"""
        self.formats[format_key] = format_config
        self._save_formats()
    
    def _save_formats(self):
        """Save formats back to JSON file"""
        try:
            with open(self.formats_file, 'w') as f:
                json.dump(self.formats, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save formats: {e}")
    
    def _parse_fallback(self, text: str) -> Dict[str, Any]:
        """Fallback parsing for unknown statement formats"""
        print("Attempting fallback parsing...")
        
        portfolio_data = {
            "statement_date": None,
            "opening_balance": None,
            "period_gain_loss": None,
            "ending_balance": None,
            "total_market_value": None,
            "total_cost_basis": None,
            "total_unrealized_gain_loss": None,
            "securities": [],
            "format_detected": "Unknown (Fallback)",
            "parsing_notes": "Used fallback parsing due to unknown format"
        }
        
        # Try to extract basic information with very generic patterns
        date_patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(\d{4}-\d{2}-\d{2})',
            r'(\w+ \d{1,2}, \d{4})'
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                portfolio_data["statement_date"] = match.group(1)
                print(f"Fallback: Found date: {match.group(1)}")
                break
        
        # Look for any dollar amounts that might be balances
        dollar_patterns = [
            (r'\$([\d,]+\.?\d*)', 'potential_balance'),
            (r'([\d,]+\.?\d*)', 'potential_number')
        ]
        
        found_amounts = []
        for pattern, label in dollar_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                try:
                    value = float(match.replace(',', ''))
                    if 100 <= value <= 10000000:  # Reasonable balance range
                        found_amounts.append(value)
                except ValueError:
                    continue
        
        if found_amounts:
            found_amounts.sort()
            if len(found_amounts) >= 2:
                portfolio_data["opening_balance"] = found_amounts[0]
                portfolio_data["ending_balance"] = found_amounts[-1]
                print(f"Fallback: Estimated balances - Opening: ${found_amounts[0]:,.2f}, Ending: ${found_amounts[-1]:,.2f}")
        
        # Try to identify if this is an investment statement
        investment_keywords = ['portfolio', 'securities', 'holdings', 'investment', 'brokerage', '401k', 'ira', 'mutual fund', 'stock', 'bond']
        keyword_count = sum(1 for keyword in investment_keywords if keyword.lower() in text.lower())
        
        if keyword_count >= 2:
            portfolio_data["parsing_notes"] += ". Detected as investment statement based on keywords."
            print(f"Fallback: Detected {keyword_count} investment-related keywords")
        
        return portfolio_data

