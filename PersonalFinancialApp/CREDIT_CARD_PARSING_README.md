# Credit Card Statement Parsing

## Overview

The Personal Financial App now includes advanced credit card statement parsing capabilities that automatically detect credit card providers and extract key information from PDF statements. Each credit card provider has its own dedicated configuration file for optimal parsing accuracy.

## 🏦 Supported Credit Card Providers

### 1. Chase Credit Cards

- **File**: `backend/chase_credit_formats.json`
- **Cards**: Freedom, Sapphire, Slate, United, Amazon
- **Keywords**: chase, credit card, chase freedom, chase sapphire, chase slate

### 2. Citi Credit Cards

- **File**: `backend/citi_credit_formats.json`
- **Cards**: Double Cash, Premier, Custom Cash, Rewards
- **Keywords**: citi, citibank, credit card, citi double cash, citi premier

### 3. FSU Credit Union

- **File**: `backend/fsu_credit_formats.json`
- **Cards**: FSU Credit Union credit cards
- **Keywords**: fsu, credit union, florida state, fsu credit union

### 4. Generic Credit Cards

- **File**: `backend/generic_credit_formats.json`
- **Cards**: Any credit card provider not specifically configured
- **Keywords**: credit card, credit, card, statement

## 🔍 Key Fields Extracted

### Required Fields (for all providers)

- **Statement Date**: Credit card statement closing date
- **Due Date**: Payment due date
- **New Balance**: Current statement balance (ending balance)
- **Minimum Payment**: Minimum payment amount due

### Additional Fields

- **Opening Balance**: Previous statement balance
- **Credit Limit**: Total credit limit
- **Available Credit**: Available credit amount
- **Transactions**: Individual transaction details

### Transaction Data

- **Date**: Transaction date
- **Description**: Transaction description/merchant
- **Amount**: Transaction amount

## 📁 File Structure

```
backend/
├── chase_credit_formats.json      # Chase-specific patterns
├── citi_credit_formats.json       # Citi-specific patterns
├── fsu_credit_formats.json        # FSU Credit Union patterns
├── generic_credit_formats.json    # Generic fallback patterns
├── credit_card_parser.py          # Main parsing engine
└── main.py                        # API endpoints
```

## 🚀 Usage

### 1. Parse Credit Card Statement

**Endpoint**: `POST /parse-credit-card-statement`

**Request**: Upload PDF file

```bash
curl -X POST "http://localhost:8000/parse-credit-card-statement" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@chase_statement.pdf"
```

**Response**:

```json
{
  "provider": "Chase Credit Card",
  "provider_key": "chase_credit",
  "statement_date": "12/15/2024",
  "due_date": "01/15/2025",
  "ending_balance": "1234.56",
  "minimum_payment": "25.00",
  "opening_balance": "1000.00",
  "credit_limit": "5000.00",
  "available_credit": "3765.44",
  "total_transactions": 15,
  "transactions": [
    {
      "date": "12/10/2024",
      "description": "AMAZON.COM",
      "amount": "89.99",
      "category": "Uncategorized",
      "type": "credit_card_transaction"
    }
  ],
  "import_fields": ["date", "description", "amount"],
  "warnings": "",
  "provider_key": "chase_credit"
}
```

### 2. Import Transactions

After parsing, you can import the transactions into your credit card account:

```python
# Example Python code
import requests

# Parse statement
with open('chase_statement.pdf', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8000/parse-credit-card-statement', files=files)
    parsed_data = response.json()

# Import transactions
for transaction in parsed_data['transactions']:
    transaction_data = {
        'date': transaction['date'],
        'description': transaction['description'],
        'amount': transaction['amount'],
        'category': transaction['category']
    }

    # Import to your credit card account
    import_response = requests.post(
        f'http://localhost:8000/import-transactions/{account_id}',
        data=transaction_data
    )
```

## ⚙️ Configuration

### Adding New Credit Card Providers

1. **Create Configuration File**:

```json
{
  "new_provider": {
    "name": "New Credit Card Provider",
    "type": "credit_card",
    "provider": "Provider Name",
    "keywords": ["provider", "credit", "card"],
    "patterns": {
      "statement_date": {
        "pattern": "(?:Statement Date)[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})",
        "description": "Credit card statement date"
      }
    },
    "required_fields": [
      "statement_date",
      "due_date",
      "ending_balance",
      "minimum_payment"
    ],
    "import_fields": ["date", "description", "amount"]
  }
}
```

2. **Update Parser**:

```python
# In credit_card_parser.py
config_files = [
    "chase_credit_formats.json",
    "citi_credit_formats.json",
    "fsu_credit_formats.json",
    "generic_credit_formats.json",
    "new_provider_formats.json"  # Add your new file
]
```

### Customizing Patterns

Each provider configuration supports:

- **Regex Patterns**: Custom regex for field extraction
- **Section Markers**: Start/end patterns for transaction sections
- **Required Fields**: Fields that must be present for valid parsing
- **Import Fields**: Fields to extract for transaction import

## 🧪 Testing

### 1. Test Parser Configuration

```bash
cd backend
python test_credit_card_parsing.py
```

### 2. Test with Real PDF

```bash
python test_credit_card_parsing.py path/to/statement.pdf
```

### 3. Test API Endpoint

```bash
# Start backend
docker-compose up backend

# Test parsing
curl -X POST "http://localhost:8000/parse-credit-card-statement" \
  -F "file=@your_statement.pdf"
```

## 🔧 Technical Details

### Parsing Engine

- **Primary**: `pdfplumber` for complex layouts
- **Fallback**: `PyPDF2` for basic text extraction
- **Table Extraction**: `tabula-py` for tabular data

### Provider Detection

- **Keyword Matching**: Scores providers based on statement content
- **Best Match**: Selects provider with highest keyword score
- **Fallback**: Uses generic patterns if no specific provider detected

### Error Handling

- **Missing Fields**: Warns about missing required fields
- **Parsing Errors**: Graceful fallback and error reporting
- **File Validation**: Ensures PDF format and readability

## 📊 Data Flow

```
PDF Statement → Text Extraction → Provider Detection → Pattern Matching → Data Extraction → Import Format
     ↓              ↓                ↓                ↓              ↓              ↓
  Upload PDF    Parse Text     Identify Card    Apply Patterns   Extract Data   Ready for Import
```

## 🎯 Use Cases

1. **Automated Import**: Bulk import credit card transactions
2. **Statement Analysis**: Extract key financial information
3. **Provider Comparison**: Compare different credit card statements
4. **Data Migration**: Import historical credit card data
5. **Financial Planning**: Track spending patterns and balances

## 🚨 Troubleshooting

### Common Issues

1. **Provider Not Detected**

   - Check keywords in provider configuration
   - Verify statement contains provider-specific text

2. **Fields Not Extracted**

   - Review regex patterns in configuration
   - Check statement format matches expected layout

3. **Parsing Errors**
   - Ensure PDF is not password-protected
   - Check PDF text extraction quality
   - Verify file is not corrupted

### Debug Mode

Enable debug logging in the parser:

```python
# In credit_card_parser.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🔮 Future Enhancements

- **OCR Support**: Handle scanned statements
- **Machine Learning**: Improve pattern recognition
- **Batch Processing**: Process multiple statements
- **Export Formats**: Support additional output formats
- **Mobile Integration**: Parse statements from mobile apps

## 📚 Additional Resources

- **API Documentation**: See main README.md for API endpoints
- **Configuration Examples**: Check existing JSON files for patterns
- **Testing**: Use provided test scripts for validation
- **Support**: Check troubleshooting section for common issues

---

The credit card statement parsing system provides a robust, provider-specific approach to extracting financial data from credit card statements, making it easy to import and analyze your credit card spending patterns.
