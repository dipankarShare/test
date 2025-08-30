#!/usr/bin/env python3
"""
Script to clean all credit card data from the database
"""

import sqlite3
import os

def clean_credit_data():
    """Remove all credit card related data from the database"""
    
    db_path = "../data/finance.db"
    
    if not os.path.exists(db_path):
        print("❌ Database not found at:", db_path)
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Checking current database state...")
        
        # Check what tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"Tables in database: {[t[0] for t in tables]}")
        
        # Check credit card data
        credit_tables = ['credit_accounts', 'credit_statements', 'credit_transactions']
        
        for table in credit_tables:
            if table in [t[0] for t in tables]:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"📊 {table}: {count} records")
            else:
                print(f"📊 {table}: table does not exist")
        
        print("\n🧹 Cleaning credit card data...")
        
        # Delete credit card transactions first (due to foreign key constraints)
        if 'credit_transactions' in [t[0] for t in tables]:
            cursor.execute("DELETE FROM credit_transactions")
            print("✅ Deleted all credit transactions")
        
        # Delete credit card statements
        if 'credit_statements' in [t[0] for t in tables]:
            cursor.execute("DELETE FROM credit_statements")
            print("✅ Deleted all credit statements")
        
        # Delete credit card accounts
        if 'credit_accounts' in [t[0] for t in tables]:
            cursor.execute("DELETE FROM credit_accounts")
            print("✅ Deleted all credit accounts")
        
        # Also check if there are any credit card accounts in the main accounts table
        cursor.execute("SELECT COUNT(*) FROM accounts WHERE account_type = 'credit'")
        credit_count = cursor.fetchone()[0]
        if credit_count > 0:
            cursor.execute("DELETE FROM accounts WHERE account_type = 'credit'")
            print(f"✅ Deleted {credit_count} credit accounts from main accounts table")
        
        # Commit changes
        conn.commit()
        print("\n✅ Database cleaned successfully!")
        
        # Verify cleanup
        print("\n🔍 Verifying cleanup...")
        for table in credit_tables:
            if table in [t[0] for t in tables]:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"📊 {table}: {count} records (should be 0)")
        
        cursor.execute("SELECT COUNT(*) FROM accounts WHERE account_type = 'credit'")
        credit_count = cursor.fetchone()[0]
        print(f"📊 credit accounts in main table: {credit_count} records (should be 0)")
        
        conn.close()
        print("\n🎉 Credit card data cleanup completed!")
        
    except Exception as e:
        print(f"❌ Error cleaning database: {e}")
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    clean_credit_data()
