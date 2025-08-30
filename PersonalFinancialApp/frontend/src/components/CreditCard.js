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

  // Debug: Log current state on every render
  console.log("🔍 CreditCard render - Current state:", {
    activeTab,
    creditAccountsCount: creditAccounts.length,
    selectedAccount: selectedAccount
      ? `${selectedAccount.name} (ID: ${selectedAccount.id})`
      : "null",
    statementsCount: statements.length,
    transactionsCount: transactions.length,
    selectedFile: selectedFile ? selectedFile.name : "null",
  });

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
    console.log("🔍 CreditCard component mounted, fetching credit accounts");
    fetchCreditAccounts();
  }, []);

  // Debug: Track selectedAccount changes
  useEffect(() => {
    console.log("🔍 selectedAccount state changed to:", selectedAccount);
  }, [selectedAccount]);

  // Debug: Track creditAccounts changes
  useEffect(() => {
    console.log("🔍 creditAccounts state changed to:", creditAccounts);
  }, [creditAccounts]);

  // Debug: Track statements changes
  useEffect(() => {
    console.log("🔍 statements state changed to:", statements);
  }, [statements]);

  const fetchCreditAccounts = async () => {
    console.log("🔍 fetchCreditAccounts called");

    try {
      console.log(
        "🔍 Fetching credit accounts from: http://localhost:8000/credit-accounts"
      );

      const response = await fetch("http://localhost:8000/credit-accounts");
      console.log("🔍 Response status:", response.status);

      const data = await response.json();
      console.log("🔍 Credit accounts data:", data);

      console.log("🔍 Setting creditAccounts state to:", data);
      setCreditAccounts(data);
    } catch (error) {
      console.error("❌ Error fetching credit accounts:", error);
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
    console.log("🔍 handleAccountSelect called with:", account);
    console.log(
      "🔍 Current selectedAccount state before update:",
      selectedAccount
    );

    if (!account) {
      console.log("🔍 Setting selectedAccount to null");
      setSelectedAccount(null);
      return;
    }

    console.log("🔍 Setting selectedAccount to:", account);
    setSelectedAccount(account);

    // Add a small delay to see state changes
    setTimeout(() => {
      console.log(
        "🔍 selectedAccount state after update (delayed):",
        selectedAccount
      );
    }, 100);

    console.log("🔍 Fetching statements for account ID:", account.id);
    fetchStatements(account.id);
  };

  const fetchStatements = async (accountId) => {
    console.log("🔍 fetchStatements called with accountId:", accountId);

    if (!accountId) {
      console.log("🔍 No accountId provided, returning early");
      return;
    }

    try {
      console.log(
        "🔍 Fetching statements from:",
        `http://localhost:8000/credit-statements/${accountId}`
      );

      const response = await fetch(
        `http://localhost:8000/credit-statements/${accountId}`
      );

      console.log("🔍 Response status:", response.status);
      const data = await response.json();
      console.log("🔍 Response data:", data);

      if (data.success) {
        console.log("🔍 Setting statements:", data.statements || []);
        setStatements(data.statements || []);
      } else {
        console.log("❌ Response not successful:", data);
      }
    } catch (error) {
      console.error("❌ Error fetching statements:", error);
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
      // Prepare the statement data with transactions
      const statementData = {
        ...newStatement,
        credit_account_id: selectedAccount.id,
        transactions: transactions.map((transaction) => ({
          transaction_date: transaction.date || transaction.transaction_date,
          description: transaction.description,
          amount: parseFloat(transaction.amount) || 0,
          category: transaction.category || "Uncategorized",
        })),
      };

      console.log(
        "🔍 Sending statement data with transactions:",
        statementData
      );

      const response = await fetch(
        `http://localhost:8000/credit-statements/${selectedAccount.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(statementData),
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

              {/* Debug: Show current state */}
              <div
                style={{
                  marginBottom: "8px",
                  padding: "8px",
                  background: "#f0f9ff",
                  border: "1px solid #0ea5e9",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                <strong>Debug:</strong> selectedAccount:{" "}
                {selectedAccount
                  ? `${selectedAccount.name} (ID: ${selectedAccount.id})`
                  : "null"}{" "}
                | creditAccounts: {creditAccounts.length} accounts
              </div>

              <Select
                value={selectedAccount?.id || ""}
                onChange={(e) => {
                  console.log(
                    "🔍 Account dropdown changed to:",
                    e.target.value
                  );
                  console.log("🔍 Current creditAccounts:", creditAccounts);
                  console.log("🔍 Current selectedAccount:", selectedAccount);

                  if (!e.target.value) {
                    console.log(
                      "🔍 No account selected, calling handleAccountSelect(null)"
                    );
                    handleAccountSelect(null);
                    return;
                  }

                  const accountId = parseInt(e.target.value);
                  console.log("🔍 Looking for account with ID:", accountId);

                  const account = creditAccounts.find(
                    (acc) => acc.id === accountId
                  );
                  console.log("🔍 Found account:", account);

                  if (account) {
                    console.log(
                      "🔍 Calling handleAccountSelect with found account"
                    );
                    handleAccountSelect(account);
                  } else {
                    console.log("❌ No account found with ID:", accountId);
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

                    {/* Debug: Show raw transaction data */}
                    <div
                      style={{
                        marginBottom: "16px",
                        padding: "12px",
                        background: "#fef3c7",
                        border: "1px solid #f59e0b",
                        borderRadius: "6px",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 8px 0",
                          color: "#92400e",
                          fontSize: "14px",
                        }}
                      >
                        Debug: Raw Transaction Data
                      </h4>
                      <pre
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          color: "#92400e",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {JSON.stringify(transactions, null, 2)}
                      </pre>
                    </div>

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
                              Date of Transaction
                            </th>
                            <th style={{ textAlign: "left", padding: "8px" }}>
                              Merchant Name or Transaction Description
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

            <div>
              {/* Account Selection for Statement History */}
              <FormGroup>
                <Label>Select Credit Card Account to View Statements</Label>

                {/* Debug: Show current state */}
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px",
                    background: "#f0f9ff",
                    border: "1px solid #0ea5e9",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                >
                  <strong>Debug - Statement History:</strong>
                  <br />
                  selectedAccount:{" "}
                  {selectedAccount
                    ? `${selectedAccount.name} (ID: ${selectedAccount.id})`
                    : "null"}
                  <br />
                  statements count: {statements.length}
                  <br />
                  activeTab: {activeTab}
                </div>

                <Select
                  value={selectedAccount?.id || ""}
                  onChange={(e) => {
                    console.log(
                      "🔍 Statement History - Account dropdown changed to:",
                      e.target.value
                    );

                    if (!e.target.value) {
                      console.log("🔍 Statement History - No account selected");
                      setSelectedAccount(null);
                      setStatements([]);
                      return;
                    }

                    const accountId = parseInt(e.target.value);
                    console.log(
                      "🔍 Statement History - Looking for account with ID:",
                      accountId
                    );

                    const account = creditAccounts.find(
                      (acc) => acc.id === accountId
                    );
                    console.log(
                      "🔍 Statement History - Found account:",
                      account
                    );

                    if (account) {
                      console.log(
                        "🔍 Statement History - Setting selected account and fetching statements"
                      );
                      setSelectedAccount(account);
                      fetchStatements(account.id);
                    } else {
                      console.log(
                        "❌ Statement History - No account found with ID:",
                        accountId
                      );
                    }
                  }}
                >
                  <option value="">
                    Choose an account to view statements...
                  </option>
                  {creditAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.provider})
                    </option>
                  ))}
                </Select>
              </FormGroup>

              {/* Display Statements */}
              {selectedAccount ? (
                <div style={{ marginTop: "24px" }}>
                  <h3>{selectedAccount.name} - Statements</h3>
                  {statements.length > 0 ? (
                    <>
                      <Table>
                        <thead>
                          <tr style={{ backgroundColor: "#f8fafc" }}>
                            <th
                              style={{
                                padding: "12px",
                                color: "#1e293b",
                                borderBottom: "2px solid #e2e8f0",
                              }}
                            >
                              Statement Date
                            </th>
                            <th
                              style={{
                                padding: "12px",
                                color: "#1e293b",
                                borderBottom: "2px solid #e2e8f0",
                              }}
                            >
                              Payment Due Date
                            </th>
                            <th
                              style={{
                                padding: "12px",
                                color: "#1e293b",
                                borderBottom: "2px solid #e2e8f0",
                              }}
                            >
                              New Balance
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {statements.map((statement, index) => (
                            <tr
                              key={statement.id}
                              style={{
                                backgroundColor:
                                  index % 2 === 0 ? "#ffffff" : "#f8fafc",
                                borderBottom: "1px solid #e2e8f0",
                              }}
                            >
                              <td style={{ padding: "12px", color: "#1e293b" }}>
                                {statement.statement_date}
                              </td>
                              <td style={{ padding: "12px", color: "#1e293b" }}>
                                {statement.payment_due_date}
                              </td>
                              <td
                                style={{
                                  padding: "12px",
                                  color: "#1e293b",
                                  fontWeight: "600",
                                }}
                              >
                                $
                                {statement.new_balance?.toLocaleString() ||
                                  "N/A"}
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
                        📊 Found {statements.length} statements for{" "}
                        {selectedAccount.name}
                      </div>

                      {/* Transaction Details Section */}
                      <div style={{ marginTop: "24px" }}>
                        <h4>Transaction Details</h4>
                        <div
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "16px",
                            maxHeight: "400px",
                            overflowY: "auto",
                          }}
                        >
                          {statements.map((statement) => (
                            <div
                              key={statement.id}
                              style={{ marginBottom: "20px" }}
                            >
                              <h5
                                style={{
                                  color: "#1e293b",
                                  margin: "0 0 12px 0",
                                  fontSize: "16px",
                                  borderBottom: "2px solid #3b82f6",
                                  paddingBottom: "8px",
                                }}
                              >
                                📅 Statement: {statement.statement_date} |
                                Balance: $
                                {statement.new_balance?.toLocaleString() ||
                                  "N/A"}
                              </h5>

                              {statement.transactions &&
                              statement.transactions.length > 0 ? (
                                <Table>
                                  <thead>
                                    <tr>
                                      <th
                                        style={{
                                          textAlign: "left",
                                          padding: "8px",
                                          color: "#374151",
                                        }}
                                      >
                                        Date of Transaction
                                      </th>
                                      <th
                                        style={{
                                          textAlign: "left",
                                          padding: "8px",
                                          color: "#374151",
                                        }}
                                      >
                                        Merchant Name or Description
                                      </th>
                                      <th
                                        style={{
                                          textAlign: "right",
                                          padding: "8px",
                                          color: "#374151",
                                        }}
                                      >
                                        Amount
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {statement.transactions.map(
                                      (transaction, index) => (
                                        <tr
                                          key={index}
                                          style={{
                                            borderBottom: "1px solid #f3f4f6",
                                          }}
                                        >
                                          <td
                                            style={{
                                              padding: "8px",
                                              color: "#1f2937",
                                            }}
                                          >
                                            {transaction.transaction_date ||
                                              "N/A"}
                                          </td>
                                          <td
                                            style={{
                                              padding: "8px",
                                              color: "#1f2937",
                                            }}
                                          >
                                            {transaction.description || "N/A"}
                                          </td>
                                          <td
                                            style={{
                                              padding: "8px",
                                              textAlign: "right",
                                              fontWeight: "bold",
                                              color:
                                                transaction.amount &&
                                                parseFloat(transaction.amount) <
                                                  0
                                                  ? "#dc2626"
                                                  : "#16a34a",
                                            }}
                                          >
                                            ${transaction.amount || "0.00"}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </Table>
                              ) : (
                                <div
                                  style={{
                                    padding: "12px",
                                    background: "#f9fafb",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "6px",
                                    textAlign: "center",
                                    color: "#6b7280",
                                  }}
                                >
                                  📋 No transaction details available for this
                                  statement
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        padding: "16px",
                        background: "#fef3c7",
                        border: "1px solid #f59e0b",
                        borderRadius: "6px",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          margin: "0",
                          color: "#92400e",
                          fontSize: "16px",
                        }}
                      >
                        📋 No statements found for {selectedAccount.name}
                      </p>
                      <p
                        style={{
                          margin: "8px 0 0 0",
                          color: "#92400e",
                          fontSize: "14px",
                        }}
                      >
                        This account doesn't have any imported statements yet.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    marginTop: "24px",
                    padding: "20px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{ margin: "0", color: "#374151", fontSize: "16px" }}
                  >
                    📋 Select an account above to view its statement history
                  </p>
                  <p
                    style={{
                      margin: "8px 0 0 0",
                      color: "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    Choose any credit card account from the dropdown to see all
                    imported statements
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </Container>
  );
};

export default CreditCard;
