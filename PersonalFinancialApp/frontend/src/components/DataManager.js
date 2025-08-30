import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  Card,
  CardHeader,
  CardTitle,
  CardSubtitle,
  Title,
  Text,
  Button,
  Flex,
  Badge,
  FadeIn,
} from "./ui";
import { theme } from "../theme";

const DangerCard = styled(Card)`
  border: 2px solid ${theme.colors.error[500]};
  background: ${theme.colors.error[50]};
`;

const WarningCard = styled(Card)`
  border: 2px solid ${theme.colors.warning[500]};
  background: ${theme.colors.warning[50]};
`;

const ActionGrid = styled.div`
  display: grid;
  gap: ${theme.spacing[6]};
  margin-top: ${theme.spacing[6]};
`;

const ConfirmDialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogCard = styled(Card)`
  max-width: 500px;
  margin: ${theme.spacing[4]};
`;

const BankItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing[4]};
  border: 1px solid ${theme.colors.light.border};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing[3]};

  &:hover {
    background: ${theme.colors.light.elevated};
  }
`;

function DataManager() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await fetch("http://localhost:8000/banks", {
        cache: "no-cache", // Prevent browser caching
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      const data = await response.json();
      console.log("Fetched banks:", data); // Debug logging
      setBanks(data);
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  const handleDeleteBank = async (bankId, bankName) => {
    if (loading) {
      console.log("Delete already in progress, ignoring duplicate request");
      return; // Prevent duplicate requests
    }

    setLoading(true);
    try {
      console.log(`Attempting to delete bank ${bankId}: ${bankName}`);
      const response = await fetch(`http://localhost:8000/banks/${bankId}`, {
        method: "DELETE",
      });

      console.log(`Delete response status: ${response.status}`);

      if (response.ok) {
        const result = await response.json();
        console.log("Delete successful:", result);
        alert(
          `Success: ${result.message}\nDeleted: ${result.deleted.accounts} accounts, ${result.deleted.transactions} transactions`
        );

        // Force refresh the bank list
        await fetchBanks();
        console.log("Bank list refreshed after delete");
      } else {
        const error = await response.json();
        console.error("Delete failed:", error);
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      setConfirmDialog(null);
    }
  };

  const handleDeleteAllData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/data/all", {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Success: ${result.message}\nDeleted: ${result.deleted.banks} banks, ${result.deleted.accounts} accounts, ${result.deleted.transactions} transactions`
        );
        fetchBanks(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      setConfirmDialog(null);
    }
  };

  const showConfirmDialog = (type, data) => {
    setConfirmDialog({ type, data });
  };

  const ConfirmDialogComponent = () => {
    if (!confirmDialog) return null;

    const { type, data } = confirmDialog;

    return (
      <ConfirmDialog>
        <DialogCard>
          <CardHeader>
            <CardTitle style={{ color: theme.colors.error[600] }}>
              ⚠️ Confirm Deletion
            </CardTitle>
            <CardSubtitle>
              This action cannot be undone. Please confirm you want to proceed.
            </CardSubtitle>
          </CardHeader>

          {type === "bank" && (
            <div>
              <Text>
                You are about to delete the bank <strong>"{data.name}"</strong>{" "}
                and all its associated data:
              </Text>
              <ul
                style={{
                  margin: `${theme.spacing[4]} 0`,
                  paddingLeft: theme.spacing[6],
                }}
              >
                <li>All accounts in this bank</li>
                <li>All transactions in those accounts</li>
                <li>All category rules and settings</li>
              </ul>
            </div>
          )}

          {type === "all" && (
            <div>
              <Text>
                You are about to delete <strong>ALL DATA</strong> from the
                application:
              </Text>
              <ul
                style={{
                  margin: `${theme.spacing[4]} 0`,
                  paddingLeft: theme.spacing[6],
                }}
              >
                <li>All banks ({banks.length} banks)</li>
                <li>All accounts</li>
                <li>All transactions</li>
                <li>All category rules and settings</li>
              </ul>
              <Text
                style={{ color: theme.colors.error[600], fontWeight: "bold" }}
              >
                This will completely reset the application to its initial state.
              </Text>
            </div>
          )}

          <Flex
            justify="flex-end"
            gap={3}
            style={{ marginTop: theme.spacing[6] }}
          >
            <Button
              variant="secondary"
              onClick={() => setConfirmDialog(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (type === "bank") {
                  handleDeleteBank(data.id, data.name);
                } else if (type === "all") {
                  handleDeleteAllData();
                }
              }}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Permanently"}
            </Button>
          </Flex>
        </DialogCard>
      </ConfirmDialog>
    );
  };

  return (
    <FadeIn>
      <Title>Data Management</Title>
      <Text variant="muted" size="lg">
        Manage your financial data, including deleting banks, accounts, or all
        data
      </Text>

      <ActionGrid>
        {/* Delete Individual Banks */}
        <WarningCard>
          <CardHeader>
            <CardTitle>Delete Banks</CardTitle>
            <CardSubtitle>
              Delete individual banks and all their associated accounts and
              transactions
            </CardSubtitle>
          </CardHeader>

          {banks.length === 0 ? (
            <Text variant="muted">No banks found</Text>
          ) : (
            <div>
              {banks.map((bank) => (
                <BankItem key={bank.id}>
                  <div>
                    <Text weight="medium" noMargin>
                      {bank.name}
                    </Text>
                    <Text variant="muted" size="sm" noMargin>
                      {bank.account_count} accounts • {bank.transaction_count}{" "}
                      transactions
                    </Text>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => showConfirmDialog("bank", bank)}
                    disabled={loading}
                  >
                    Delete Bank
                  </Button>
                </BankItem>
              ))}
            </div>
          )}
        </WarningCard>

        {/* Delete All Data */}
        <DangerCard>
          <CardHeader>
            <CardTitle style={{ color: theme.colors.error[600] }}>
              🚨 Delete All Data
            </CardTitle>
            <CardSubtitle>
              Permanently delete all banks, accounts, transactions, and settings
            </CardSubtitle>
          </CardHeader>

          <Text>
            This will completely reset the application to its initial state. All
            your financial data will be permanently lost.
          </Text>

          <Flex
            justify="space-between"
            align="center"
            style={{ marginTop: theme.spacing[4] }}
          >
            <div>
              <Badge variant="error">DANGER ZONE</Badge>
              <Text
                variant="muted"
                size="sm"
                noMargin
                style={{ marginTop: theme.spacing[2] }}
              >
                This action cannot be undone
              </Text>
            </div>
            <Button
              variant="danger"
              onClick={() => showConfirmDialog("all")}
              disabled={loading || banks.length === 0}
            >
              Delete All Data
            </Button>
          </Flex>
        </DangerCard>

        {/* Backup Recommendation */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Recommendation</CardTitle>
            <CardSubtitle>
              Always create backups before deleting data
            </CardSubtitle>
          </CardHeader>

          <Text>
            Before deleting any data, consider creating a backup using the
            Backup Manager. This allows you to restore your data later if
            needed.
          </Text>

          <Button variant="primary" style={{ marginTop: theme.spacing[4] }}>
            Go to Backup Manager
          </Button>
        </Card>
      </ActionGrid>

      <ConfirmDialogComponent />
    </FadeIn>
  );
}

export default DataManager;
