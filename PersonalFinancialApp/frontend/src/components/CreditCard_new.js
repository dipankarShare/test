import React, { useState, useEffect } from "react";
import {
  Container,
  Header,
  Title,
  Card,
  Form,
  FormGroup,
  Label,
  Input,
  Select,
  Button,
  Alert,
  Table,
  Tabs,
  Tab,
} from "./ui";

const CreditCard = () => {
  const [activeTab, setActiveTab] = useState("accounts");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creditAccounts, setCreditAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [statements, setStatements] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [newAccount, setNewAccount] = useState({
    name: "",
    account_type: "credit",
    provider: "",
    account_number: "",
  });

  const [newStatement, setNewStatement] = useState({
    statement_date: "",
    payment_due_date: "",
    new_balance: "",
    minimum_payment_due: "",
  });

  useEffect(() => {
    fetchCreditAccounts();
  }, []);

  const fetchCreditAccounts = async () => {
    try {
      const response = await fetch("http://localhost:8000/credit-accounts");
      const data = await response.json();
      setCreditAccounts(data);
    } catch (error) {
      console.error("Error fetching credit accounts:", error);
      setMessage({
        type: "error",
        text: "Failed to fetch credit accounts",
      });
    }
  };

  const createCreditAccount = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/credit-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAccount),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: data.message || "Credit card account created successfully",
        });

        setNewAccount({
          name: "",
          account_type: "credit",
          provider: "",
          account_number: "",
        });
        fetchCreditAccounts();
      } else {
        setMessage({
          type: "error",
          text: data.detail || "Failed to create account",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to create credit card account",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (account) => {
    if (!account) {
      setSelectedAccount(null);
      return;
    }
    setSelectedAccount(account);
    fetchStatements(account.id);
  };

  const fetchStatements = async (accountId) => {
    if (!accountId) return;
    try {
      const response = await fetch(
        `http://localhost:8000/credit-statements/${accountId}`
      );
      const data = await response.json();
      if (data.success) {
        setStatements(data.statements || []);
      }
    } catch (error) {
      console.error("Error fetching statements:", error);
    }
  };

  const parsePDFStatement = async () => {
    if (!selectedFile) {
      setMessage({ type: "error", text: "Please select a PDF file first" });
      return;
    }
    if (!selectedAccount) {
      setMessage({ type: "error", text: "Please select an account first" });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      console.log("Sending PDF to parse:", selectedFile.name);
      console.log("Selected account:", selectedAccount);

      const response = await fetch(
        "http://localhost:8000/parse-credit-card-statement",
        {
          method: "POST",
          body: formData,
        }
      );

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Backend response:", data);

      if (data.success) {
        const parsed = data.parsed_data || data;
        console.log("Parsed data:", parsed);

        const updatedStatement = {
          statement_date: parsed.statement_date || "",
          payment_due_date: parsed.payment_due_date || "",
          new_balance: parsed.new_balance || "",
          minimum_payment_due: parsed.minimum_payment_due || "",
        };

        // Extract transactions
        const extractedTransactions = parsed.transactions || [];
        console.log("Extracted transactions:", extractedTransactions);
        setTransactions(extractedTransactions);

        console.log("Setting new statement:", updatedStatement);
        setNewStatement(updatedStatement);

        setMessage({
          type: "success",
          text: `PDF parsed successfully! Found ${extractedTransactions.length} transactions.`,
        });
      } else {
        console.error("Backend returned error:", data);
        setMessage({
          type: "error",
          text: data.detail || "Failed to parse PDF",
        });
      }
    } catch (error) {
      console.error("PDF parsing error:", error);
      setMessage({ type: "error", text: "Failed to parse PDF statement" });
    } finally {
      setLoading(false);
    }
  };

  const importStatement = async (e) => {
    e.preventDefault();
    if (!selectedAccount) {
      setMessage({ type: "error", text: "Please select an account first" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/credit-statements/${selectedAccount.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newStatement,
            credit_account_id: selectedAccount.id,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Credit card statement imported successfully",
        });
        setNewStatement({
          statement_date: "",
          payment_due_date: "",
          new_balance: "",
          minimum_payment_due: "",
        });
        setSelectedFile(null);
        setTransactions([]);

        // Refresh data
        fetchStatements(selectedAccount.id);
      } else {
        setMessage({
          type: "error",
          text: data.detail || "Failed to import statement",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to import credit card statement",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>Credit Card Management</Title>
      </Header>

      {message && <Alert type={message.type}>{message.text}</Alert>}

      <Tabs>
        <Tab
          active={activeTab === "accounts"}
          onClick={() => setActiveTab("accounts")}
        >
          Credit Card Accounts
        </Tab>
        <Tab
          active={activeTab === "statements"}
          onClick={() => setActiveTab("statements")}
        >
          Statement Import
        </Tab>
        <Tab
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        >
          Statement History
        </Tab>
      </Tabs>

      {activeTab === "accounts" && (
        <div>
          <Card>
            <h2>Create New Credit Card Account</h2>
            <Form onSubmit={createCreditAccount}>
              <FormGroup>
                <Label>Account Name</Label>
                <Input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, name: e.target.value })
                  }
                  placeholder="e.g., Chase Freedom Unlimited"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Credit Card Provider</Label>
                <Select
                  value={newAccount.provider}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, provider: e.target.value })
                  }
                >
                  <option value="">Select provider...</option>
                  <option value="chase">Chase</option>
                  <option value="citi">Citi</option>
                  <option value="fsu">FSU Credit Union</option>
                  <option value="generic">Generic</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Account Number (Optional)</Label>
                <Input
                  type="text"
                  value={newAccount.account_number}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      account_number: e.target.value,
                    })
                  }
                  placeholder="Last 4 digits for reference"
                />
              </FormGroup>

              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </Form>
          </Card>

          <Card>
            <h2>Credit Card Accounts</h2>
            <Table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Provider</th>
                  <th>Account Number</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {creditAccounts.map((account) => (
                  <tr key={account.id}>
                    <td>{account.name}</td>
                    <td>{account.provider}</td>
                    <td>{account.account_number || "N/A"}</td>
                    <td>{account.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
      )}

      {activeTab === "statements" && (
        <div>
          <Card>
            <h2>Import Credit Card Statement</h2>

            <FormGroup>
              <Label>Select Credit Card Account</Label>
              <Select
                value={selectedAccount?.id || ""}
                onChange={(e) => {
                  if (!e.target.value) {
                    handleAccountSelect(null);
                    return;
                  }
                  const account = creditAccounts.find(
                    (acc) => acc.id === parseInt(e.target.value)
                  );
                  if (account) {
                    handleAccountSelect(account);
                  }
                }}
              >
                <option value="">Choose an account...</option>
                {creditAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.provider})
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Upload PDF Statement</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              <div
                style={{ marginTop: "8px", fontSize: "14px", color: "#718096" }}
              >
                {!selectedAccount &&
                  "⚠️ Please select an account first to parse the PDF"}
                {selectedAccount &&
                  `📄 Ready to parse PDF for ${selectedAccount.name}`}
              </div>
              <Button
                type="button"
                onClick={parsePDFStatement}
                disabled={!selectedFile || !selectedAccount || loading}
                style={{ marginTop: "10px" }}
              >
                Parse PDF
              </Button>
            </FormGroup>

            {selectedFile && !selectedAccount && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  background: "#fff5f5",
                  border: "1px solid #fed7d7",
                  borderRadius: "6px",
                }}
              >
                <p style={{ margin: "0", color: "#c53030", fontSize: "14px" }}>
                  📋 <strong>Account Required:</strong> Please select an account
                  above to continue with statement import.
                </p>
              </div>
            )}

            {selectedFile && selectedAccount && (
              <div>
                <Form onSubmit={importStatement}>
                  <h3>Statement Information</h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    <FormGroup>
                      <Label>Statement Date</Label>
                      <Input
                        type="text"
                        value={newStatement.statement_date || ""}
                        onChange={(e) =>
                          setNewStatement({
                            ...newStatement,
                            statement_date: e.target.value,
                          })
                        }
                        placeholder="MM/DD/YYYY"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label>Payment Due Date</Label>
                      <Input
                        type="text"
                        value={newStatement.payment_due_date || ""}
                        onChange={(e) =>
                          setNewStatement({
                            ...newStatement,
                            payment_due_date: e.target.value,
                          })
                        }
                        placeholder="MM/DD/YYYY"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label>New Balance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newStatement.new_balance || ""}
                        onChange={(e) =>
                          setNewStatement({
                            ...newStatement,
                            new_balance: e.target.value,
                          })
                        }
                        placeholder="0.00"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label>Minimum Payment Due</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newStatement.minimum_payment_due || ""}
                        onChange={(e) =>
                          setNewStatement({
                            ...newStatement,
                            minimum_payment_due: e.target.value,
                          })
                        }
                        placeholder="0.00"
                      />
                    </FormGroup>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    style={{ marginTop: "16px" }}
                  >
                    {loading ? "Importing..." : "Import Statement"}
                  </Button>
                </Form>

                {/* Display Transactions */}
                {transactions.length > 0 && (
                  <div style={{ marginTop: "24px" }}>
                    <h3>Extracted Transactions</h3>
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "16px",
                        maxHeight: "400px",
                        overflowY: "auto",
                      }}
                    >
                      <Table>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: "8px" }}>
                              Date
                            </th>
                            <th style={{ textAlign: "left", padding: "8px" }}>
                              Description
                            </th>
                            <th style={{ textAlign: "right", padding: "8px" }}>
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction, index) => (
                            <tr
                              key={index}
                              style={{ borderBottom: "1px solid #e2e8f0" }}
                            >
                              <td style={{ padding: "8px" }}>
                                {transaction.date || "N/A"}
                              </td>
                              <td style={{ padding: "8px" }}>
                                {transaction.description || "N/A"}
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  textAlign: "right",
                                  fontWeight: "bold",
                                  color:
                                    transaction.amount &&
                                    parseFloat(transaction.amount) < 0
                                      ? "#dc2626"
                                      : "#16a34a",
                                }}
                              >
                                ${transaction.amount || "0.00"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "8px",
                          background: "#e0f2fe",
                          borderRadius: "4px",
                          fontSize: "14px",
                          color: "#0c4a6e",
                        }}
                      >
                        📊 Found {transactions.length} transactions
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "history" && (
        <div>
          <Card>
            <h2>Statement History</h2>
            {selectedAccount ? (
              <div>
                <h3>{selectedAccount.name} - Statements</h3>
                <Table>
                  <thead>
                    <tr>
                      <th>Statement Date</th>
                      <th>Payment Due Date</th>
                      <th>New Balance</th>
                      <th>Minimum Payment Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statements.map((statement) => (
                      <tr key={statement.id}>
                        <td>{statement.statement_date}</td>
                        <td>{statement.payment_due_date}</td>
                        <td>
                          ${statement.new_balance?.toLocaleString() || "N/A"}
                        </td>
                        <td>
                          $
                          {statement.minimum_payment_due?.toLocaleString() ||
                            "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <p>Please select an account to view statement history.</p>
            )}
          </Card>
        </div>
      )}
    </Container>
  );
};

export default CreditCard;
