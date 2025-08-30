from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import sqlite3
import json
from typing import List, Dict, Optional
from pydantic import BaseModel, validator
import os
import numpy as np
from difflib import SequenceMatcher
import re
from pathlib import Path
from backup_manager import BackupManager

app = FastAPI(title="Personal Finance Manager")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_PATH = "data/finance.db"
os.makedirs("data", exist_ok=True)

def init_db():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Drop existing tables to recreate clean schema
    cursor.execute("DROP TABLE IF EXISTS transactions")
    cursor.execute("DROP TABLE IF EXISTS accounts") 
    cursor.execute("DROP TABLE IF EXISTS banks")
    
    # Create banks table
    cursor.execute("""
        CREATE TABLE banks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create accounts table
    cursor.execute("""
        CREATE TABLE accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bank_id INTEGER,
            name TEXT NOT NULL,
            account_type TEXT DEFAULT 'checking',
            balance REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bank_id) REFERENCES banks (id)
        )
    """)
    
    # Create transactions table
    cursor.execute("""
        CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER,
            date TEXT,
            description TEXT,
            amount REAL,
            note TEXT,
            category TEXT DEFAULT 'Uncategorized',
            raw_data TEXT,
            FOREIGN KEY (account_id) REFERENCES accounts (id)
        )
    """)
    
    # Create investment accounts table
    cursor.execute("""
        CREATE TABLE investment_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            account_type TEXT DEFAULT 'brokerage',
            custodian TEXT,
            account_number TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create securities table
    cursor.execute("""
        CREATE TABLE securities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            investment_account_id INTEGER,
            symbol TEXT,
            name TEXT,
            security_type TEXT,
            quantity REAL,
            share_price REAL,
            total_cost REAL,
            market_value REAL,
            unrealized_gain_loss REAL,
            statement_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (investment_account_id) REFERENCES investment_accounts (id)
        )
    """)
    
    # Create portfolio statements table
    cursor.execute("""
        CREATE TABLE portfolio_statements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            investment_account_id INTEGER,
            statement_date TEXT,
            opening_balance REAL,
            period_gain_loss REAL,
            ending_balance REAL,
            total_market_value REAL,
            total_cost_basis REAL,
            total_unrealized_gain_loss REAL,
            statement_file_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (investment_account_id) REFERENCES investment_accounts (id)
        )
    """)
    
    # Create credit card accounts table
    cursor.execute("""
        CREATE TABLE credit_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            account_type TEXT DEFAULT 'credit',
            provider TEXT,
            account_number TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create credit card statements table
    cursor.execute("""
        CREATE TABLE credit_statements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            credit_account_id INTEGER,
            statement_date TEXT,
            payment_due_date TEXT,
            new_balance REAL,
            minimum_payment_due REAL,
            statement_file_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (credit_account_id) REFERENCES credit_accounts (id)
        )
    """)
    
    # Create credit card transactions table
    cursor.execute("""
        CREATE TABLE credit_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            credit_statement_id INTEGER,
            transaction_date TEXT,
            description TEXT,
            amount REAL,
            category TEXT DEFAULT 'Uncategorized',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (credit_statement_id) REFERENCES credit_statements (id)
        )
    """)
    
    conn.commit()
    conn.close()
    print("Database schema recreated successfully")

# Only initialize database if it doesn't exist
if not os.path.exists(DATABASE_PATH):
    init_db()
    print("Database initialized for the first time")
else:
    print("Database already exists, skipping initialization")

class ColumnMapping(BaseModel):
    date: str
    description: str
    amount: str
    category: Optional[str] = None

class BankModel(BaseModel):
    name: str

class AccountModel(BaseModel):
    name: str
    account_type: str = "checking"
    
    @validator('account_type')
    def validate_account_type(cls, v):
        valid_types = ['checking', 'savings', 'credit', 'investment']
        if v not in valid_types:
            raise ValueError(f'account_type must be one of: {valid_types}')
        return v

class BatchCategoryUpdate(BaseModel):
    transaction_ids: List[int]
    category: str

class CategoryRule(BaseModel):
    pattern: str
    category: str
    account_id: int

class InvestmentAccountModel(BaseModel):
    name: str
    account_type: str = "brokerage"
    custodian: Optional[str] = None
    account_number: Optional[str] = None
    
    @validator('account_type')
    def validate_investment_account_type(cls, v):
        valid_types = ['brokerage', '401k', 'ira', 'roth_ira', '401k_roth', 'hsa', 'other']
        if v not in valid_types:
            raise ValueError(f'investment_account_type must be one of: {valid_types}')
        return v

class CreditAccountModel(BaseModel):
    name: str
    account_type: str = "credit"
    provider: Optional[str] = None
    account_number: Optional[str] = None

class CreditTransactionModel(BaseModel):
    transaction_date: str
    description: str
    amount: float
    category: Optional[str] = "Uncategorized"

class CreditStatementModel(BaseModel):
    statement_date: str
    payment_due_date: str
    new_balance: float
    minimum_payment_due: float
    credit_account_id: int
    transactions: Optional[List[CreditTransactionModel]] = []

class SecurityModel(BaseModel):
    symbol: str
    name: str
    security_type: str
    quantity: float
    share_price: float
    total_cost: float
    market_value: float
    unrealized_gain_loss: float
    statement_date: str

class PortfolioStatementModel(BaseModel):
    investment_account_id: int
    statement_date: str
    opening_balance: float
    period_gain_loss: float
    ending_balance: float
    total_market_value: float
    total_cost_basis: float
    total_unrealized_gain_loss: float
    securities: List[SecurityModel]

def safe_float(value):
    """Safely convert value to float, handling NaN and infinite values"""
    try:
        if pd.isna(value):
            return 0.0
        val = float(value)
        if not (val == val) or val == float('inf') or val == float('-inf'):
            return 0.0
        return val
    except (ValueError, TypeError):
        return 0.0

def clean_for_json(obj):
    """Clean data structure for JSON serialization"""
    if isinstance(obj, dict):
        return {str(k): clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(item) for item in obj]
    elif pd.isna(obj):
        return None
    elif isinstance(obj, (np.integer, np.floating)):
        if np.isnan(obj) or np.isinf(obj):
            return 0.0 if isinstance(obj, np.floating) else 0
        return obj.item()
    elif isinstance(obj, float):
        if not (obj == obj) or obj == float('inf') or obj == float('-inf'):
            return 0.0
        return obj
    else:
        return str(obj) if obj is not None else ""

def fuzzy_match_category(description: str, account_id: int, threshold: float = 0.4):
    """Find the best matching category for a description using fuzzy matching"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Get existing categorized transactions for this account
    cursor.execute("""
        SELECT DISTINCT description, category 
        FROM transactions 
        WHERE account_id = ? AND category != 'Uncategorized' AND category IS NOT NULL
    """, (account_id,))
    
    categorized_transactions = cursor.fetchall()
    conn.close()
    
    print(f"Fuzzy matching for '{description}' - found {len(categorized_transactions)} categorized transactions")
    
    if not categorized_transactions:
        print("No categorized transactions found to learn from")
        return "Uncategorized"
    
    best_match = None
    best_score = 0
    
    # Clean the input description for better matching
    clean_desc = re.sub(r'[^\w\s]', '', description.lower()).strip()
    print(f"Cleaned description: '{clean_desc}'")
    
    for existing_desc, category in categorized_transactions:
        clean_existing = re.sub(r'[^\w\s]', '', existing_desc.lower()).strip()
        
        # Calculate similarity score
        score = SequenceMatcher(None, clean_desc, clean_existing).ratio()
        
        # Also check for keyword matches
        desc_words = set(clean_desc.split())
        existing_words = set(clean_existing.split())
        common_words = desc_words.intersection(existing_words)
        
        if common_words:
            # Boost score if there are common significant words
            word_score = len(common_words) / max(len(desc_words), len(existing_words))
            score = max(score, word_score)
        
        print(f"Comparing with '{clean_existing}' (category: {category}) - score: {score:.3f}")
        
        if score > best_score and score >= threshold:
            best_score = score
            best_match = category
            print(f"New best match: {category} with score {score:.3f}")
    
    result = best_match if best_match else "Uncategorized"
    print(f"Final result: {result} (best score: {best_score:.3f})")
    return result

def create_category_rules_table():
    """Create table for storing category matching rules"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS category_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER,
            pattern TEXT NOT NULL,
            category TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (account_id) REFERENCES accounts (id)
        )
    """)
    
    conn.commit()
    conn.close()

def create_predefined_categories_table():
    """Create table for predefined hierarchical categories"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Drop existing table to recreate with new structure
    cursor.execute("DROP TABLE IF EXISTS predefined_categories")
    
    cursor.execute("""
        CREATE TABLE predefined_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_path TEXT UNIQUE NOT NULL,
            level_1 TEXT NOT NULL,
            level_2 TEXT,
            level_3 TEXT,
            level_4 TEXT,
            display_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert the hierarchical categories
    categories_data = [
        # Income
        ("Income", "Income", None, None, None, "Income"),
        ("Income:Salary", "Income", "Salary", None, None, "Salary & Wages"),
        ("Income:Business", "Income", "Business", None, None, "Business Income"),
        ("Income:Freelance", "Income", "Freelance", None, None, "Freelance/Contract"),
        ("Income:Investments", "Income", "Investments", None, None, "Investments"),
        ("Income:Investments:Dividends", "Income", "Investments", "Dividends", None, "Dividends"),
        ("Income:Investments:Interest", "Income", "Investments", "Interest", None, "Interest"),
        ("Income:Investments:CapitalGains", "Income", "Investments", "CapitalGains", None, "Capital Gains"),
        ("Income:Investments:Rental", "Income", "Investments", "Rental", None, "Rental Income"),
        ("Income:Government", "Income", "Government", None, None, "Government Benefits"),
        ("Income:Other", "Income", "Other", None, None, "Other Income"),
        
        # Expenses
        ("Expenses", "Expenses", None, None, None, "Expenses"),
        
        # Housing & Household
        ("Expenses:Housing", "Expenses", "Housing", None, None, "Housing"),
        ("Expenses:Housing:Rent", "Expenses", "Housing", "Rent", None, "Rent"),
        ("Expenses:Housing:Mortgage", "Expenses", "Housing", "Mortgage", None, "Mortgage"),
        ("Expenses:Housing:PropertyTax", "Expenses", "Housing", "PropertyTax", None, "Property Tax"),
        ("Expenses:Housing:HomeInsurance", "Expenses", "Housing", "HomeInsurance", None, "Home Insurance"),
        ("Expenses:Housing:Utilities", "Expenses", "Housing", "Utilities", None, "Utilities"),
        ("Expenses:Housing:Utilities:Electricity", "Expenses", "Housing", "Utilities", "Electricity", "Electricity"),
        ("Expenses:Housing:Utilities:Gas", "Expenses", "Housing", "Utilities", "Gas", "Gas"),
        ("Expenses:Housing:Utilities:Water", "Expenses", "Housing", "Utilities", "Water", "Water & Sewer"),
        ("Expenses:Housing:Utilities:Internet", "Expenses", "Housing", "Utilities", "Internet", "Internet"),
        ("Expenses:Housing:Utilities:Cable", "Expenses", "Housing", "Utilities", "Cable", "Cable/Streaming"),
        ("Expenses:Housing:Utilities:Phone", "Expenses", "Housing", "Utilities", "Phone", "Phone"),
        ("Expenses:Housing:Maintenance", "Expenses", "Housing", "Maintenance", None, "Maintenance & Repairs"),
        ("Expenses:Housing:Improvement", "Expenses", "Housing", "Improvement", None, "Home Improvement"),
        
        ("Expenses:Household", "Expenses", "Household", None, None, "Household Items"),
        ("Expenses:Household:Cleaning", "Expenses", "Household", "Cleaning", None, "Cleaning Supplies"),
        ("Expenses:Household:Kitchen", "Expenses", "Household", "Kitchen", None, "Kitchen & Dining"),
        ("Expenses:Household:Furniture", "Expenses", "Household", "Furniture", None, "Furniture"),
        ("Expenses:Household:Decor", "Expenses", "Household", "Decor", None, "Home Decor"),
        ("Expenses:Household:Gardening", "Expenses", "Household", "Gardening", None, "Gardening"),
        ("Expenses:Household:Gardening:Plants", "Expenses", "Household", "Gardening", "Plants", "Seeds & Plants"),
        ("Expenses:Household:Gardening:Tools", "Expenses", "Household", "Gardening", "Tools", "Tools & Equipment"),
        ("Expenses:Household:Gardening:Supplies", "Expenses", "Household", "Gardening", "Supplies", "Fertilizer & Soil"),
        
        # Food & Dining
        ("Expenses:Food", "Expenses", "Food", None, None, "Food & Dining"),
        ("Expenses:Food:Groceries", "Expenses", "Food", "Groceries", None, "Groceries"),
        ("Expenses:Food:Groceries:Produce", "Expenses", "Food", "Groceries", "Produce", "Fresh Produce"),
        ("Expenses:Food:Groceries:Meat", "Expenses", "Food", "Groceries", "Meat", "Meat & Seafood"),
        ("Expenses:Food:Groceries:Dairy", "Expenses", "Food", "Groceries", "Dairy", "Dairy & Eggs"),
        ("Expenses:Food:Groceries:Pantry", "Expenses", "Food", "Groceries", "Pantry", "Pantry Items"),
        ("Expenses:Food:Groceries:Beverages", "Expenses", "Food", "Groceries", "Beverages", "Beverages"),
        ("Expenses:Food:DiningOut", "Expenses", "Food", "DiningOut", None, "Dining Out"),
        ("Expenses:Food:DiningOut:Restaurants", "Expenses", "Food", "DiningOut", "Restaurants", "Restaurants"),
        ("Expenses:Food:DiningOut:FastFood", "Expenses", "Food", "DiningOut", "FastFood", "Fast Food"),
        ("Expenses:Food:DiningOut:Coffee", "Expenses", "Food", "DiningOut", "Coffee", "Coffee Shops"),
        ("Expenses:Food:DiningOut:Bars", "Expenses", "Food", "DiningOut", "Bars", "Bars & Nightlife"),
        ("Expenses:Food:Delivery", "Expenses", "Food", "Delivery", None, "Food Delivery"),
        
        # Transportation
        ("Expenses:Transportation", "Expenses", "Transportation", None, None, "Transportation"),
        ("Expenses:Transportation:Vehicle", "Expenses", "Transportation", "Vehicle", None, "Vehicle Expenses"),
        ("Expenses:Transportation:Vehicle:Fuel", "Expenses", "Transportation", "Vehicle", "Fuel", "Fuel"),
        ("Expenses:Transportation:Vehicle:Payment", "Expenses", "Transportation", "Vehicle", "Payment", "Car Payment"),
        ("Expenses:Transportation:Vehicle:Insurance", "Expenses", "Transportation", "Vehicle", "Insurance", "Car Insurance"),
        ("Expenses:Transportation:Vehicle:Maintenance", "Expenses", "Transportation", "Vehicle", "Maintenance", "Maintenance & Repairs"),
        ("Expenses:Transportation:Vehicle:Registration", "Expenses", "Transportation", "Vehicle", "Registration", "Registration & Fees"),
        ("Expenses:Transportation:PublicTransit", "Expenses", "Transportation", "PublicTransit", None, "Public Transportation"),
        ("Expenses:Transportation:RideShare", "Expenses", "Transportation", "RideShare", None, "Ride Share"),
        ("Expenses:Transportation:Parking", "Expenses", "Transportation", "Parking", None, "Parking"),
        ("Expenses:Transportation:Travel", "Expenses", "Transportation", "Travel", None, "Travel"),
        
        # Personal Care & Health
        ("Expenses:Healthcare", "Expenses", "Healthcare", None, None, "Healthcare"),
        ("Expenses:Healthcare:Doctor", "Expenses", "Healthcare", "Doctor", None, "Doctor Visits"),
        ("Expenses:Healthcare:Dental", "Expenses", "Healthcare", "Dental", None, "Dental"),
        ("Expenses:Healthcare:Vision", "Expenses", "Healthcare", "Vision", None, "Vision"),
        ("Expenses:Healthcare:Pharmacy", "Expenses", "Healthcare", "Pharmacy", None, "Pharmacy"),
        ("Expenses:Healthcare:Insurance", "Expenses", "Healthcare", "Insurance", None, "Health Insurance"),
        ("Expenses:Healthcare:Mental", "Expenses", "Healthcare", "Mental", None, "Mental Health"),
        
        ("Expenses:PersonalCare", "Expenses", "PersonalCare", None, None, "Personal Care"),
        ("Expenses:PersonalCare:Hair", "Expenses", "PersonalCare", "Hair", None, "Haircare"),
        ("Expenses:PersonalCare:Skincare", "Expenses", "PersonalCare", "Skincare", None, "Skincare"),
        ("Expenses:PersonalCare:Clothing", "Expenses", "PersonalCare", "Clothing", None, "Clothing"),
        ("Expenses:PersonalCare:Clothing:Work", "Expenses", "PersonalCare", "Clothing", "Work", "Work Clothes"),
        ("Expenses:PersonalCare:Clothing:Casual", "Expenses", "PersonalCare", "Clothing", "Casual", "Casual Wear"),
        ("Expenses:PersonalCare:Clothing:Shoes", "Expenses", "PersonalCare", "Clothing", "Shoes", "Shoes"),
        ("Expenses:PersonalCare:Clothing:Accessories", "Expenses", "PersonalCare", "Clothing", "Accessories", "Accessories"),
        ("Expenses:PersonalCare:Fitness", "Expenses", "PersonalCare", "Fitness", None, "Fitness & Gym"),
        
        # Family & Dependents
        ("Expenses:Family", "Expenses", "Family", None, None, "Family & Dependents"),
        ("Expenses:Family:Childcare", "Expenses", "Family", "Childcare", None, "Childcare"),
        ("Expenses:Family:ChildEducation", "Expenses", "Family", "ChildEducation", None, "Child Education"),
        ("Expenses:Family:ChildActivities", "Expenses", "Family", "ChildActivities", None, "Child Activities"),
        ("Expenses:Family:Support", "Expenses", "Family", "Support", None, "Family Support"),
        ("Expenses:Family:Pets", "Expenses", "Family", "Pets", None, "Pet Care"),
        
        # Entertainment & Lifestyle
        ("Expenses:Entertainment", "Expenses", "Entertainment", None, None, "Entertainment & Lifestyle"),
        ("Expenses:Entertainment:Movies", "Expenses", "Entertainment", "Movies", None, "Movies & Theater"),
        ("Expenses:Entertainment:Concerts", "Expenses", "Entertainment", "Concerts", None, "Concerts & Events"),
        ("Expenses:Entertainment:Hobbies", "Expenses", "Entertainment", "Hobbies", None, "Hobbies"),
        ("Expenses:Entertainment:Sports", "Expenses", "Entertainment", "Sports", None, "Sports & Recreation"),
        ("Expenses:Entertainment:Subscriptions", "Expenses", "Entertainment", "Subscriptions", None, "Subscriptions"),
        ("Expenses:Entertainment:Subscriptions:Streaming", "Expenses", "Entertainment", "Subscriptions", "Streaming", "Streaming Services"),
        ("Expenses:Entertainment:Subscriptions:Software", "Expenses", "Entertainment", "Subscriptions", "Software", "Software"),
        ("Expenses:Entertainment:Subscriptions:Magazines", "Expenses", "Entertainment", "Subscriptions", "Magazines", "Magazines"),
        ("Expenses:Entertainment:Vacation", "Expenses", "Entertainment", "Vacation", None, "Travel & Vacation"),
        
        # Professional & Education
        ("Expenses:Professional", "Expenses", "Professional", None, None, "Professional & Education"),
        ("Expenses:Professional:Development", "Expenses", "Professional", "Development", None, "Professional Development"),
        ("Expenses:Professional:Education", "Expenses", "Professional", "Education", None, "Education & Training"),
        ("Expenses:Professional:WorkExpenses", "Expenses", "Professional", "WorkExpenses", None, "Work Expenses"),
        ("Expenses:Professional:Services", "Expenses", "Professional", "Services", None, "Professional Services"),
        
        # Financial & Administrative
        ("Expenses:Financial", "Expenses", "Financial", None, None, "Financial & Administrative"),
        ("Expenses:Financial:BankFees", "Expenses", "Financial", "BankFees", None, "Bank Fees"),
        ("Expenses:Financial:CreditCardFees", "Expenses", "Financial", "CreditCardFees", None, "Credit Card Fees"),
        ("Expenses:Financial:ProfessionalServices", "Expenses", "Financial", "ProfessionalServices", None, "Professional Services"),
        ("Expenses:Financial:ProfessionalServices:Legal", "Expenses", "Financial", "ProfessionalServices", "Legal", "Legal"),
        ("Expenses:Financial:ProfessionalServices:Accounting", "Expenses", "Financial", "ProfessionalServices", "Accounting", "Accounting"),
        ("Expenses:Financial:ProfessionalServices:Financial", "Expenses", "Financial", "ProfessionalServices", "Financial", "Financial Planning"),
        ("Expenses:Financial:Insurance", "Expenses", "Financial", "Insurance", None, "Insurance"),
        ("Expenses:Financial:Insurance:Life", "Expenses", "Financial", "Insurance", "Life", "Life Insurance"),
        ("Expenses:Financial:Insurance:Disability", "Expenses", "Financial", "Insurance", "Disability", "Disability Insurance"),
        ("Expenses:Financial:Taxes", "Expenses", "Financial", "Taxes", None, "Taxes"),
        
        # Miscellaneous
        ("Expenses:Miscellaneous", "Expenses", "Miscellaneous", None, None, "Miscellaneous"),
        ("Expenses:Miscellaneous:Donations", "Expenses", "Miscellaneous", "Donations", None, "Donations"),
        ("Expenses:Miscellaneous:Fees", "Expenses", "Miscellaneous", "Fees", None, "Fees"),
        ("Expenses:Miscellaneous:Other", "Expenses", "Miscellaneous", "Other", None, "Other"),
        
        # Transfers
        ("Transfers", "Transfers", None, None, None, "Transfers"),
        ("Transfers:BankTransfer", "Transfers", "BankTransfer", None, None, "Bank Transfer"),
        ("Transfers:InternalTransfer", "Transfers", "InternalTransfer", None, None, "Internal Transfer"),
        ("Transfers:CreditCardPayment", "Transfers", "CreditCardPayment", None, None, "Credit Card Payment"),
        
        # Credit Card Specific Categories
        ("Expenses:CreditCard", "Expenses", "CreditCard", None, None, "Credit Card Expenses"),
        ("Expenses:CreditCard:AnnualFee", "Expenses", "CreditCard", "AnnualFee", None, "Annual Fee"),
        ("Expenses:CreditCard:LateFee", "Expenses", "CreditCard", "LateFee", None, "Late Fee"),
        ("Expenses:CreditCard:Interest", "Expenses", "CreditCard", "Interest", None, "Interest Charge"),
        ("Expenses:CreditCard:ForeignTransaction", "Expenses", "CreditCard", "ForeignTransaction", None, "Foreign Transaction Fee"),
        ("Expenses:CreditCard:BalanceTransfer", "Expenses", "CreditCard", "BalanceTransfer", None, "Balance Transfer Fee"),
        
        # Deposits
        ("Deposits", "Deposits", None, None, None, "Deposits"),
        ("Deposits:CashDeposit", "Deposits", "CashDeposit", None, None, "Cash Deposit"),
        ("Deposits:CheckDeposit", "Deposits", "CheckDeposit", None, None, "Check Deposit"),
        ("Deposits:Refund", "Deposits", "Refund", None, None, "Refund"),
        
        # Savings and Investments
        ("SavingsAndInvestments", "SavingsAndInvestments", None, None, None, "Savings & Investments"),
        ("SavingsAndInvestments:EmergencyFund", "SavingsAndInvestments", "EmergencyFund", None, None, "Emergency Fund"),
        ("SavingsAndInvestments:Retirement", "SavingsAndInvestments", "Retirement", None, None, "Retirement"),
        ("SavingsAndInvestments:Brokerage", "SavingsAndInvestments", "Brokerage", None, None, "Brokerage"),
    ]
    
    cursor.executemany("""
        INSERT INTO predefined_categories (category_path, level_1, level_2, level_3, level_4, display_name)
        VALUES (?, ?, ?, ?, ?, ?)
    """, categories_data)
    
    conn.commit()
    conn.close()
    print("Predefined categories table created and populated successfully")

# Initialize the tables
create_category_rules_table()
create_predefined_categories_table()

@app.get("/")
async def root():
    return {"message": "Personal Finance Manager API"}

@app.get("/banks")
async def get_banks():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.id, b.name, 
               COUNT(a.id) as account_count,
               COALESCE(SUM(a.balance), 0) as total_balance
        FROM banks b 
        LEFT JOIN accounts a ON b.id = a.bank_id 
        GROUP BY b.id, b.name
    """)
    banks = [
        {
            "id": row[0], 
            "name": row[1], 
            "account_count": row[2],
            "total_balance": safe_float(row[3])
        } 
        for row in cursor.fetchall()
    ]
    conn.close()
    return banks

@app.post("/banks")
async def create_bank(bank: BankModel):
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO banks (name) VALUES (?)", (bank.name,))
        bank_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return {"id": bank_id, "name": bank.name}
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Bank already exists")

@app.get("/banks/{bank_id}/accounts")
async def get_accounts(bank_id: int):
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.id, a.name, a.account_type, a.balance,
               COUNT(t.id) as transaction_count
        FROM accounts a 
        LEFT JOIN transactions t ON a.id = t.account_id 
        WHERE a.bank_id = ?
        GROUP BY a.id, a.name, a.account_type, a.balance
    """, (bank_id,))
    accounts = [
        {
            "id": row[0],
            "name": row[1],
            "account_type": row[2],
            "balance": safe_float(row[3]),
            "transaction_count": row[4]
        }
        for row in cursor.fetchall()
    ]
    conn.close()
    return accounts

@app.post("/banks/{bank_id}/accounts")
async def create_account(bank_id: int, account: AccountModel):
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    try:
        # Special handling for credit card accounts
        if account.account_type == "credit":
            # For credit cards, we might want to set initial balance to 0 or negative
            # and add some credit card specific fields in the future
            print(f"Creating credit card account: {account.name}")
        
        cursor.execute(
            "INSERT INTO accounts (bank_id, name, account_type) VALUES (?, ?, ?)",
            (bank_id, account.name, account.account_type)
        )
        account_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Return account info with additional metadata for credit cards
        response = {"id": account_id, "name": account.name, "account_type": account.account_type}
        if account.account_type == "credit":
            response["is_credit_card"] = True
            response["message"] = "Credit card account created successfully. You can now import credit card statements."
        
        return response
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/upload-csv/{account_id}")
async def upload_csv(account_id: int, file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    content = await file.read()
    df = pd.read_csv(pd.io.common.StringIO(content.decode('utf-8')))
    
    # Clean the preview data for JSON serialization
    preview_data = df.head(5).to_dict('records')
    cleaned_preview = clean_for_json(preview_data)
    
    return {
        "columns": df.columns.tolist(),
        "preview": cleaned_preview,
        "total_rows": len(df)
    }

@app.post("/import-transactions/{account_id}")
async def import_transactions(account_id: int, file: UploadFile = File(...), mapping: str = Form(...)):
    try:
        print(f"Received mapping parameter: {mapping}")
        print(f"Mapping type: {type(mapping)}")
        
        if not mapping or mapping.strip() == "":
            raise HTTPException(status_code=400, detail="Column mapping required")
        
        column_mapping = json.loads(mapping)
        print(f"Parsed mapping: {column_mapping}")
        
        # Validate required fields
        required_fields = ['date', 'description', 'amount']
        for field in required_fields:
            if not column_mapping.get(field):
                raise HTTPException(status_code=400, detail=f"Required field '{field}' not mapped")
        
        content = await file.read()
        df = pd.read_csv(pd.io.common.StringIO(content.decode('utf-8')))
        print(f"CSV loaded with {len(df)} rows and columns: {df.columns.tolist()}")
        
        # Validate that mapped columns exist in CSV
        for field, column in column_mapping.items():
            if column and column not in df.columns:
                raise HTTPException(status_code=400, detail=f"Column '{column}' not found in CSV")
                
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON in mapping parameter")
    except Exception as e:
        print(f"Error in import setup: {e}")
        raise HTTPException(status_code=400, detail=f"Error processing request: {str(e)}")
    
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        imported_count = 0
        for _, row in df.iterrows():
            try:
                date_val = str(row[column_mapping['date']])
                desc_val = str(row[column_mapping['description']])
                
                # Handle amount conversion safely
                amount_str = str(row[column_mapping['amount']]).replace(',', '').replace('$', '').strip()
                try:
                    amount_val = float(amount_str)
                    # Check for NaN or infinite values
                    if not (amount_val == amount_val) or amount_val == float('inf') or amount_val == float('-inf'):
                        amount_val = 0.0
                except (ValueError, TypeError):
                    amount_val = 0.0
                
                note_val = str(row.get(column_mapping.get('note', ''), ''))
                category_val = str(row.get(column_mapping.get('category', ''), 'Uncategorized'))
                
                # Create a clean dict for JSON serialization
                row_dict = {}
                for key, value in row.to_dict().items():
                    try:
                        # Convert to string to avoid JSON serialization issues
                        row_dict[str(key)] = str(value) if pd.notna(value) else ''
                    except:
                        row_dict[str(key)] = ''
                
                cursor.execute("""
                    INSERT INTO transactions (account_id, date, description, amount, note, category, raw_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (account_id, date_val, desc_val, amount_val, note_val, category_val, json.dumps(row_dict)))
                imported_count += 1
            except Exception as e:
                print(f"Error processing row: {e}")
                continue
        
        # Update account balance with special handling for credit cards
        cursor.execute("SELECT account_type FROM accounts WHERE id = ?", (account_id,))
        account_type_result = cursor.fetchone()
        account_type = account_type_result[0] if account_type_result else "checking"
        
        if account_type == "credit":
            # For credit cards, negative amounts are expenses (increases balance owed)
            # Positive amounts are payments (decreases balance owed)
            cursor.execute("SELECT SUM(amount) FROM transactions WHERE account_id = ?", (account_id,))
            balance = safe_float(cursor.fetchone()[0] or 0)
            # Credit card balance is typically negative (amount owed)
            if balance > 0:
                balance = -balance  # Convert to negative for credit card debt
        else:
            # For regular accounts, positive amounts are credits, negative are debits
            cursor.execute("SELECT SUM(amount) FROM transactions WHERE account_id = ?", (account_id,))
            balance = safe_float(cursor.fetchone()[0] or 0)
        
        cursor.execute("UPDATE accounts SET balance = ? WHERE id = ?", (balance, account_id))
        
        conn.commit()
        conn.close()
        
        # Return additional info for credit card accounts
        response = {"message": f"Imported {imported_count} transactions"}
        
        if account_type == "credit":
            response["credit_card_info"] = {
                "total_expenses": abs(balance) if balance < 0 else 0,
                "total_payments": abs(balance) if balance > 0 else 0,
                "current_balance": balance,
                "message": "Credit card transactions imported. Negative balance indicates amount owed."
            }
        
        return response
    except Exception as e:
        print(f"Error in transaction import: {e}")
        raise HTTPException(status_code=500, detail=f"Error importing transactions: {str(e)}")

@app.get("/accounts/{account_id}/credit-card-info")
async def get_credit_card_info(account_id: int):
    """Get credit card specific information for an account"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if this is a credit card account
        cursor.execute("SELECT account_type, name FROM accounts WHERE id = ?", (account_id,))
        account_result = cursor.fetchone()
        
        if not account_result:
            raise HTTPException(status_code=404, detail="Account not found")
        
        account_type, account_name = account_result
        
        if account_type != "credit":
            raise HTTPException(status_code=400, detail="This endpoint is only for credit card accounts")
        
        # Get credit card specific data
        cursor.execute("""
            SELECT 
                COUNT(*) as transaction_count,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expenses,
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_payments,
                SUM(amount) as current_balance
            FROM transactions 
            WHERE account_id = ? 
        """, (account_id,))
        
        stats = cursor.fetchone()
        
        # Get recent transactions
        cursor.execute("""
            SELECT date, description, amount, category
            FROM transactions 
            WHERE account_id = ? 
            ORDER BY date DESC 
            LIMIT 10
        """, (account_id,))
        
        recent_transactions = [
            {
                "date": row[0],
                "description": row[1],
                "amount": row[2],
                "category": row[3]
            }
            for row in cursor.fetchall()
        ]
        
        conn.close()
        
        return {
            "account_id": account_id,
            "account_name": account_name,
            "account_type": account_type,
            "transaction_count": stats[0] or 0,
            "total_expenses": stats[1] or 0,
            "total_payments": stats[2] or 0,
            "current_balance": stats[3] or 0,
            "amount_owed": abs(stats[3]) if stats[3] and stats[3] < 0 else 0,
            "recent_transactions": recent_transactions,
            "credit_card_tips": [
                "Negative balance indicates amount owed",
                "Negative amounts are expenses/charges",
                "Positive amounts are payments/credits",
                "Use this endpoint to monitor credit card spending"
            ]
        }
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Error getting credit card info: {str(e)}")

@app.post("/parse-credit-card-statement")
async def parse_credit_card_statement(file: UploadFile = File(...)):
    """Parse a credit card statement PDF and extract data"""
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save the uploaded file temporarily
        temp_file_path = f"./data/temp_credit_card_{file.filename}"
        os.makedirs("./data", exist_ok=True)
        
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        try:
            # Import and use the credit card parser
            from credit_card_parser import CreditCardParser
            
            parser = CreditCardParser()
            parsed_data = parser.parse_statement(temp_file_path, debug=True)
            
            if "error" in parsed_data:
                raise HTTPException(status_code=400, detail=parsed_data["error"])
            
            # Format for import
            import_data = parser.format_for_import(parsed_data)
            
            # Clean up temp file
            os.remove(temp_file_path)
            
            # Return in the format the frontend expects
            return {
                "success": True,
                "parsed_data": import_data,
                "message": "PDF parsed successfully"
            }
            
        except ImportError:
            # Fallback if credit card parser is not available
            raise HTTPException(status_code=500, detail="Credit card parser not available")
        except Exception as e:
            # Clean up temp file on error
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            raise HTTPException(status_code=500, detail=f"Error parsing credit card statement: {str(e)}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.get("/transactions/{account_id}")
async def get_transactions(account_id: int, limit: int = 100):
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, date, description, amount, note, category 
        FROM transactions 
        WHERE account_id = ? 
        ORDER BY date DESC 
        LIMIT ?
    """, (account_id, limit))
    
    transactions = [
        {
            "id": row[0],
            "date": row[1],
            "description": row[2],
            "amount": safe_float(row[3]),
            "note": row[4],
            "category": row[5]
        }
        for row in cursor.fetchall()
    ]
    conn.close()
    return transactions

@app.post("/sample-data/{account_id}")
async def load_sample_data(account_id: int):
    """Load sample transaction data from JSON file"""
    try:
        with open('sample_data.json', 'r') as f:
            sample_transactions = json.load(f)
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        for transaction in sample_transactions:
            try:
                amount = float(transaction['amount'])
                # Check for NaN or infinite values
                if not (amount == amount) or amount == float('inf') or amount == float('-inf'):
                    amount = 0.0
                    
                cursor.execute("""
                    INSERT INTO transactions (account_id, date, description, amount, note, category)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    account_id,
                    str(transaction['date']),
                    str(transaction['description']),
                    amount,
                    str(transaction['note']),
                    'Uncategorized'
                ))
            except Exception as e:
                print(f"Error loading sample transaction: {e}")
                continue
        
        # Update account balance
        cursor.execute("SELECT SUM(amount) FROM transactions WHERE account_id = ?", (account_id,))
        balance = safe_float(cursor.fetchone()[0] or 0)
        cursor.execute("UPDATE accounts SET balance = ? WHERE id = ?", (balance, account_id))
        
        conn.commit()
        conn.close()
        
        return {"message": f"Loaded {len(sample_transactions)} sample transactions"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/categories")
async def get_categories():
    """Get hierarchical categories"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT category_path, level_1, level_2, level_3, level_4, display_name
            FROM predefined_categories
            ORDER BY category_path
        """)
        
        categories = [dict(row) for row in cursor.fetchall()]
        
        # Build hierarchical structure
        hierarchy = {}
        flat_list = []
        
        for cat in categories:
            flat_list.append({
                'value': cat['category_path'],
                'label': cat['display_name'],
                'level_1': cat['level_1'],
                'level_2': cat['level_2'],
                'level_3': cat['level_3'],
                'level_4': cat['level_4']
            })
            
            # Build nested structure
            current = hierarchy
            levels = [cat['level_1'], cat['level_2'], cat['level_3'], cat['level_4']]
            path_parts = []
            
            for i, level in enumerate(levels):
                if level:
                    path_parts.append(level)
                    if level not in current:
                        current[level] = {
                            'children': {},
                            'path': ':'.join(path_parts),
                            'display_name': cat['display_name'] if i == len([l for l in levels if l]) - 1 else level,
                            'level': i + 1
                        }
                    current = current[level]['children']
        
        conn.close()
        return {
            "success": True, 
            "categories": {
                "hierarchy": hierarchy,
                "flat": flat_list
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")

@app.get("/analytics/{account_id}")
async def get_analytics(account_id: int):
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Monthly spending
    cursor.execute("""
        SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
        FROM transactions 
        WHERE account_id = ? AND amount < 0
        GROUP BY month
        ORDER BY month
    """, (account_id,))
    monthly_spending = [{"month": row[0], "amount": safe_float(abs(row[1]))} for row in cursor.fetchall()]
    
    # Category breakdown
    cursor.execute("""
        SELECT category, SUM(ABS(amount)) as total
        FROM transactions 
        WHERE account_id = ? AND amount < 0
        GROUP BY category
        ORDER BY total DESC
    """, (account_id,))
    categories = [{"category": row[0], "amount": safe_float(row[1])} for row in cursor.fetchall()]
    
    conn.close()
    return {
        "monthly_spending": monthly_spending,
        "categories": categories
    }

@app.post("/batch-update-category")
async def batch_update_category(update: BatchCategoryUpdate):
    """Update category for multiple transactions"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # Update the transactions
        placeholders = ','.join(['?' for _ in update.transaction_ids])
        cursor.execute(f"""
            UPDATE transactions 
            SET category = ? 
            WHERE id IN ({placeholders})
        """, [update.category] + update.transaction_ids)
        
        updated_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        return {"message": f"Updated {updated_count} transactions to category '{update.category}'"}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/categories/{account_id}")
async def get_categories(account_id: int):
    """Get all unique categories for an account"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT DISTINCT category, COUNT(*) as count
        FROM transactions 
        WHERE account_id = ? AND category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
    """, (account_id,))
    
    categories = [{"name": row[0], "count": row[1]} for row in cursor.fetchall()]
    conn.close()
    return categories

@app.post("/auto-categorize/{account_id}")
async def auto_categorize_transactions(account_id: int):
    """Automatically categorize uncategorized transactions using fuzzy matching"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # Check how many categorized transactions we have to learn from
        cursor.execute("""
            SELECT COUNT(*) 
            FROM transactions 
            WHERE account_id = ? AND category != 'Uncategorized' AND category IS NOT NULL
        """, (account_id,))
        categorized_count = cursor.fetchone()[0]
        print(f"Found {categorized_count} categorized transactions to learn from")
        
        # Get uncategorized transactions
        cursor.execute("""
            SELECT id, description 
            FROM transactions 
            WHERE account_id = ? AND (category = 'Uncategorized' OR category IS NULL)
        """, (account_id,))
        
        uncategorized = cursor.fetchall()
        print(f"Found {len(uncategorized)} uncategorized transactions to process")
        updated_count = 0
        
        for transaction_id, description in uncategorized:
            print(f"Processing transaction {transaction_id}: {description}")
            suggested_category = fuzzy_match_category(description, account_id)
            print(f"Suggested category: {suggested_category}")
            
            if suggested_category != "Uncategorized":
                cursor.execute("""
                    UPDATE transactions 
                    SET category = ? 
                    WHERE id = ?
                """, (suggested_category, transaction_id))
                updated_count += 1
                print(f"Updated transaction {transaction_id} to category: {suggested_category}")
        
        conn.commit()
        conn.close()
        
        return {"message": f"Auto-categorized {updated_count} transactions out of {len(uncategorized)} uncategorized transactions. Had {categorized_count} categorized transactions to learn from."}
    except Exception as e:
        print(f"Error in auto-categorize: {e}")
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/category-rules")
async def create_category_rule(rule: CategoryRule):
    """Create a new category matching rule"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO category_rules (account_id, pattern, category)
            VALUES (?, ?, ?)
        """, (rule.account_id, rule.pattern, rule.category))
        
        rule_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {"id": rule_id, "message": "Category rule created successfully"}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/category-rules/{account_id}")
async def get_category_rules(account_id: int):
    """Get all category rules for an account"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, pattern, category, created_at
        FROM category_rules 
        WHERE account_id = ?
        ORDER BY created_at DESC
    """, (account_id,))
    
    rules = [
        {
            "id": row[0],
            "pattern": row[1], 
            "category": row[2],
            "created_at": row[3]
        } 
        for row in cursor.fetchall()
    ]
    conn.close()
    return rules

@app.get("/debug/transactions/{account_id}")
async def debug_transactions(account_id: int):
    """Debug endpoint to see transaction categories"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT category, COUNT(*) as count
        FROM transactions 
        WHERE account_id = ?
        GROUP BY category
        ORDER BY count DESC
    """, (account_id,))
    
    category_counts = [{"category": row[0], "count": row[1]} for row in cursor.fetchall()]
    
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE account_id = ?", (account_id,))
    total_count = cursor.fetchone()[0]
    
    conn.close()
    return {
        "total_transactions": total_count,
        "category_breakdown": category_counts
    }

@app.get("/predefined-categories")
async def get_predefined_categories():
    """Get list of predefined categories from database"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Get all categories
    cursor.execute("""
        SELECT category_path, level_1, level_2, level_3, level_4, display_name
        FROM predefined_categories
        ORDER BY category_path
    """)
    
    categories_data = cursor.fetchall()
    conn.close()
    
    # Group categories by level_1
    grouped = {}
    flat_categories = []
    
    for row in categories_data:
        category_path, level_1, level_2, level_3, level_4, display_name = row
        
        # Add to flat list (use display_name for user-friendly names)
        flat_categories.append(display_name)
        
        # Group by level_1
        if level_1 not in grouped:
            grouped[level_1] = []
        
        # Only add leaf categories (those with actual display names that aren't just level names)
        if level_2 is not None:  # Skip top-level categories like "Income", "Expenses"
            grouped[level_1].append(display_name)
    
    return {
        "grouped": grouped,
        "flat": sorted(list(set(flat_categories))),  # Remove duplicates and sort
        "hierarchical": [
            {
                "path": row[0],
                "level_1": row[1],
                "level_2": row[2],
                "level_3": row[3], 
                "level_4": row[4],
                "display_name": row[5]
            }
            for row in categories_data
        ]
    }

@app.get("/predefined-categories/hierarchy")
async def get_category_hierarchy():
    """Get hierarchical category structure for tree display"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT category_path, level_1, level_2, level_3, level_4, display_name
        FROM predefined_categories
        ORDER BY category_path
    """)
    
    categories_data = cursor.fetchall()
    conn.close()
    
    # Build hierarchical structure
    hierarchy = {}
    
    for row in categories_data:
        category_path, level_1, level_2, level_3, level_4, display_name = row
        
        # Initialize level_1 if not exists
        if level_1 not in hierarchy:
            hierarchy[level_1] = {"name": level_1, "children": {}}
        
        current_level = hierarchy[level_1]["children"]
        
        # Add level_2 if exists
        if level_2:
            if level_2 not in current_level:
                current_level[level_2] = {"name": level_2, "children": {}}
            current_level = current_level[level_2]["children"]
            
            # Add level_3 if exists
            if level_3:
                if level_3 not in current_level:
                    current_level[level_3] = {"name": level_3, "children": {}}
                current_level = current_level[level_3]["children"]
                
                # Add level_4 if exists
                if level_4:
                    current_level[level_4] = {
                        "name": level_4,
                        "display_name": display_name,
                        "path": category_path,
                        "children": {}
                    }
                else:
                    # level_3 is the leaf
                    current_level["_leaf"] = {
                        "display_name": display_name,
                        "path": category_path
                    }
            else:
                # level_2 is the leaf
                current_level["_leaf"] = {
                    "display_name": display_name,
                    "path": category_path
                }
    
    return hierarchy

@app.get("/predefined-categories/search")
async def search_categories(q: str = ""):
    """Search categories by name or path"""
    if not q or len(q) < 2:
        return []
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT category_path, display_name
        FROM predefined_categories
        WHERE display_name LIKE ? OR category_path LIKE ?
        ORDER BY 
            CASE 
                WHEN display_name LIKE ? THEN 1
                WHEN display_name LIKE ? THEN 2
                ELSE 3
            END,
            display_name
        LIMIT 20
    """, (f"%{q}%", f"%{q}%", f"{q}%", f"%{q}%"))
    
    results = [
        {
            "path": row[0],
            "display_name": row[1]
        }
        for row in cursor.fetchall()
    ]
    
    conn.close()
    return results

@app.get("/predefined-categories/grouped")
async def get_grouped_categories():
    """Get categories grouped by main category for better organization"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT level_1, display_name, category_path
        FROM predefined_categories
        WHERE level_2 IS NOT NULL
        ORDER BY level_1, display_name
    """)
    
    categories_data = cursor.fetchall()
    conn.close()
    
    # Group by level_1
    grouped = {}
    for level_1, display_name, category_path in categories_data:
        if level_1 not in grouped:
            grouped[level_1] = []
        grouped[level_1].append({
            "name": display_name,
            "path": category_path
        })
    
    return grouped

@app.post("/predefined-categories")
async def add_predefined_category(category_data: dict):
    """Add a new predefined category"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Extract category data
        level_1 = category_data.get("level_1", "Transfers")
        level_2 = category_data.get("level_2", "Personal")
        level_3 = category_data.get("level_3")
        level_4 = category_data.get("level_4")
        display_name = category_data.get("display_name", "Wife Transfer")
        
        # Build category path
        category_path = ":".join(filter(None, [level_1, level_2, level_3, level_4]))
        
        # Insert new category
        cursor.execute("""
            INSERT INTO predefined_categories 
            (category_path, level_1, level_2, level_3, level_4, display_name)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (category_path, level_1, level_2, level_3, level_4, display_name))
        
        conn.commit()
        conn.close()
        
        return {"message": f"Category '{display_name}' added successfully", "category": category_data}
        
    except Exception as e:
        return {"error": f"Failed to add category: {str(e)}"}, 500

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Initialize backup manager
backup_manager = BackupManager()

class BackupRequest(BaseModel):
    bank_id: int
    bank_name: Optional[str] = None

class RestoreRequest(BaseModel):
    backup_file: str
    new_bank_name: Optional[str] = None

@app.post("/backup/bank")
async def backup_bank(request: BackupRequest):
    """Create a backup of a specific bank and all its data"""
    try:
        backup_path = backup_manager.backup_bank(request.bank_id, request.bank_name)
        return {
            "success": True,
            "message": "Bank backup created successfully",
            "backup_file": backup_path
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@app.post("/restore/bank")
async def restore_bank(request: RestoreRequest):
    """Restore a bank from a backup file"""
    try:
        # Construct full backup file path
        backup_path = f"./backups/{request.backup_file}"
        result = backup_manager.restore_bank(backup_path, request.new_bank_name)
        return {
            "success": True,
            "message": f"Bank '{result['bank_name']}' restored successfully",
            "details": result
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")

@app.get("/backups")
async def list_backups():
    """List all available backup files"""
    try:
        backups = backup_manager.list_backups()
        return {
            "success": True,
            "backups": backups
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list backups: {str(e)}")

@app.delete("/backups/{backup_filename}")
async def delete_backup(backup_filename: str):
    """Delete a backup file"""
    try:
        backup_path = f"./backups/{backup_filename}"
        success = backup_manager.delete_backup(backup_path)
        if success:
            return {"success": True, "message": "Backup deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Backup file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete backup: {str(e)}")

@app.post("/setup-demo")
async def setup_demo():
    """Create demo bank and account with sample data"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Create demo bank
        cursor.execute("INSERT OR IGNORE INTO banks (name) VALUES (?)", ("Demo Bank",))
        cursor.execute("SELECT id FROM banks WHERE name = ?", ("Demo Bank",))
        bank_id = cursor.fetchone()[0]
        
        # Create demo account
        cursor.execute("""
            INSERT OR IGNORE INTO accounts (bank_id, name, account_type, balance) 
            VALUES (?, ?, ?, ?)
        """, (bank_id, "Demo Checking", "checking", 5000.00))
        
        cursor.execute("SELECT id FROM accounts WHERE bank_id = ? AND name = ?", (bank_id, "Demo Checking"))
        account_id = cursor.fetchone()[0]
        
        # Add sample transactions
        sample_transactions = [
            ("2024-01-15", "Salary Deposit", 3000.00, "Income:Salary"),
            ("2024-01-16", "Grocery Store", -120.50, "Expenses:Food:Groceries"),
            ("2024-01-17", "Gas Station", -45.00, "Expenses:Transportation:Fuel"),
            ("2024-01-18", "Restaurant", -65.25, "Expenses:Food:DiningOut"),
            ("2024-01-19", "Electric Bill", -89.99, "Expenses:Housing:Utilities:Electricity"),
            ("2024-01-20", "ATM Withdrawal", -100.00, "Transfers:CashWithdrawal"),
            ("2024-01-25", "Mortgage Payment", -1850.00, "Expenses:Housing:Mortgage"),
            ("2024-01-26", "Water Bill", -125.00, "Expenses:Housing:Utilities:Water"),
            ("2024-01-27", "Internet Service", -95.50, "Expenses:Housing:Utilities:Internet"),
            ("2024-01-28", "Home Insurance", -200.00, "Expenses:Housing:HomeInsurance"),
            ("2024-01-29", "Property Tax", -450.00, "Expenses:Housing:PropertyTax"),
        ]
        
        for date, desc, amount, category in sample_transactions:
            cursor.execute("""
                INSERT OR IGNORE INTO transactions (account_id, date, description, amount, category)
                VALUES (?, ?, ?, ?, ?)
            """, (account_id, date, desc, amount, category))
        
        # Update account balance
        cursor.execute("SELECT SUM(amount) FROM transactions WHERE account_id = ?", (account_id,))
        balance = safe_float(cursor.fetchone()[0] or 0)
        cursor.execute("UPDATE accounts SET balance = ? WHERE id = ?", (balance, account_id))
        
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Demo data created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create demo data: {str(e)}")

@app.delete("/banks/{bank_id}")
async def delete_bank(bank_id: int):
    """Delete a bank and all its associated accounts and transactions"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Check if bank exists
        cursor.execute("SELECT id, name FROM banks WHERE id = ?", (bank_id,))
        bank = cursor.fetchone()
        if not bank:
            raise HTTPException(status_code=404, detail="Bank not found")
        
        bank_name = bank[1]
        
        # Get account IDs for this bank
        cursor.execute("SELECT id FROM accounts WHERE bank_id = ?", (bank_id,))
        account_ids = [row[0] for row in cursor.fetchall()]
        
        # Delete transactions for all accounts of this bank
        if account_ids:
            placeholders = ','.join('?' * len(account_ids))
            cursor.execute(f"DELETE FROM transactions WHERE account_id IN ({placeholders})", account_ids)
            transactions_deleted = cursor.rowcount
        else:
            transactions_deleted = 0
        
        # Delete accounts for this bank
        cursor.execute("DELETE FROM accounts WHERE bank_id = ?", (bank_id,))
        accounts_deleted = cursor.rowcount
        
        # Delete the bank
        cursor.execute("DELETE FROM banks WHERE id = ?", (bank_id,))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True, 
            "message": f"Bank '{bank_name}' deleted successfully",
            "deleted": {
                "bank": bank_name,
                "accounts": accounts_deleted,
                "transactions": transactions_deleted
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete bank: {str(e)}")

@app.delete("/accounts/{account_id}")
async def delete_account(account_id: int):
    """Delete an account and all its transactions"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Check if account exists
        cursor.execute("SELECT id, name, bank_id FROM accounts WHERE id = ?", (account_id,))
        account = cursor.fetchone()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        account_name = account[1]
        bank_id = account[2]
        
        # Delete transactions for this account
        cursor.execute("DELETE FROM transactions WHERE account_id = ?", (account_id,))
        transactions_deleted = cursor.rowcount
        
        # Delete the account
        cursor.execute("DELETE FROM accounts WHERE id = ?", (account_id,))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"Account '{account_name}' deleted successfully", 
            "deleted": {
                "account": account_name,
                "transactions": transactions_deleted
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")

@app.put("/transactions/{transaction_id}/category")
async def update_transaction_category(transaction_id: int, request: dict):
    """Update the category of a specific transaction"""
    try:
        category = request.get('category')
        if not category:
            raise HTTPException(status_code=400, detail="Category is required")
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Check if transaction exists
        cursor.execute("SELECT id FROM transactions WHERE id = ?", (transaction_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Update category
        cursor.execute(
            "UPDATE transactions SET category = ? WHERE id = ?",
            (category, transaction_id)
        )
        
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Transaction category updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update category: {str(e)}")

@app.delete("/data/all")
async def delete_all_data():
    """Delete all data (banks, accounts, transactions) - DANGEROUS OPERATION"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Count existing data
        cursor.execute("SELECT COUNT(*) FROM transactions")
        transactions_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM accounts")
        accounts_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM banks")
        banks_count = cursor.fetchone()[0]
        
        # Delete all data
        cursor.execute("DELETE FROM transactions")
        cursor.execute("DELETE FROM accounts")
        cursor.execute("DELETE FROM banks")
        
        # Reset auto-increment counters
        cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('banks', 'accounts', 'transactions')")
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "All data deleted successfully",
            "deleted": {
                "banks": banks_count,
                "accounts": accounts_count,
                "transactions": transactions_count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete all data: {str(e)}")

@app.get("/backups/{backup_filename}/inspect")
async def inspect_backup(backup_filename: str):
    """Inspect the contents of a backup file without restoring it"""
    try:
        backup_path = f"./backups/{backup_filename}"
        
        # Check if backup file exists
        if not Path(backup_path).exists():
            raise HTTPException(status_code=404, detail="Backup file not found")
        
        # Read and parse backup file
        with open(backup_path, 'r') as f:
            backup_data = json.load(f)
        
        # Extract bank information
        banks_info = []
        
        # Handle single bank backup format
        if 'bank' in backup_data and 'accounts' in backup_data:
            bank_data = backup_data['bank']
            banks_info.append({
                'id': bank_data['id'],
                'name': bank_data['name'],
                'created_at': bank_data.get('created_at'),
                'accounts_count': len(backup_data['accounts']),
                'transactions_count': len(backup_data['transactions']),
                'accounts': [
                    {
                        'id': acc['id'],
                        'name': acc['name'],
                        'account_type': acc['account_type'],
                        'balance': acc['balance'],
                        'transaction_count': acc.get('transaction_count', 0)
                    }
                    for acc in backup_data['accounts']
                ]
            })
        
        # Handle multiple banks backup format (if we add this later)
        elif 'banks' in backup_data:
            for bank_data in backup_data['banks']:
                banks_info.append({
                    'id': bank_data['id'],
                    'name': bank_data['name'],
                    'created_at': bank_data.get('created_at'),
                    'accounts_count': len(bank_data.get('accounts', [])),
                    'transactions_count': len(bank_data.get('transactions', [])),
                    'accounts': [
                        {
                            'id': acc['id'],
                            'name': acc['name'],
                            'account_type': acc['account_type'],
                            'balance': acc['balance'],
                            'transaction_count': acc.get('transaction_count', 0)
                        }
                        for acc in bank_data.get('accounts', [])
                    ]
                })
        
        return {
            "success": True,
            "backup_info": backup_data.get('backup_info', {}),
            "banks": banks_info,
            "total_banks": len(banks_info),
            "total_accounts": sum(bank['accounts_count'] for bank in banks_info),
            "total_transactions": sum(bank['transactions_count'] for bank in banks_info)
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid backup file format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to inspect backup: {str(e)}")

@app.post("/restore/selective")
async def restore_selective(request: dict):
    """Restore specific banks from a backup file"""
    try:
        backup_file = request.get('backup_file')
        selected_bank_id = request.get('bank_id')  # Original bank ID from backup
        new_bank_name = request.get('new_bank_name')
        
        if not backup_file:
            raise HTTPException(status_code=400, detail="Backup file is required")
        
        backup_path = f"./backups/{backup_file}"
        
        # If no specific bank selected, restore all (existing behavior)
        if not selected_bank_id:
            result = backup_manager.restore_bank(backup_path, new_bank_name)
            return {
                "success": True,
                "message": f"All banks restored successfully",
                "details": result
            }
        
        # Use selective restore method
        result = backup_manager.restore_selective_bank(backup_path, selected_bank_id, new_bank_name)
        return {
            "success": True,
            "message": f"Bank '{result['bank_name']}' restored successfully",
            "details": result
        }
            
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Selective restore failed: {str(e)}")

# Investment Portfolio Management Endpoints

@app.post("/investment-accounts")
async def create_investment_account(account: InvestmentAccountModel):
    """Create a new investment account"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Special handling for credit card accounts
        if account.account_type == "credit":
            print(f"Creating credit card investment account: {account.name}")
            # For credit cards, we might want to set custodian to the credit card issuer
            if not account.custodian:
                account.custodian = "Credit Card Issuer"
        
        cursor.execute("""
            INSERT INTO investment_accounts (name, account_type, custodian, account_number)
            VALUES (?, ?, ?, ?)
        """, (account.name, account.account_type, account.custodian, account.account_number))
        
        account_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Return account info with additional metadata for credit cards
        response = {
            "success": True,
            "message": "Investment account created successfully",
            "account_id": account_id,
            "account_type": account.account_type
        }
        
        if account.account_type == "credit":
            response["is_credit_card"] = True
            response["message"] = "Credit card investment account created successfully. You can now import credit card statements."
            response["credit_card_tips"] = [
                "Credit card accounts in investment portfolio can track credit card investments",
                "Use this for credit cards that offer investment features",
                "Import credit card statements to track spending and payments"
            ]
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create investment account: {str(e)}")

@app.get("/investment-accounts")
async def get_investment_accounts():
    """Get all investment accounts"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, account_type, custodian, account_number, created_at
            FROM investment_accounts
            ORDER BY created_at DESC
        """)
        
        accounts = []
        for row in cursor.fetchall():
            accounts.append({
                "id": row[0],
                "name": row[1],
                "account_type": row[2],
                "custodian": row[3],
                "account_number": row[4],
                "created_at": row[5]
            })
        
        conn.close()
        return accounts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch investment accounts: {str(e)}")

@app.post("/portfolio-statements/{account_id}")
async def import_portfolio_statement(
    account_id: int,
    statement: str = Form(...),
    file: UploadFile = File(...)
):
    """Import a portfolio statement with securities data"""
    try:
        # Parse the statement JSON string
        import json
        statement_data = json.loads(statement)
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Check if this is a credit card account
        cursor.execute("SELECT account_type FROM investment_accounts WHERE id = ?", (account_id,))
        account_result = cursor.fetchone()
        
        if account_result and account_result[0] == "credit":
            # This is a credit card account - use credit card parsing instead
            raise HTTPException(status_code=400, detail="Credit card accounts should use the credit card statement endpoints")
            conn.close()
            
            # Use the credit card parser
            from credit_card_parser import CreditCardParser
            
            # Save the uploaded file temporarily
            temp_file_path = f"./data/temp_credit_card_{file.filename}"
            os.makedirs("./data", exist_ok=True)
            
            with open(temp_file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            try:
                parser = CreditCardParser()
                parsed_data = parser.parse_statement(temp_file_path)
                
                if "error" in parsed_data:
                    raise HTTPException(status_code=400, detail=parsed_data["error"])
                
                # Format for import
                import_data = parser.format_for_import(parsed_data)
                
                # Clean up temp file
                os.remove(temp_file_path)
                
                return {
                    "success": True,
                    "message": "Credit card statement parsed successfully",
                    "parsed_data": import_data,
                    "note": "This is a credit card account. Use the parsed data to import transactions.",
                    "account_type": "credit_card"
                }
                
            except Exception as e:
                # Clean up temp file on error
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                raise HTTPException(status_code=500, detail=f"Error parsing credit card statement: {str(e)}")
        
        # Regular investment account processing
        # Save the uploaded file
        file_path = f"./data/portfolio_statement_{account_id}_{statement_data.get('statement_date', 'unknown')}.pdf"
        os.makedirs("./data", exist_ok=True)
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Insert portfolio statement
        cursor.execute("""
            INSERT INTO portfolio_statements (
                investment_account_id, statement_date, opening_balance, period_gain_loss,
                ending_balance, total_market_value, total_cost_basis,
                total_unrealized_gain_loss, statement_file_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            account_id,
            statement_data.get('statement_date'),
            statement_data.get('opening_balance', 0.0),
            statement_data.get('period_gain_loss', 0.0),
            statement_data.get('ending_balance', 0.0),
            statement_data.get('total_market_value', 0.0),
            statement_data.get('total_cost_basis', 0.0),
            statement_data.get('total_unrealized_gain_loss', 0.0),
            file_path
        ))
        
        statement_id = cursor.lastrowid
        
        # Insert securities data
        securities = statement_data.get('securities', [])
        for security in securities:
            cursor.execute("""
                INSERT INTO securities (
                    investment_account_id, symbol, name, security_type, quantity,
                    share_price, total_cost, market_value, unrealized_gain_loss, statement_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                account_id,
                security.get('symbol', ''),
                security.get('name', ''),
                security.get('security_type', 'Unknown'),
                security.get('quantity', 0.0),
                security.get('share_price', 0.0),
                security.get('total_cost', 0.0),
                security.get('market_value', 0.0),
                security.get('unrealized_gain_loss', 0.0),
                statement_data.get('statement_date')
            ))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "Portfolio statement imported successfully",
            "statement_id": statement_id,
            "securities_count": len(securities),
            "account_type": "investment"
        }
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON in statement parameter: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import portfolio statement: {str(e)}")

@app.get("/portfolio-statements/{account_id}")
async def get_portfolio_statements(account_id: int):
    """Get portfolio statements for an investment account"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, statement_date, opening_balance, period_gain_loss, ending_balance,
                   total_market_value, total_cost_basis, total_unrealized_gain_loss,
                   statement_file_path, created_at
            FROM portfolio_statements
            WHERE investment_account_id = ?
            ORDER BY statement_date DESC
        """, (account_id,))
        
        statements = []
        for row in cursor.fetchall():
            statements.append({
                "id": row[0],
                "statement_date": row[1],
                "opening_balance": row[2],
                "period_gain_loss": row[3],
                "ending_balance": row[4],
                "total_market_value": row[5],
                "total_cost_basis": row[6],
                "total_unrealized_gain_loss": row[7],
                "statement_file_path": row[8],
                "created_at": row[9]
            })
        
        conn.close()
        return statements
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch portfolio statements: {str(e)}")

@app.get("/securities/{account_id}")
async def get_securities(account_id: int, statement_date: Optional[str] = None):
    """Get securities for an investment account, optionally filtered by statement date"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        if statement_date:
            cursor.execute("""
                SELECT id, symbol, name, security_type, quantity, share_price,
                       total_cost, market_value, unrealized_gain_loss, statement_date
                FROM securities
                WHERE investment_account_id = ? AND statement_date = ?
                ORDER BY symbol
            """, (account_id, statement_date))
        else:
            # Get latest securities for each symbol
            cursor.execute("""
                SELECT s1.id, s1.symbol, s1.name, s1.security_type, s1.quantity,
                       s1.share_price, s1.total_cost, s1.market_value,
                       s1.unrealized_gain_loss, s1.statement_date
                FROM securities s1
                INNER JOIN (
                    SELECT symbol, MAX(statement_date) as max_date
                    FROM securities
                    WHERE investment_account_id = ?
                    GROUP BY symbol
                ) s2 ON s1.symbol = s2.symbol AND s1.statement_date = s2.max_date
                WHERE s1.investment_account_id = ?
                ORDER BY s1.symbol
            """, (account_id, account_id))
        
        securities = []
        for row in cursor.fetchall():
            securities.append({
                "id": row[0],
                "symbol": row[1],
                "name": row[2],
                "security_type": row[3],
                "quantity": row[4],
                "share_price": row[5],
                "total_cost": row[6],
                "market_value": row[7],
                "unrealized_gain_loss": row[8],
                "statement_date": row[9]
            })
        
        conn.close()
        return securities
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch securities: {str(e)}")

@app.get("/portfolio-summary/{account_id}")
async def get_portfolio_summary(account_id: int):
    """Get a summary of the investment portfolio"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get latest statement
        cursor.execute("""
            SELECT statement_date, opening_balance, period_gain_loss, ending_balance,
                   total_market_value, total_cost_basis, total_unrealized_gain_loss
            FROM portfolio_statements
            WHERE investment_account_id = ?
            ORDER BY statement_date DESC
            LIMIT 1
        """, (account_id,))
        
        statement = cursor.fetchone()
        if not statement:
            raise HTTPException(status_code=404, detail="No portfolio statements found")
        
        # Get current securities
        cursor.execute("""
            SELECT symbol, name, security_type, quantity, share_price,
                   total_cost, market_value, unrealized_gain_loss
            FROM securities
            WHERE investment_account_id = ? AND statement_date = ?
            ORDER BY market_value DESC
        """, (account_id, statement[0]))
        
        securities = []
        for row in cursor.fetchall():
            securities.append({
                "symbol": row[0],
                "name": row[1],
                "security_type": row[2],
                "quantity": row[3],
                "share_price": row[4],
                "total_cost": row[5],
                "market_value": row[6],
                "unrealized_gain_loss": row[7]
            })
        
        conn.close()
        
        return {
            "statement_date": statement[0],
            "opening_balance": statement[1],
            "period_gain_loss": statement[2],
            "ending_balance": statement[3],
            "total_market_value": statement[4],
            "total_cost_basis": statement[5],
            "total_unrealized_gain_loss": statement[6],
            "securities": securities,
            "securities_count": len(securities)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch portfolio summary: {str(e)}")

@app.get("/portfolio-summary/{account_id}/by-date")
async def get_portfolio_summary_by_date(account_id: int, statement_date: str):
    """Get a summary of the investment portfolio for a specific statement date"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get specific statement by date
        cursor.execute("""
            SELECT statement_date, opening_balance, period_gain_loss, ending_balance,
                   total_market_value, total_cost_basis, total_unrealized_gain_loss
            FROM portfolio_statements
            WHERE investment_account_id = ? AND statement_date = ?
            ORDER BY statement_date DESC
            LIMIT 1
        """, (account_id, statement_date))
        
        statement = cursor.fetchone()
        if not statement:
            raise HTTPException(status_code=404, detail=f"No portfolio statement found for date: {statement_date}")
        
        # Get securities for the selected statement date
        cursor.execute("""
            SELECT symbol, name, security_type, quantity, share_price,
                   total_cost, market_value, unrealized_gain_loss
            FROM securities
            WHERE investment_account_id = ? AND statement_date = ?
            ORDER BY market_value DESC
        """, (account_id, statement[0]))
        
        securities = []
        for row in cursor.fetchall():
            securities.append({
                "symbol": row[0],
                "name": row[1],
                "security_type": row[2],
                "quantity": row[3],
                "share_price": row[4],
                "total_cost": row[5],
                "market_value": row[6],
                "unrealized_gain_loss": row[7]
            })
        
        conn.close()
        
        return {
            "statement_date": statement[0],
            "opening_balance": statement[1],
            "period_gain_loss": statement[2],
            "ending_balance": statement[3],
            "total_market_value": statement[4],
            "total_cost_basis": statement[5],
            "total_unrealized_gain_loss": statement[6],
            "securities": securities,
            "securities_count": len(securities)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch portfolio summary: {str(e)}")

# Import the configurable statement parser
from statement_parser import StatementParser

# Initialize the statement parser
statement_parser = StatementParser()

def parse_pdf_statement(pdf_file):
    """Parse PDF investment statement using configurable patterns"""
    try:
        return statement_parser.parse_statement(pdf_file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF parsing failed: {str(e)}")

@app.post("/parse-pdf-statement")
async def parse_pdf_statement_endpoint(file: UploadFile = File(...)):
    """Parse a PDF investment statement to extract portfolio data"""
    try:
        # Save uploaded file temporarily
        temp_file_path = f"./data/temp_{file.filename}"
        os.makedirs("./data", exist_ok=True)
        
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Parse PDF using the updated function
        portfolio_data = parse_pdf_statement(temp_file_path)
        
        # Clean up temp file
        os.remove(temp_file_path)
        
        return {
            "success": True,
            "parsed_data": portfolio_data,
            "message": f"Successfully parsed {len(portfolio_data['securities'])} securities from PDF"
        }
        
    except Exception as e:
        # Clean up temp file if it exists
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF statement: {str(e)}")

# Credit Card Management Endpoints

@app.post("/credit-accounts")
async def create_credit_account(account: CreditAccountModel):
    """Create a new credit card account"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO credit_accounts (name, account_type, provider, account_number)
            VALUES (?, ?, ?, ?)
        """, (account.name, account.account_type, account.provider, account.account_number))
        
        account_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "Credit card account created successfully",
            "account_id": account_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create credit card account: {str(e)}")

@app.get("/credit-accounts")
async def get_credit_accounts():
    """Get all credit card accounts"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, account_type, provider, account_number, created_at
            FROM credit_accounts
            ORDER BY created_at DESC
        """)
        
        accounts = []
        for row in cursor.fetchall():
            accounts.append({
                "id": row[0],
                "name": row[1],
                "account_type": row[2],
                "provider": row[3],
                "account_number": row[4],
                "created_at": row[5]
            })
        
        conn.close()
        return accounts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch credit card accounts: {str(e)}")

@app.post("/credit-statements/{account_id}")
async def import_credit_statement(account_id: int, statement: CreditStatementModel):
    """Import a credit card statement"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO credit_statements (credit_account_id, statement_date, payment_due_date, 
                                        new_balance, minimum_payment_due)
            VALUES (?, ?, ?, ?, ?)
        """, (account_id, statement.statement_date, statement.payment_due_date, 
              statement.new_balance, statement.minimum_payment_due))
        
        statement_id = cursor.lastrowid
        
        # Save transactions if they exist
        if statement.transactions:
            for transaction in statement.transactions:
                cursor.execute("""
                    INSERT INTO credit_transactions (credit_statement_id, transaction_date, 
                                                  description, amount, category)
                    VALUES (?, ?, ?, ?, ?)
                """, (statement_id, transaction.transaction_date, transaction.description, 
                      transaction.amount, transaction.category))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "Credit card statement imported successfully",
            "statement_id": statement_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import credit card statement: {str(e)}")

@app.get("/credit-statements/{account_id}")
async def get_credit_statements(account_id: int):
    """Get credit card statements for an account"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, statement_date, payment_due_date, new_balance, minimum_payment_due,
                   statement_file_path, created_at
            FROM credit_statements
            WHERE credit_account_id = ?
            ORDER BY statement_date DESC
        """, (account_id,))
        
        statements = []
        for row in cursor.fetchall():
            statement_id = row[0]
            
            # Get transactions for this statement
            cursor.execute("""
                SELECT transaction_date, description, amount, category
                FROM credit_transactions
                WHERE credit_statement_id = ?
                ORDER BY transaction_date
            """, (statement_id,))
            
            transactions = []
            for trans_row in cursor.fetchall():
                transactions.append({
                    "transaction_date": trans_row[0],
                    "description": trans_row[1],
                    "amount": trans_row[2],
                    "category": trans_row[3]
                })
            
            statements.append({
                "id": statement_id,
                "statement_date": row[1],
                "payment_due_date": row[2],
                "new_balance": row[3],
                "minimum_payment_due": row[4],
                "statement_file_path": row[5],
                "created_at": row[6],
                "transactions": transactions
            })
        
        conn.close()
        return {
            "success": True,
            "statements": statements
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch credit card statements: {str(e)}")

# Statement Format Management Endpoints

@app.get("/statement-formats")
async def get_available_statement_formats():
    """Get list of available statement formats for parsing"""
    try:
        formats = statement_parser.get_available_formats()
        format_details = {}
        
        for format_key in formats:
            format_info = statement_parser.get_format_info(format_key)
            format_details[format_key] = {
                "name": format_info.get("name", format_key),
                "type": format_info.get("type", "unknown"),
                "description": f"Parser for {format_info.get('name', format_key)} statements"
            }
        
        return {
            "success": True,
            "formats": format_details,
            "total_formats": len(formats)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statement formats: {str(e)}")

@app.get("/statement-formats/{format_key}")
async def get_statement_format_details(format_key: str):
    """Get detailed information about a specific statement format"""
    try:
        format_info = statement_parser.get_format_info(format_key)
        if not format_info:
            raise HTTPException(status_code=404, detail=f"Statement format '{format_key}' not found")
        
        return {
            "success": True,
            "format": format_info
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get format details: {str(e)}")

@app.post("/statement-formats")
async def add_custom_statement_format(format_key: str = Form(...), format_config: str = Form(...)):
    """Add a custom statement format for parsing"""
    try:
        import json
        config = json.loads(format_config)
        
        # Validate the format configuration
        required_fields = ["name", "type", "patterns"]
        for field in required_fields:
            if field not in config:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Add the custom format
        statement_parser.add_custom_format(format_key, config)
        
        return {
            "success": True,
            "message": f"Custom format '{format_key}' added successfully",
            "format": config
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format configuration")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add custom format: {str(e)}")

@app.post("/parse-pdf-statement/{format_key}")
async def parse_pdf_statement_with_format(format_key: str, file: UploadFile = File(...)):
    """Parse a PDF statement using a specific format"""
    try:
        # Save uploaded file temporarily
        temp_file_path = f"./data/temp_{file.filename}"
        os.makedirs("./data", exist_ok=True)
        
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Parse PDF using specified format
        portfolio_data = statement_parser.parse_statement(temp_file_path, format_key)
        
        # Clean up temp file
        os.remove(temp_file_path)
        
        return {
            "success": True,
            "parsed_data": portfolio_data,
            "format_used": format_key,
            "message": f"Successfully parsed statement using {format_key} format"
        }
        
    except Exception as e:
        # Clean up temp file if it exists
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF statement: {str(e)}")