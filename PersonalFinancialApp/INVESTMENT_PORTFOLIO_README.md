# Investment Portfolio Management Feature

## Overview

The Personal Financial App now includes comprehensive investment portfolio management capabilities, allowing you to import, track, and analyze your investment holdings from PDF statements.

## Features

### 🏦 Investment Account Management
- Create and manage multiple investment accounts
- Support for various account types:
  - Brokerage accounts
  - 401(k) plans
  - Traditional IRAs
  - Roth IRAs
  - Roth 401(k) plans
  - Health Savings Accounts (HSA)
  - Other investment accounts
- Track custodian information and account numbers

### 📊 Portfolio Statement Import
- **PDF Statement Parsing**: Automatically extract data from investment statements
- **Manual Data Entry**: Option to manually input portfolio data
- **Batch Import**: Import multiple statements for historical tracking
- **Data Validation**: Ensures data integrity and completeness

### 📈 Portfolio Analytics
- **Opening/Ending Balances**: Track portfolio value changes over time
- **Period Gain/Loss**: Monitor performance between statements
- **Securities Holdings**: Detailed view of individual investments
- **Unrealized Gains/Losses**: Track paper profits and losses
- **Cost Basis Tracking**: Monitor investment costs vs. market values

### 🔍 Securities Management
- **Symbol Tracking**: Stock symbols and company names
- **Quantity Management**: Share counts and fractional shares
- **Price Tracking**: Current share prices and historical data
- **Value Calculations**: Market value and cost basis
- **Performance Metrics**: Unrealized gains/losses

## Getting Started

### 1. Install Dependencies

The investment portfolio feature requires additional Python packages. Install them by running:

```bash
cd backend
pip install -r requirements.txt
```

New dependencies added:
- `PyPDF2`: PDF file handling
- `pdfplumber`: Advanced PDF text extraction
- `tabula-py`: Table extraction from PDFs
- `openpyxl`: Excel file support

### 2. Create Investment Account

1. Navigate to **Investments** → **Investment Portfolio** in the sidebar
2. Click on the **Investment Accounts** tab
3. Fill in the account details:
   - **Account Name**: e.g., "Fidelity 401k"
   - **Account Type**: Select from dropdown
   - **Custodian**: e.g., "Fidelity", "Vanguard", "Charles Schwab"
   - **Account Number**: Optional reference (last 4 digits)

### 3. Import Portfolio Statement

#### Option A: PDF Auto-Parsing (Recommended)
1. Select your investment account
2. Upload your PDF statement
3. Click **Parse PDF** to automatically extract data
4. Review and adjust the extracted information
5. Click **Import Statement** to save

#### Option B: Manual Entry
1. Select your investment account
2. Manually enter statement information
3. Add securities one by one
4. Click **Import Statement** to save

## PDF Statement Format Support

The system automatically detects and extracts:

### Portfolio Summary
- Statement date
- Opening balance
- Period gain/loss
- Ending balance
- Total market value
- Total cost basis
- Total unrealized gain/loss

### Securities Data
- Stock symbols
- Company names
- Security types
- Quantities
- Share prices
- Total costs
- Market values
- Unrealized gains/losses

## Customizing PDF Parsing

The PDF parsing uses regex patterns that can be customized for your specific statement format. Common patterns include:

```python
# Date patterns
r'Statement Date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
r'Date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'

# Balance patterns
r'Opening Balance[:\s]*\$?([-\d,]+\.?\d*)'
r'Period Gain/Loss[:\s]*\$?([-\d,]+\.?\d*)'
r'Ending Balance[:\s]*\$?([\d,]+\.?\d*)'

# Securities section detection
r'SYMBOL|SECURITY|HOLDINGS|POSITIONS|STOCK|SHARES'
```

## Testing PDF Parsing

Use the included test script to verify PDF parsing works with your statements:

```bash
python test_pdf_parsing.py
```

This script will:
1. Extract text from your PDF
2. Test various parsing patterns
3. Show what data was found
4. Provide recommendations for customization

## Database Schema

The investment portfolio feature adds three new tables:

### `investment_accounts`
- Account information and metadata
- Custodian details
- Account type classification

### `securities`
- Individual security holdings
- Price and quantity data
- Performance metrics
- Statement date tracking

### `portfolio_statements`
- Statement summaries
- Balance information
- File storage paths
- Historical tracking

## API Endpoints

### Investment Accounts
- `POST /investment-accounts` - Create new account
- `GET /investment-accounts` - List all accounts

### Portfolio Statements
- `POST /portfolio-statements/{account_id}` - Import statement
- `GET /portfolio-statements/{account_id}` - Get statements

### Securities
- `GET /securities/{account_id}` - Get current holdings
- `GET /securities/{account_id}?statement_date=X` - Get holdings for specific date

### Portfolio Summary
- `GET /portfolio-summary/{account_id}` - Get current portfolio overview

### PDF Parsing
- `POST /parse-pdf-statement` - Parse PDF and extract data

## Usage Examples

### Creating an Investment Account
```javascript
const accountData = {
  name: "Fidelity 401k",
  account_type: "401k",
  custodian: "Fidelity",
  account_number: "1234"
};

const response = await fetch('/investment-accounts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(accountData)
});
```

### Importing a Portfolio Statement
```javascript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('statement', JSON.stringify({
  investment_account_id: 1,
  statement_date: "12/31/2024",
  opening_balance: 100000,
  period_gain_loss: 5000,
  ending_balance: 105000,
  total_market_value: 105000,
  total_cost_basis: 100000,
  total_unrealized_gain_loss: 5000,
  securities: [
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      security_type: "Stock",
      quantity: 100,
      share_price: 150.00,
      total_cost: 14000,
      market_value: 15000,
      unrealized_gain_loss: 1000
    }
  ]
}));

const response = await fetch('/portfolio-statements/1', {
  method: 'POST',
  body: formData
});
```

## Troubleshooting

### PDF Parsing Issues
1. **No data extracted**: Check if PDF contains text (not just images)
2. **Incorrect values**: Verify regex patterns match your statement format
3. **Missing securities**: Adjust securities section detection patterns

### Common Problems
- **File upload errors**: Ensure PDF file is valid and not corrupted
- **Database errors**: Check database permissions and table creation
- **API errors**: Verify backend server is running and accessible

### Performance Tips
- **Large PDFs**: Consider splitting very large statements
- **Frequent updates**: Use batch imports for multiple statements
- **Data validation**: Review parsed data before importing

## Future Enhancements

### Planned Features
- **Real-time quotes**: Live stock price updates
- **Performance charts**: Visual portfolio performance tracking
- **Tax reporting**: Capital gains and loss calculations
- **Rebalancing tools**: Portfolio allocation analysis
- **Benchmark comparison**: Compare against market indices

### Integration Opportunities
- **Market data APIs**: Yahoo Finance, Alpha Vantage
- **Tax software**: TurboTax, H&R Block integration
- **Financial planning**: Goal tracking and projections
- **Mobile app**: iOS and Android applications

## Support and Customization

### Getting Help
1. Check the test script output for parsing issues
2. Review regex patterns in the backend code
3. Test with sample statements from your custodian
4. Adjust patterns based on your specific format

### Customization
The PDF parsing is designed to be easily customizable:
- Modify regex patterns in `backend/main.py`
- Add new field extractors as needed
- Customize securities parsing logic
- Extend database schema for additional fields

## Security Considerations

- **File storage**: PDFs are stored locally in the `./data/` directory
- **Data validation**: All imported data is validated before storage
- **Access control**: Consider implementing user authentication
- **Backup**: Include portfolio data in your regular backups

## Conclusion

The Investment Portfolio Management feature provides a robust foundation for tracking your investment holdings. While the PDF parsing works automatically for many statement formats, you may need to customize the patterns for your specific custodian's format.

Start by testing with a few statements, review the extracted data, and adjust the parsing patterns as needed. The system is designed to be flexible and can accommodate various statement formats with minimal customization.

