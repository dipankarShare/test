import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path

class BackupManager:
    def __init__(self, db_path="./data/finance.db", backup_dir="./backups"):
        self.db_path = db_path
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)
    
    def backup_bank(self, bank_id, bank_name=None):
        """Backup all data for a specific bank"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            # Get bank info with calculated counts
            cursor.execute("""
                SELECT b.id, b.name, b.created_at,
                       COUNT(a.id) as account_count,
                       COALESCE(SUM(a.balance), 0) as total_balance
                FROM banks b 
                LEFT JOIN accounts a ON b.id = a.bank_id 
                WHERE b.id = ?
                GROUP BY b.id, b.name, b.created_at
            """, (bank_id,))
            bank_row = cursor.fetchone()
            if not bank_row:
                raise ValueError(f"Bank with ID {bank_id} not found")
            
            bank_data = dict(bank_row)
            backup_name = bank_name or bank_data['name']
            
            # Get accounts for this bank
            cursor.execute("SELECT * FROM accounts WHERE bank_id = ?", (bank_id,))
            accounts = [dict(row) for row in cursor.fetchall()]
            
            # Get transactions for all accounts of this bank
            account_ids = [acc['id'] for acc in accounts]
            transactions = []
            if account_ids:
                placeholders = ','.join('?' * len(account_ids))
                cursor.execute(f"SELECT * FROM transactions WHERE account_id IN ({placeholders})", account_ids)
                transactions = [dict(row) for row in cursor.fetchall()]
            
            # Create backup data structure
            backup_data = {
                'backup_info': {
                    'created_at': datetime.now().isoformat(),
                    'bank_name': backup_name,
                    'original_bank_id': bank_id,
                    'accounts_count': len(accounts),
                    'transactions_count': len(transactions)
                },
                'bank': bank_data,
                'accounts': accounts,
                'transactions': transactions
            }
            
            # Save backup file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{backup_name.replace(' ', '_')}_{timestamp}.json"
            backup_path = self.backup_dir / filename
            
            with open(backup_path, 'w') as f:
                json.dump(backup_data, f, indent=2, default=str)
            
            return str(backup_path)
            
        finally:
            conn.close()
    
    def restore_bank(self, backup_file, new_bank_name=None):
        """Restore bank data from backup file"""
        backup_path = Path(backup_file)
        if not backup_path.exists():
            raise FileNotFoundError(f"Backup file not found: {backup_file}")
        
        with open(backup_path, 'r') as f:
            backup_data = json.load(f)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Start transaction
            conn.execute("BEGIN")
            
            # Insert bank (with new name if provided)
            bank_data = backup_data['bank'].copy()
            if new_bank_name:
                bank_data['name'] = new_bank_name
            
            # Remove original ID to get new auto-generated ID
            original_bank_id = bank_data.pop('id', None)
            
            cursor.execute("""
                INSERT INTO banks (name, created_at)
                VALUES (?, ?)
            """, (bank_data['name'], bank_data.get('created_at')))
            
            new_bank_id = cursor.lastrowid
            
            # Create mapping from old account IDs to new ones
            account_id_mapping = {}
            
            # Insert accounts
            for account in backup_data['accounts']:
                original_account_id = account['id']
                cursor.execute("""
                    INSERT INTO accounts (bank_id, name, account_type, balance, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (new_bank_id, account['name'], account['account_type'], 
                      account['balance'], account.get('created_at')))
                
                new_account_id = cursor.lastrowid
                account_id_mapping[original_account_id] = new_account_id
            
            # Insert transactions
            for transaction in backup_data['transactions']:
                old_account_id = transaction['account_id']
                new_account_id = account_id_mapping.get(old_account_id)
                
                if new_account_id:
                    cursor.execute("""
                        INSERT INTO transactions (account_id, date, description, amount, category, note, raw_data)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (new_account_id, transaction['date'], transaction['description'],
                          transaction['amount'], transaction.get('category', 'Uncategorized'), 
                          transaction.get('note'), transaction.get('raw_data')))
            
            # Commit transaction
            conn.commit()
            
            return {
                'success': True,
                'new_bank_id': new_bank_id,
                'bank_name': bank_data['name'],
                'accounts_restored': len(backup_data['accounts']),
                'transactions_restored': len(backup_data['transactions'])
            }
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def list_backups(self):
        """List all available backup files"""
        backups = []
        for backup_file in self.backup_dir.glob("*.json"):
            try:
                with open(backup_file, 'r') as f:
                    backup_data = json.load(f)
                
                backups.append({
                    'filename': backup_file.name,
                    'path': str(backup_file),
                    'bank_name': backup_data['backup_info']['bank_name'],
                    'created_at': backup_data['backup_info']['created_at'],
                    'accounts_count': backup_data['backup_info']['accounts_count'],
                    'transactions_count': backup_data['backup_info']['transactions_count']
                })
            except Exception as e:
                # Skip corrupted backup files
                continue
        
        return sorted(backups, key=lambda x: x['created_at'], reverse=True)
    
    def restore_selective_bank(self, backup_file, bank_id, new_bank_name=None):
        """Restore a specific bank from a backup file"""
        backup_path = Path(backup_file)
        if not backup_path.exists():
            raise FileNotFoundError(f"Backup file not found: {backup_file}")
        
        with open(backup_path, 'r') as f:
            backup_data = json.load(f)
        
        # Check if this is a single bank backup and the ID matches
        if 'bank' in backup_data and backup_data['bank']['id'] == bank_id:
            # Use the regular restore method for single bank backups
            return self.restore_bank(backup_file, new_bank_name)
        
        # For multi-bank backups (future feature), we would filter here
        # For now, just handle single bank backups
        raise ValueError(f"Bank with ID {bank_id} not found in backup file")
    
    def delete_backup(self, backup_file):
        """Delete a backup file"""
        backup_path = Path(backup_file)
        if backup_path.exists():
            backup_path.unlink()
            return True
        return False