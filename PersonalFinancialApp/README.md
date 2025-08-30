# Personal Finance Manager

A comprehensive personal finance management application with CSV import, column mapping, React UI, and Jupyter analytics.

## Features

- **CSV Import**: Import bank and stock statements with flexible column mapping
- **Multi-Bank Support**: Manage multiple banks and accounts
- **Transaction Management**: View and categorize transactions with hierarchical categories
- **Hierarchical Categories**: 4-level category system (e.g., Expenses > Household > Gardening > Plants)
- **Smart Category Search**: Search and filter categories with autocomplete
- **Analytics Dashboard**: Built-in charts and visualizations
- **Backup & Restore**: Complete data backup and selective restore functionality
- **Jupyter Integration**: Advanced analytics with Plotly and other tools
- **Professional UI**: Clean, navy blue themed interface

## Tech Stack

- **Frontend**: React with styled-components, Plotly.js
- **Backend**: FastAPI with SQLite database
- **Analytics**: Jupyter Notebook with Plotly, Pandas, Seaborn
- **Containerization**: Docker Compose

## Quick Start

1. **Clone and start the application**:

   ```bash
   docker compose up --build
   ```

2. **Access the services**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Jupyter Notebook: http://localhost:8888 (token: finance123)

## Docker Setup & Troubleshooting

### Prerequisites

- Docker Desktop installed and running
- Ensure ports 3000, 8000, and 8888 are available

### Common Docker Issues

**Docker daemon not running:**

```bash
# On macOS
open -a Docker

# Wait for Docker to start, then verify
docker ps
```

**Port conflicts:**

```bash
# Check what's using port 3000
lsof -ti:3000

# Kill processes using the port
kill -9 $(lsof -ti:3000)
```

**Cache issues with theme references:**
If you see errors like `theme.typography.sizes is undefined`, clear Docker cache:

```bash
# Stop containers
docker compose down

# Clear build cache
docker system prune -f

# Rebuild from scratch
docker compose up --build
```

**Container rebuild after code changes:**

```bash
# For frontend changes that aren't hot-reloading
docker compose up --build frontend

# For complete rebuild
docker compose down
docker compose up --build
```

### Development with Docker

**View container logs:**

```bash
# All services
docker compose logs

# Specific service
docker compose logs frontend
docker compose logs backend
docker compose logs jupyter

# Follow logs in real-time
docker compose logs -f frontend
```

**Execute commands in running containers:**

```bash
# Access frontend container
docker compose exec frontend sh

# Access backend container
docker compose exec backend bash

# Install new npm packages
docker compose exec frontend npm install package-name
```

**Volume mounts:**

- Frontend: `./frontend:/app` (hot reload enabled)
- Backend: `./backend:/app` (auto-reload enabled)
- Jupyter: `./jupyter:/home/jovyan/work`
- Data: `./data:/app/data` (persistent database)
- Backups: `./backups:/app/backups` (persistent backups)

## Usage

### Adding Banks

1. Click "Add Bank" in the sidebar
2. Enter bank name and save

### Adding Accounts

1. Select a bank from the sidebar
2. Click "+ Add Account" button
3. Enter account name and select account type:
   - **Checking**: Regular checking account
   - **Savings**: Savings account
   - **Credit Card**: Credit card account (with special handling)
   - **Investment**: Investment/brokerage account

### Importing CSV Files

1. Select a bank from the sidebar
2. Go to "Import CSV" tab
3. Drag & drop your CSV file
4. Map columns (Date, Description, Amount are required)
5. Click "Import Transactions"

### Credit Card Account Features

**Credit Card Accounts** (`account_type: "credit"`) have special handling:

- **Balance Logic**: Negative balance indicates amount owed
- **Transaction Types**:
  - Negative amounts = expenses/charges
  - Positive amounts = payments/credits
- **Special Categories**: Credit card specific categories for fees, interest, etc.
- **Credit Card Info Endpoint**: `/accounts/{id}/credit-card-info` for detailed analysis
- **Statement Import**: Support for credit card PDF statement parsing

**Investment Portfolio Credit Card Support:**

- **Account Type**: Credit card accounts can be created in the investment portfolio
- **Special Handling**: Credit card investment accounts get enhanced metadata and tips
- **Visual Indicators**: Credit card accounts show special badges and helpful notes in the UI
- **Statement Import**: Credit card statements can be imported and parsed for investment tracking

**Credit Card Statement Parsing:**

- **Provider-Specific Configurations**: Separate JSON files for Chase, Citi, FSU Credit Union, and generic cards
- **Automatic Detection**: Automatically detects credit card provider from statement content
- **Key Fields Extracted**: Statement Date, Due Date, New Balance, Minimum Payment Due
- **Transaction Import**: Extracts date, description, and amount for each transaction
- **Multiple Parsing Methods**: Uses pdfplumber and PyPDF2 for robust text extraction

### Managing Categories

The app includes a comprehensive 4-level hierarchical category system:

**Main Categories:**

- **Income**: Salary, Business, Investments (Dividends, Interest, Capital Gains)
- **Expenses**: Housing, Food, Transportation, Healthcare, Technology, Household, Credit Card, etc.
- **Transfers**: Bank transfers (to/from family members), Internal transfers, Credit card payments
- **Deposits**: Cash deposits, Check deposits, Refunds
- **Savings & Investments**: Emergency fund, Retirement, Brokerage

**Example Hierarchy:**

- `Expenses > Household > Gardening > Plants` → "Plants & Seeds"
- `Transfers > BankTransfer > FromWife` → "Transfer from Wife"
- `Expenses > Food > Takeout` → "Takeout"

**Using Categories:**

1. Click on any transaction to edit its category
2. Use the hierarchical category selector with search
3. Categories auto-complete as you type
4. Filter transactions by category using the search

### Viewing Analytics

- Use the built-in Analytics tab for basic charts
- Access Jupyter Notebook for advanced analysis
- Pre-built notebook includes spending trends, category analysis, and more

## CSV Format Support

The app supports various CSV formats from banks and financial institutions. Common column names are auto-detected:

- **Date**: date, Date, DATE, transaction_date
- **Description**: description, Description, memo, Memo
- **Amount**: amount, Amount, debit, credit, Debit, Credit
- **Category**: category, Category, type, Type

## Development

### Project Structure

```
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── jupyter/          # Jupyter notebooks
├── data/            # SQLite database (created on first run)
└── docker-compose.yml
```

### Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm start

# Jupyter
cd jupyter
jupyter lab
```

### Backend Compilation & Build

#### 🐳 Using Docker Compose (Recommended)

**1. Build and Run All Services**

```bash
# Build all services (including backend)
docker-compose build

# Start all services
docker-compose up

# Or build and run in one command
docker-compose up --build
```

**2. Build Only Backend**

```bash
# Build just the backend service
docker-compose build backend

# Run only backend
docker-compose up backend
```

**3. Force Rebuild Backend**

```bash
# Force rebuild (ignores cache)
docker-compose build --no-cache backend

# Rebuild and run
docker-compose up --build backend
```

#### 🔧 Manual Docker Build

**1. Build Backend Image**

```bash
# Navigate to backend directory
cd backend

# Build Docker image
docker build -t personal-finance-backend .

# Run the container
docker run -p 8000:8000 -v $(pwd):/app personal-finance-backend
```

**2. Build with Custom Tag**

```bash
# Build with version tag
docker build -t personal-finance-backend:v1.0 .

# Build with latest tag
docker build -t personal-finance-backend:latest .
```

#### 🐍 Local Python Development (Without Docker)

**1. Setup Python Environment**

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**2. Run Backend Locally**

```bash
# Run with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Or run with Python
python main.py
```

#### 🚀 Quick Start Commands

**First Time Setup:**

```bash
# Build everything
docker-compose build

# Start all services
docker-compose up
```

**Development Workflow:**

```bash
# Start backend only
docker-compose up backend

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

**Rebuild After Changes:**

```bash
# Rebuild backend after code changes
docker-compose build backend

# Restart backend
docker-compose restart backend
```

#### 🔍 Troubleshooting Build Issues

**Common Issues:**

1. **Port conflicts**: Make sure port 8000 is free
2. **Permission issues**: Use `sudo` if needed on Linux
3. **Cache problems**: Use `--no-cache` flag
4. **Network issues**: Check Docker daemon is running

**Debug Commands:**

```bash
# Check running containers
docker ps

# Check backend logs
docker-compose logs backend

# Enter backend container
docker-compose exec backend bash

# Check backend status
docker-compose ps backend
```

**Build Process Breakdown:**

1. **Base Image**: Downloads Python 3.11 slim image
2. **Dependencies**: Installs packages from `requirements.txt`
3. **Code Copy**: Copies backend source code to container
4. **Port Exposure**: Opens port 8000
5. **Command Setup**: Sets uvicorn as startup command

The **recommended approach** is using `docker-compose build backend` followed by `docker-compose up backend` for development, as it handles all the volume mounts and environment variables automatically!

## Manual Backup & Restore Commands

If the UI backup/restore functionality is not working properly, you can use these manual commands:

### List Available Backups

```bash
curl -X GET "http://127.0.0.1:8000/backups"
```

### Inspect Backup Contents

```bash
curl -X GET "http://127.0.0.1:8000/backups/{backup_filename}/inspect"
```

### Restore Complete Bank from Backup

```bash
curl -X POST "http://127.0.0.1:8000/restore/bank" \
  -H "Content-Type: application/json" \
  -d '{"backup_file": "your_backup_file.json", "new_bank_name": "Restored Bank Name"}'
```

### Selective Bank Restore

```bash
curl -X POST "http://127.0.0.1:8000/restore/selective" \
  -H "Content-Type: application/json" \
  -d '{"backup_file": "dd_20250823_173327.json", "bank_id": 1, "new_bank_name": "Selective Restore"}'
```

### Create Manual Backup

```bash
curl -X POST "http://127.0.0.1:8000/backup/bank" \
  -H "Content-Type: application/json" \
  -d '{"bank_id": 1, "bank_name": "Custom Backup Name"}'
```

### Examples

**List backups and find the one you want:**

```bash
curl -s -X GET "http://127.0.0.1:8000/backups" | python -m json.tool
```

**Inspect a backup to see what's inside:**

```bash
curl -s -X GET "http://127.0.0.1:8000/backups/WellsFargo_20250823_155438.json/inspect" | python -m json.tool
```

**Restore a bank with a new name:**

```bash
curl -X POST "http://127.0.0.1:8000/restore/bank" \
  -H "Content-Type: application/json" \
  -d '{"backup_file": "WellsFargo_20250823_155438.json", "new_bank_name": "Wells Fargo Restored"}'
```

## CategorySelector Component

The hierarchical category selector includes:

### Features

- **Search with autocomplete**: Type to filter categories
- **Hierarchical browsing**: Expand/collapse category groups
- **4-level deep categories**: Main > Sub > Detail > Specific
- **88+ predefined categories**: Comprehensive coverage of personal finance
- **Theme integration**: Consistent styling with app theme

### Usage in Code

```javascript
import CategorySelector from "./components/CategorySelector";

<CategorySelector
  value={selectedCategory}
  onChange={setSelectedCategory}
  placeholder="Select category..."
/>;
```

### Theme Structure

The app uses a structured theme with proper typography references:

```javascript
// Correct theme references
theme.typography.fontSize.sm; // ✅ Correct
theme.typography.fontWeight.semibold; // ✅ Correct

// Deprecated (will cause errors)
theme.typography.sizes.sm; // ❌ Deprecated
theme.typography.weights.semibold; // ❌ Deprecated
```

### Troubleshooting

**Theme reference errors:**
If you see `theme.typography.sizes is undefined`, the component is using deprecated theme references. Update to:

- `theme.typography.sizes.*` → `theme.typography.fontSize.*`
- `theme.typography.weights.*` → `theme.typography.fontWeight.*`

**Backup file not found error:**
If you get an error like `"Backup file not found: ./backups/backups/filename.json"`, it means there's a path duplication issue. Make sure:

1. Backup files are in the `backend/backups/` directory (not the root `backups/` directory)
2. Use only the filename in the API calls, not the full path
3. If you have backup files in the root `backups/` directory, copy them to `backend/backups/`:
   ```bash
   cp backups/*.json backend/backups/
   ```

**Server not responding:**
Make sure the backend server is running:

```bash
cd backend
source venv/bin/activate  # if using virtual environment
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**Note**: Backup files are stored in `backend/backups/` directory. Make sure the backend server is running on port 8000.

## API Endpoints

### Core Banking

- `GET /banks` - List all banks
- `POST /banks` - Create new bank
- `POST /upload-csv/{bank_id}` - Upload and preview CSV
- `POST /import-transactions/{bank_id}` - Import transactions
- `GET /transactions/{bank_id}` - Get transactions for bank
- `GET /analytics/{bank_id}` - Get analytics data

### Categories & Transactions

- `GET /categories` - Get hierarchical categories
- `PUT /transactions/{id}/category` - Update transaction category

### Credit Card Accounts

- `GET /accounts/{id}/credit-card-info` - Get credit card specific information and analytics
- `POST /parse-credit-card-statement` - Parse credit card PDF statement and extract data

### Backup & Restore

- `GET /backups` - List all backup files
- `POST /backup/bank` - Create backup for a bank
- `POST /restore/bank` - Restore bank from backup
- `POST /restore/selective` - Selectively restore bank from backup
- `GET /backups/{filename}/inspect` - Inspect backup contents

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
