#!/usr/bin/env python3
"""
Simple script to clean all credit card data
"""

import sqlite3

def clean_credit_data():
    """Remove all credit card related data"""
    
    db_path = "data/finance.db"
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🧹 Cleaning credit card data...")
        
        # Check what tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [t[0] for t in cursor.fetchall()]
        print(f"Tables found: {tables}")
        
        # Delete credit card transactions first
        if 'credit_transactions' in tables:
            cursor.execute("DELETE FROM credit_transactions")
            print("✅ Deleted all credit transactions")
        
        # Delete credit card statements
        if 'credit_statements' in tables:
            cursor.execute("DELETE FROM credit_statements")
            print("✅ Deleted all credit statements")
        
        # Delete credit card accounts
        if 'credit_accounts' in tables:
            cursor.execute("DELETE FROM credit_accounts")
            print("✅ Deleted all credit accounts")
        
        # Delete credit accounts from main accounts table
        cursor.execute("DELETE FROM accounts WHERE account_type = 'credit'")
        print("✅ Deleted credit accounts from main accounts table")
        
        # Commit changes
        conn.commit()
        print("✅ Database cleaned successfully!")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    clean_credit_data()
