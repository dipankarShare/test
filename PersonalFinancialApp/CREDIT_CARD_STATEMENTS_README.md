# Credit Card Statement Management Feature

## Overview

The Personal Financial App now includes comprehensive credit card statement management capabilities, allowing you to import, track, and analyze your credit card transactions from PDF statements. This feature works similarly to the investment portfolio system, with dedicated JSON configuration files for different credit card providers.

## Features

### 💳 Credit Card Provider Support

- **Chase Credit Cards**: Freedom, Sapphire, Slate, and other Chase credit products
- **Citi Credit Cards**: Double Cash, Premier, and other Citi credit products
- **FSU Credit Union**: Florida State University Credit Union credit cards
- **American Express**: Platinum, Gold, Green, and other Amex cards
- **Discover**: Discover It, Discover More, and other Discover cards
- **Generic Credit Card**: Fallback patterns for any credit card provider

### 📊 Statement Data Extraction

- **Statement Date**: Credit card statement closing date
- **Payment Due Date**: When payment is due
- **Previous Balance**: Balance from previous statement
- **Current Balance**: New statement balance
- **Minimum Payment**: Minimum payment amount due
- **Credit Limit**: Total credit limit
- **Available Credit**: Remaining available credit
- **Transaction Details**: Individual purchase/charge details
- **Fees & Interest**: Finance charges and fees

### 🔍 Transaction Parsing

- **Date Recognition**: Transaction dates in various formats
- **Merchant Names**: Store/company names
- **Amount Extraction**: Transaction amounts (positive/negative)
- **Category Detection**: Transaction categories when available
- **Reference Numbers**: Transaction reference IDs

## Configuration Files

### Primary Configuration

- **`backend/credit_card_formats.json`**: Dedicated credit card parsing patterns
- **`backend/statement_formats.json`**: Updated with credit card support

### Credit Card Types

Each credit card provider has its own configuration section with:

- **Keywords**: Text patterns to identify the provider
- **Patterns**: Regex patterns for extracting specific data fields
- **Sections**: Transaction and fee section boundaries

## Getting Started

### 1. Install Dependencies

The credit card statement feature uses the same PDF parsing libraries:

```bash
cd backend
pip install -r requirements.txt
```

Required packages:

- `PyPDF2`: PDF file handling
- `pdfplumber`: Advanced PDF text extraction
- `tabula-py`: Table extraction from PDFs

### 2. Configure Credit Card Provider

The system automatically detects credit card providers based on statement content. Supported providers include:

- **Chase**: `chase_credit`
- **Citi**: `citi_credit`
- **FSU Credit Union**: `fsu_credit_union`
- **American Express**: `amex_credit`
- **Discover**: `discover_credit`
- **Generic**: `generic_credit_card`

### 3. Import Credit Card Statement

#### Option A: PDF Auto-Parsing (Recommended)

1. Navigate to **Credit Cards** → **Statement Import** in the sidebar
2. Select your credit card provider from the dropdown
3. Upload your PDF statement
4. Click **Parse Statement** to automatically extract data
5. Review and adjust the extracted information
6. Click **Import Statement** to save

#### Option B: Manual Entry

1. Select your credit card provider
2. Manually enter statement information
3. Add transactions one by one
4. Click **Import Statement** to save

## Credit Card Statement Format Support

The system automatically detects and extracts:

### Statement Summary

- Statement closing date
- Payment due date
- Previous statement balance
- Current statement balance
- Minimum payment amount
- Credit limit and available credit

### Transaction Data

- Transaction dates
- Merchant names and descriptions
- Transaction amounts
- Transaction categories (when available)
- Reference numbers

### Fees and Charges

- Interest charges
- Late fees
- Annual fees
- Other finance charges

## Customizing Credit Card Parsing

### Adding New Credit Card Providers

To add support for a new credit card provider:

1. **Create Provider Configuration**:

```json
{
  "new_provider": {
    "name": "New Credit Card Provider",
    "type": "credit_card",
    "keywords": ["provider", "credit", "card"],
    "patterns": {
      "statement_date": {
        "pattern": "Statement Date[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})",
        "description": "Statement date pattern"
      },
      "ending_balance": {
        "pattern": "New Balance[:\\s]*\\$?([-\\d,]+\\.?\\d*)",
        "description": "Current balance pattern"
      }
    }
  }
}
```

2. **Add to `credit_card_formats.json`**:
   - Copy the configuration to the appropriate file
   - Test with sample statements
   - Adjust patterns as needed

### Pattern Customization

Common patterns for credit card statements:

```python
# Date patterns
r'Statement Date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
r'Closing Date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'

# Balance patterns
r'Previous Balance[:\s]*\$?([-\d,]+\\.?\d*)'
r'New Balance[:\s]*\$?([\d,]+\\.?\d*)'
r'Minimum Payment[:\s]*\$?([\d,]+\\.?\d*)'

# Transaction section detection
r'Date|Description|Amount|Category|Reference'
```

## Testing Credit Card Parsing

Use the included test script to verify parsing works with your statements:

```bash
python test_credit_card_parsing.py
```

This script will:

1. Extract text from your credit card PDF
2. Test various parsing patterns
3. Show what data was found
4. Provide recommendations for customization

## Database Schema

The credit card feature adds these tables:

### `credit_card_accounts`

- Account information and metadata
- Provider details
- Account type classification

### `credit_card_statements`

- Statement summaries
- Balance information
- File storage paths
- Historical tracking

### `credit_card_transactions`

- Individual transaction details
- Merchant information
- Amount and date data
- Statement date tracking

## API Endpoints

### Credit Card Accounts

- `POST /credit-card-accounts` - Create new account
- `GET /credit-card-accounts` - List all accounts

### Credit Card Statements

- `POST /credit-card-statements/{account_id}` - Import statement
- `GET /credit-card-statements/{account_id}` - Get statements

### Credit Card Transactions

- `GET /credit-card-transactions/{account_id}` - Get current transactions
- `GET /credit-card-transactions/{account_id}?statement_date=X` - Get transactions for specific date

### Statement Summary

- `GET /credit-card-summary/{account_id}` - Get current statement overview

### PDF Parsing

- `POST /parse-credit-card-statement` - Parse PDF and extract data

## Usage Examples

### Creating a Credit Card Account

```javascript
const accountData = {
  name: "Chase Freedom Unlimited",
  provider: "chase_credit",
  account_number: "****1234",
  credit_limit: 15000,
};

const response = await fetch("/credit-card-accounts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(accountData),
});
```

### Importing a Credit Card Statement

```javascript
const formData = new FormData();
formData.append("file", pdfFile);
formData.append(
  "statement",
  JSON.stringify({
    credit_card_account_id: 1,
    statement_date: "2024-01-31",
    previous_balance: 1250.5,
    current_balance: 1450.75,
    minimum_payment: 35.0,
    payment_due_date: "2024-02-25",
  })
);

const response = await fetch("/credit-card-statements/1", {
  method: "POST",
  body: formData,
});
```

## Troubleshooting

### Common Issues

1. **Pattern Not Matching**: Check the regex patterns in your provider configuration
2. **Missing Data**: Verify the statement format matches the expected layout
3. **Date Format Issues**: Ensure date patterns match your statement format
4. **Amount Parsing**: Check for currency symbols and formatting differences

### Debugging Tips

1. **Enable Debug Logging**: Set logging level to DEBUG in your configuration
2. **Test Individual Patterns**: Use regex testing tools to verify patterns
3. **Sample Statement Analysis**: Examine the extracted text to identify patterns
4. **Provider Detection**: Check if the correct provider is being auto-detected

## Future Enhancements

Planned features for credit card statement management:

- **Automatic Categorization**: AI-powered transaction categorization
- **Spending Analytics**: Detailed spending analysis and trends
- **Payment Reminders**: Due date notifications and payment tracking
- **Rewards Tracking**: Credit card rewards and cashback tracking
- **Statement Comparison**: Month-over-month statement analysis
- **Export Options**: CSV, Excel, and PDF export capabilities

## Support

For issues with credit card statement parsing:

1. Check the provider configuration matches your statement format
2. Verify the PDF is text-based (not image-only)
3. Test with the generic credit card configuration
4. Review the extracted text for pattern matching opportunities
5. Create a custom provider configuration if needed

The credit card statement feature provides a robust foundation for managing multiple credit card accounts with automatic data extraction and flexible configuration options.
