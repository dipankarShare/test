import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardSubtitle,
  Title, 
  Text, 
  Button, 
  Grid, 
  Flex,
  Badge,
  FadeIn,
  Input
} from './ui';
import { theme } from '../theme';
import styled from 'styled-components';

const BackupCard = styled(Card)`
  border: 1px solid ${theme.colors.light.border};
  transition: all ${theme.transitions.normal};
  
  &:hover {
    border-color: ${theme.colors.primary[500]};
    box-shadow: ${theme.shadows.md};
  }
`;

const ActionButton = styled(Button)`
  margin-right: ${theme.spacing[2]};
  margin-bottom: ${theme.spacing[2]};
`;

function BackupManager({ banks, onRefresh }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [customBankName, setCustomBankName] = useState('');
  const [restoreBankName, setRestoreBankName] = useState('');
  const [selectedBackupFile, setSelectedBackupFile] = useState('');
  const [backupContents, setBackupContents] = useState(null);
  const [selectedBankToRestore, setSelectedBankToRestore] = useState('');
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/backups');
      const data = await response.json();
      if (data.success) {
        setBackups(data.backups);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
  };

  const createBackup = async () => {
    if (!selectedBank) {
      alert('Please select a bank to backup');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/backup/bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bank_id: parseInt(selectedBank),
          bank_name: customBankName || null
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Backup created successfully!');
        fetchBackups();
        setSelectedBank('');
        setCustomBankName('');
      } else {
        alert('Backup failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error creating backup');
    } finally {
      setLoading(false);
    }
  };

  const inspectBackup = async (backupFilename) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/backups/${backupFilename}/inspect`);
      if (response.ok) {
        const result = await response.json();
        setBackupContents(result);
        setSelectedBackupFile(backupFilename);
        setShowRestoreDialog(true);
      } else {
        const error = await response.json();
        alert(`Error inspecting backup: ${error.detail}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const restoreBackup = async (backupFile, bankId = null) => {
    const confirmMessage = bankId 
      ? 'Are you sure you want to restore the selected bank from this backup?'
      : 'Are you sure you want to restore ALL banks from this backup?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const endpoint = bankId ? 'http://127.0.0.1:8000/restore/selective' : 'http://127.0.0.1:8000/restore/bank';
      const body = bankId ? {
        backup_file: selectedBackupFile,
        bank_id: parseInt(bankId),
        new_bank_name: restoreBankName || null
      } : {
        backup_file: backupFile,
        new_bank_name: restoreBankName || null
      };

      console.log('Restore request:', { endpoint, body });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('Restore response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Restore response data:', data);
        
        if (data.success) {
          alert(`Restore successful! ${data.message}`);
          onRefresh();
          setRestoreBankName('');
          setShowRestoreDialog(false);
          setBackupContents(null);
          setSelectedBankToRestore('');
        } else {
          alert('Restore failed: ' + (data.message || 'Unknown error'));
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Restore error response:', errorData);
        alert('Restore failed: ' + (errorData.detail || errorData.message || 'Server error'));
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Error restoring backup: ' + (error.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (backupFilename) => {
    if (!window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/backups/${backupFilename}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert('Backup deleted successfully!');
        fetchBackups();
      } else {
        alert('Delete failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      alert('Error deleting backup');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <FadeIn>
      <Title>Backup Manager</Title>
      <Text variant="muted" size="lg" style={{ marginBottom: theme.spacing[8] }}>
        Create and restore backups of your financial data by bank
      </Text>

      {/* Create Backup Section */}
      <Card style={{ marginBottom: theme.spacing[8] }}>
        <CardHeader>
          <CardTitle>Create Backup</CardTitle>
          <CardSubtitle>Backup all data for a specific bank</CardSubtitle>
        </CardHeader>

        <Grid columns="1fr 1fr" gap={4} style={{ marginBottom: theme.spacing[4] }}>
          <div>
            <Text weight="medium" style={{ marginBottom: theme.spacing[2] }}>Select Bank</Text>
            <select 
              value={selectedBank} 
              onChange={(e) => setSelectedBank(e.target.value)}
              style={{
                width: '100%',
                padding: theme.spacing[3],
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.light.border}`,
                backgroundColor: theme.colors.light.surface,
                color: theme.colors.light.text.primary
              }}
            >
              <option value="">Choose a bank...</option>
              {banks.map(bank => (
                <option key={bank.id} value={bank.id}>
                  {bank.name} ({bank.account_count} accounts)
                </option>
              ))}
            </select>
          </div>

          <div>
            <Text weight="medium" style={{ marginBottom: theme.spacing[2] }}>Custom Backup Name (Optional)</Text>
            <Input
              type="text"
              placeholder="Leave empty to use bank name"
              value={customBankName}
              onChange={(e) => setCustomBankName(e.target.value)}
            />
          </div>
        </Grid>

        <ActionButton 
          onClick={createBackup} 
          disabled={loading || !selectedBank}
          variant="primary"
        >
          {loading ? 'Creating Backup...' : 'Create Backup'}
        </ActionButton>
      </Card>

      {/* Restore Options */}
      <Card style={{ marginBottom: theme.spacing[8] }}>
        <CardHeader>
          <CardTitle>Restore Options</CardTitle>
          <CardSubtitle>Optional: Specify a new name for restored bank</CardSubtitle>
        </CardHeader>

        <Input
          type="text"
          placeholder="New bank name (leave empty to use original name)"
          value={restoreBankName}
          onChange={(e) => setRestoreBankName(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </Card>

      {/* Existing Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Available Backups</CardTitle>
          <CardSubtitle>
            {backups.length} backup{backups.length !== 1 ? 's' : ''} available
          </CardSubtitle>
        </CardHeader>

        {backups.length === 0 ? (
          <Text variant="muted" style={{ textAlign: 'center', padding: theme.spacing[8] }}>
            No backups found. Create your first backup above.
          </Text>
        ) : (
          <Grid columns="1fr" gap={4}>
            {backups.map((backup, index) => (
              <FadeIn key={backup.filename} style={{ animationDelay: `${index * 100}ms` }}>
                <BackupCard>
                  <Flex align="center" justify="space-between">
                    <div>
                      <Text weight="semibold" noMargin>{backup.bank_name}</Text>
                      <Text variant="muted" size="sm" noMargin style={{ marginTop: theme.spacing[1] }}>
                        Created: {formatDate(backup.created_at)}
                      </Text>
                      <Flex gap={2} style={{ marginTop: theme.spacing[2] }}>
                        <Badge variant="info">{backup.accounts_count} accounts</Badge>
                        <Badge variant="success">{backup.transactions_count} transactions</Badge>
                      </Flex>
                    </div>
                    
                    <Flex direction="column" gap={2}>
                      <Button
                        onClick={() => inspectBackup(backup.filename)}
                        disabled={loading}
                        variant="primary"
                        size="sm"
                      >
                        Restore Options
                      </Button>
                      <Button
                        onClick={() => restoreBackup(backup.filename)}
                        disabled={loading}
                        variant="secondary"
                        size="sm"
                      >
                        Quick Restore
                      </Button>
                      <Button
                        onClick={() => deleteBackup(backup.filename)}
                        disabled={loading}
                        variant="error"
                        size="sm"
                      >
                        Delete
                      </Button>
                    </Flex>
                  </Flex>
                </BackupCard>
              </FadeIn>
            ))}
          </Grid>
        )}
      </Card>

      {/* Restore Dialog */}
      {showRestoreDialog && backupContents && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card style={{ 
            maxWidth: '600px', 
            margin: theme.spacing[4],
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <CardHeader>
              <CardTitle>Restore Options</CardTitle>
              <CardSubtitle>
                Choose what to restore from backup: {selectedBackupFile}
              </CardSubtitle>
            </CardHeader>

            <div style={{ marginBottom: theme.spacing[6] }}>
              <Text weight="medium" style={{ marginBottom: theme.spacing[3] }}>
                Backup Contents:
              </Text>
              <div style={{ 
                padding: theme.spacing[4], 
                backgroundColor: theme.colors.light.elevated,
                borderRadius: theme.borderRadius.md,
                marginBottom: theme.spacing[4]
              }}>
                <Text size="sm" noMargin>
                  📊 {backupContents.total_banks} bank(s) • {backupContents.total_accounts} account(s) • {backupContents.total_transactions} transaction(s)
                </Text>
              </div>

              {backupContents.banks.map((bank, index) => (
                <div key={bank.id} style={{
                  border: `1px solid ${theme.colors.light.border}`,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing[4],
                  marginBottom: theme.spacing[3]
                }}>
                  <Flex align="center" justify="space-between">
                    <div>
                      <Text weight="semibold" noMargin>{bank.name}</Text>
                      <Text variant="muted" size="sm" noMargin style={{ marginTop: theme.spacing[1] }}>
                        {bank.accounts_count} accounts • {bank.transactions_count} transactions
                      </Text>
                      <div style={{ marginTop: theme.spacing[2] }}>
                        {bank.accounts.map(account => (
                          <Badge key={account.id} variant="neutral" size="sm" style={{ marginRight: theme.spacing[2] }}>
                            {account.name} (${account.balance.toFixed(2)})
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => restoreBackup(null, bank.id)}
                      disabled={loading}
                      variant="primary"
                      size="sm"
                    >
                      Restore This Bank
                    </Button>
                  </Flex>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: theme.spacing[6] }}>
              <Text weight="medium" style={{ marginBottom: theme.spacing[2] }}>
                New Bank Name (Optional):
              </Text>
              <Input
                type="text"
                placeholder="Leave empty to use original name"
                value={restoreBankName}
                onChange={(e) => setRestoreBankName(e.target.value)}
              />
            </div>

            <Flex justify="space-between" gap={3}>
              <Button
                onClick={() => restoreBackup(selectedBackupFile)}
                disabled={loading}
                variant="success"
              >
                {loading ? 'Restoring...' : 'Restore All Banks'}
              </Button>
              <Button
                onClick={() => {
                  setShowRestoreDialog(false);
                  setBackupContents(null);
                  setSelectedBankToRestore('');
                }}
                disabled={loading}
                variant="secondary"
              >
                Cancel
              </Button>
            </Flex>
          </Card>
        </div>
      )}
    </FadeIn>
  );
}

export default BackupManager;