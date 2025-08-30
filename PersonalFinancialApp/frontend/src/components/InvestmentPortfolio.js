import React, { useState, useEffect } from "react";
import styled from "styled-components";

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #1a365d;
  margin: 0;
`;

const Button = styled.button`
  background: #3182ce;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background: #2c5aa0;
  }

  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Form = styled.form`
  display: grid;
  gap: 16px;
  margin-top: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #2d3748;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  background: white;

  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
`;

const FileInput = styled.input`
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #2d3748;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 24px;
`;

const Tab = styled.button`
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => (props.active ? "#3182ce" : "#718096")};
  border-bottom: 2px solid
    ${(props) => (props.active ? "#3182ce" : "transparent")};

  &:hover {
    color: #3182ce;
  }
`;

const Alert = styled.div`
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;

  ${(props) =>
    props.type === "success" &&
    `
    background: #c6f6d5;
    color: #22543d;
    border: 1px solid #9ae6b4;
  `}

  ${(props) =>
    props.type === "error" &&
    `
    background: #fed7d7;
    color: #742a2a;
    border: 1px solid #feb2b2;
  `}
  
  ${(props) =>
    props.type === "info" &&
    `
    background: #bee3f8;
    color: #2a4365;
    border: 1px solid #90cdf4;
  `}
`;

const InvestmentPortfolio = () => {
  const [activeTab, setActiveTab] = useState("accounts");
  const [investmentAccounts, setInvestmentAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [securities, setSecurities] = useState([]);
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Form states
  const [newAccount, setNewAccount] = useState({
    name: "",
    account_type: "brokerage",
    custodian: "",
    account_number: "",
  });

  const [newStatement, setNewStatement] = useState({
    statement_date: "",
    opening_balance: "",
    period_gain_loss: "",
    ending_balance: "",
    total_market_value: "",
    total_cost_basis: "",
    total_unrealized_gain_loss: "",
  });

  console.log("Initial newStatement state:", newStatement);

  const [securitiesData, setSecuritiesData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [availableFormats, setAvailableFormats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("auto");
  const [parsedData, setParsedData] = useState(null);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [selectedStatementDate, setSelectedStatementDate] = useState("");

  useEffect(() => {
    fetchInvestmentAccounts();
    fetchAvailableFormats();
  }, []);

  const fetchInvestmentAccounts = async () => {
    try {
      const response = await fetch("http://localhost:8000/investment-accounts");
      const data = await response.json();
      setInvestmentAccounts(data);
    } catch (error) {
      console.error("Error fetching investment accounts:", error);
      setMessage({
        type: "error",
        text: "Failed to fetch investment accounts",
      });
    }
  };

  const fetchAvailableFormats = async () => {
    try {
      const response = await fetch("http://localhost:8000/statement-formats");
      const data = await response.json();
      if (data.success) {
        setAvailableFormats(data.formats);
      }
    } catch (error) {
      console.log("Failed to fetch statement formats, using defaults");
    }
  };

  const createInvestmentAccount = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/investment-accounts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newAccount),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: data.message || "Investment account created successfully",
        });

        setNewAccount({
          name: "",
          account_type: "brokerage",
          custodian: "",
          account_number: "",
        });
        fetchInvestmentAccounts();
      } else {
        setMessage({
          type: "error",
          text: data.detail || "Failed to create account",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to create investment account",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioSummary = async (accountId) => {
    if (!accountId) return;
    try {
      const response = await fetch(
        `http://localhost:8000/portfolio-summary/${accountId}`
      );
      const data = await response.json();
      setPortfolioSummary(data);
    } catch (error) {
      console.error("Error fetching portfolio summary:", error);
    }
  };

  const fetchPortfolioSummaryByDate = async (accountId, date) => {
    if (!accountId) return;
    try {
      const response = await fetch(
        `http://localhost:8000/portfolio-summary/${accountId}/by-date?statement_date=${date}`
      );
      const data = await response.json();
      setPortfolioSummary(data);
    } catch (error) {
      console.error("Error fetching portfolio summary by date:", error);
    }
  };

  const fetchSecurities = async (accountId) => {
    if (!accountId) return;
    try {
      const response = await fetch(
        `http://localhost:8000/securities/${accountId}`
      );
      const data = await response.json();
      setSecurities(data);
    } catch (error) {
      console.error("Error fetching securities:", error);
    }
  };

  const fetchStatements = async (accountId) => {
    if (!accountId) return;
    try {
      const response = await fetch(
        `http://localhost:8000/portfolio-statements/${accountId}`
      );
      const data = await response.json();
      setStatements(data);
    } catch (error) {
      console.error("Error fetching statements:", error);
    }
  };

  const handleAccountSelect = (account) => {
    if (!account) {
      setSelectedAccount(null);
      return;
    }
    setSelectedAccount(account);
    fetchPortfolioSummary(account.id);
    fetchSecurities(account.id);
    fetchStatements(account.id);
  };

  const addSecurity = () => {
    setSecuritiesData([
      ...securitiesData,
      {
        symbol: "",
        name: "",
        security_type: "Stock",
        quantity: "",
        share_price: "",
        total_cost: "",
        market_value: "",
        unrealized_gain_loss: "",
      },
    ]);
  };

  const updateSecurity = (index, field, value) => {
    const updated = [...securitiesData];
    updated[index][field] = value;
    setSecuritiesData(updated);
  };

  const removeSecurity = (index) => {
    setSecuritiesData(securitiesData.filter((_, i) => i !== index));
  };

  const importStatement = async (e) => {
    e.preventDefault();
    if (!selectedAccount || !selectedFile) {
      setMessage({
        type: "error",
        text: "Please select an account and upload a statement file",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append(
        "statement",
        JSON.stringify({
          ...newStatement,
          investment_account_id: selectedAccount.id,
          securities: securitiesData,
        })
      );

      const response = await fetch(
        `http://localhost:8000/portfolio-statements/${selectedAccount.id}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Portfolio statement imported successfully",
        });
        setNewStatement({
          statement_date: "",
          opening_balance: "",
          period_gain_loss: "",
          ending_balance: "",
          total_market_value: "",
          total_cost_basis: "",
          total_unrealized_gain_loss: "",
        });
        setSecuritiesData([]);
        setSelectedFile(null);

        // Refresh data
        fetchPortfolioSummary(selectedAccount.id);
        fetchSecurities(selectedAccount.id);
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
        text: "Failed to import portfolio statement",
      });
    } finally {
      setLoading(false);
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
      const endpoint =
        selectedFormat !== "auto"
          ? `/parse-pdf-statement/${selectedFormat}`
          : "/parse-pdf-statement";

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const parsed = data.parsed_data || data;
        setNewStatement({
          statement_date: parsed.statement_date || "",
          opening_balance: parsed.opening_balance || "",
          period_gain_loss: parsed.period_gain_loss || "",
          ending_balance: parsed.ending_balance || "",
          total_market_value: parsed.total_market_value || "",
          total_cost_basis: parsed.total_cost_basis || "",
          total_unrealized_gain_loss: parsed.total_unrealized_gain_loss || "",
        });
        setSecuritiesData(parsed.securities || []);
        setParsedData(parsed);
        setMessage({
          type: "success",
          text: `PDF parsed successfully using ${
            data.format_used || "auto-detection"
          }! Review and adjust the data before importing.`,
        });
      } else {
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

  return (
    <Container>
      <Header>
        <Title>Investment Portfolio Management</Title>
      </Header>

      {message && <Alert type={message.type}>{message.text}</Alert>}

      <Tabs>
        <Tab
          active={activeTab === "accounts"}
          onClick={() => setActiveTab("accounts")}
        >
          Investment Accounts
        </Tab>
        <Tab
          active={activeTab === "portfolio"}
          onClick={() => setActiveTab("portfolio")}
        >
          Portfolio View
        </Tab>
        <Tab
          active={activeTab === "import"}
          onClick={() => setActiveTab("import")}
        >
          Import Statement
        </Tab>
      </Tabs>

      {activeTab === "accounts" && (
        <Card>
          <h2>Create New Investment Account</h2>
          <Form onSubmit={createInvestmentAccount}>
            <FormGroup>
              <Label>Account Name</Label>
              <Input
                type="text"
                value={newAccount.name}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, name: e.target.value })
                }
                placeholder="e.g., Fidelity 401k"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Account Type</Label>
              <Select
                value={newAccount.account_type}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, account_type: e.target.value })
                }
              >
                <option value="brokerage">Brokerage</option>
                <option value="401k">401(k)</option>
                <option value="ira">IRA</option>
                <option value="roth_ira">Roth IRA</option>
                <option value="401k_roth">Roth 401(k)</option>
                <option value="hsa">HSA</option>

                <option value="other">Other</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Custodian</Label>
              <Input
                type="text"
                value={newAccount.custodian}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, custodian: e.target.value })
                }
                placeholder="e.g., Fidelity, Vanguard, Charles Schwab"
              />
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
      )}

      {activeTab === "portfolio" && (
        <div>
          <Card>
            <h2>Select Investment Account</h2>
            <Select
              value={selectedAccount?.id || ""}
              onChange={(e) => {
                if (!e.target.value) {
                  handleAccountSelect(null);
                  return;
                }
                const account = investmentAccounts.find(
                  (acc) => acc.id === parseInt(e.target.value)
                );
                if (account) {
                  handleAccountSelect(account);
                }
              }}
            >
              <option value="">Choose an account...</option>
              {investmentAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.account_type})
                </option>
              ))}
            </Select>
          </Card>

          {selectedAccount && (
            <>
              <Card>
                <h3>Select Statement Month</h3>
                <div
                  style={{ display: "flex", gap: "16px", alignItems: "center" }}
                >
                  <Select
                    value={selectedStatementDate || ""}
                    onChange={(e) => {
                      setSelectedStatementDate(e.target.value);
                      if (!selectedAccount) return;
                      if (e.target.value) {
                        fetchPortfolioSummaryByDate(
                          selectedAccount.id,
                          e.target.value
                        );
                      } else {
                        fetchPortfolioSummary(selectedAccount.id);
                      }
                    }}
                    style={{ flex: 1 }}
                  >
                    <option value="">Latest Statement</option>
                    {statements.map((statement) => (
                      <option
                        key={statement.id}
                        value={statement.statement_date}
                      >
                        {statement.statement_date}
                      </option>
                    ))}
                  </Select>
                  <Button
                    onClick={() => {
                      setSelectedStatementDate("");
                      if (!selectedAccount) return;
                      fetchPortfolioSummary(selectedAccount.id);
                    }}
                    disabled={!selectedStatementDate}
                    style={{ background: "#718096" }}
                  >
                    Reset to Latest
                  </Button>
                </div>
              </Card>
            </>
          )}

          {selectedAccount && portfolioSummary && (
            <>
              <Card>
                <h2>
                  Portfolio Summary - {selectedAccount.name}
                  {selectedAccount.account_type === "credit" && (
                    <span
                      style={{
                        background: "#e53e3e",
                        color: "white",
                        fontSize: "12px",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        marginLeft: "12px",
                        fontWeight: "normal",
                      }}
                    >
                      Credit Card Account
                    </span>
                  )}
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "20px",
                  }}
                >
                  <div>
                    <strong style={{ color: "#2d3748", fontSize: "14px" }}>
                      Period Gain/Loss:
                    </strong>
                    <p
                      style={{
                        color:
                          portfolioSummary.period_gain_loss >= 0
                            ? "#38a169"
                            : "#e53e3e",
                        fontSize: "16px",
                        margin: "8px 0",
                        fontWeight: "500",
                      }}
                    >
                      $
                      {portfolioSummary.period_gain_loss?.toLocaleString() ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: "#2d3748", fontSize: "14px" }}>
                      Ending Balance:
                    </strong>
                    <p
                      style={{
                        color: "#1a202c",
                        fontSize: "16px",
                        margin: "8px 0",
                        fontWeight: "500",
                      }}
                    >
                      $
                      {portfolioSummary.ending_balance?.toLocaleString() ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: "#2d3748", fontSize: "14px" }}>
                      Total Market Value:
                    </strong>
                    <p
                      style={{
                        color: "#1a202c",
                        fontSize: "16px",
                        margin: "8px 0",
                        fontWeight: "500",
                      }}
                    >
                      $
                      {portfolioSummary.total_market_value?.toLocaleString() ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: "#2d3748", fontSize: "14px" }}>
                      Total Unrealized G/L:
                    </strong>
                    <p
                      style={{
                        color:
                          portfolioSummary.total_unrealized_gain_loss >= 0
                            ? "#38a169"
                            : "#e53e3e",
                        fontSize: "16px",
                        margin: "8px 0",
                        fontWeight: "500",
                      }}
                    >
                      $
                      {portfolioSummary.total_unrealized_gain_loss?.toLocaleString() ||
                        "N/A"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <h2>Securities Holdings</h2>
                <Table>
                  <thead>
                    <tr>
                      <Th>Symbol</Th>
                      <Th>Name</Th>
                      <Th>Type</Th>
                      <Th>Quantity</Th>
                      <Th>Share Price</Th>
                      <Th>Total Cost</Th>
                      <Th>Market Value</Th>
                      <Th>Unrealized G/L</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {securities.map((security, index) => (
                      <tr key={index}>
                        <Td>{security.symbol}</Td>
                        <Td>{security.name}</Td>
                        <Td>{security.security_type}</Td>
                        <Td>{security.quantity?.toLocaleString()}</Td>
                        <Td>${security.share_price?.toLocaleString()}</Td>
                        <Td>${security.total_cost?.toLocaleString()}</Td>
                        <Td>${security.market_value?.toLocaleString()}</Td>
                        <Td
                          style={{
                            color:
                              security.unrealized_gain_loss >= 0
                                ? "green"
                                : "red",
                          }}
                        >
                          ${security.unrealized_gain_loss?.toLocaleString()}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === "import" && (
        <div>
          <Card>
            <h2>Import Portfolio Statement</h2>

            <FormGroup>
              <Label>Select Investment Account</Label>
              <Select
                value={selectedAccount?.id || ""}
                onChange={(e) => {
                  if (!e.target.value) {
                    setSelectedAccount(null);
                    return;
                  }
                  const account = investmentAccounts.find(
                    (acc) => acc.id === parseInt(e.target.value)
                  );
                  if (account) {
                    setSelectedAccount(account);
                  }
                }}
              >
                <option value="">Choose an account...</option>
                {investmentAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.account_type})
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Upload PDF Statement</Label>
              <FileInput
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
              <Form onSubmit={importStatement}>
                <h3>Statement Information</h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
                    <Label>Opening Balance</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newStatement.opening_balance || ""}
                      onChange={(e) =>
                        setNewStatement({
                          ...newStatement,
                          opening_balance: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Period Gain/Loss</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newStatement.period_gain_loss || ""}
                      onChange={(e) =>
                        setNewStatement({
                          ...newStatement,
                          period_gain_loss: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Ending Balance</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newStatement.ending_balance || ""}
                      onChange={(e) =>
                        setNewStatement({
                          ...newStatement,
                          ending_balance: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Total Market Value</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newStatement.total_market_value || ""}
                      onChange={(e) =>
                        setNewStatement({
                          ...newStatement,
                          total_market_value: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Total Cost Basis</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newStatement.total_cost_basis || ""}
                      onChange={(e) =>
                        setNewStatement({
                          ...newStatement,
                          total_cost_basis: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Total Unrealized G/L</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newStatement.total_unrealized_gain_loss || ""}
                      onChange={(e) =>
                        setNewStatement({
                          ...newStatement,
                          total_unrealized_gain_loss: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </FormGroup>
                </div>

                <h3>Securities</h3>
                <Button type="button" onClick={addSecurity}>
                  Add Security
                </Button>

                {securitiesData.map((security, index) => (
                  <Card key={index} style={{ marginTop: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <h4>Security {index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => removeSecurity(index)}
                        style={{ background: "#e53e3e", padding: "8px 16px" }}
                      >
                        Remove
                      </Button>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      <FormGroup>
                        <Label>Symbol</Label>
                        <Input
                          type="text"
                          value={security.symbol}
                          onChange={(e) =>
                            updateSecurity(index, "symbol", e.target.value)
                          }
                          placeholder="AAPL"
                          required
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>Name</Label>
                        <Input
                          type="text"
                          value={security.name}
                          onChange={(e) =>
                            updateSecurity(index, "name", e.target.value)
                          }
                          placeholder="Apple Inc."
                          required
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>Type</Label>
                        <Select
                          value={security.security_type}
                          onChange={(e) =>
                            updateSecurity(
                              index,
                              "security_type",
                              e.target.value
                            )
                          }
                        >
                          <option value="Stock">Stock</option>
                          <option value="ETF">ETF</option>
                          <option value="Mutual Fund">Mutual Fund</option>
                          <option value="Bond">Bond</option>
                          <option value="Option">Option</option>
                          <option value="Other">Other</option>
                        </Select>
                      </FormGroup>

                      <FormGroup>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={security.quantity}
                          onChange={(e) =>
                            updateSecurity(index, "quantity", e.target.value)
                          }
                          placeholder="0"
                          required
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>Share Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={security.share_price}
                          onChange={(e) =>
                            updateSecurity(index, "share_price", e.target.value)
                          }
                          placeholder="0.00"
                          required
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>Total Cost</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={security.total_cost}
                          onChange={(e) =>
                            updateSecurity(index, "total_cost", e.target.value)
                          }
                          placeholder="0.00"
                          required
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>Market Value</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={security.market_value}
                          onChange={(e) =>
                            updateSecurity(
                              index,
                              "market_value",
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                          required
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>Unrealized G/L</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={security.unrealized_gain_loss}
                          onChange={(e) =>
                            updateSecurity(
                              index,
                              "unrealized_gain_loss",
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                          required
                        />
                      </FormGroup>
                    </div>
                  </Card>
                ))}

                <Button
                  type="submit"
                  disabled={loading || !selectedAccount || !selectedFile}
                >
                  {loading ? "Importing..." : "Import Statement"}
                </Button>
              </Form>
            )}
          </Card>
        </div>
      )}
    </Container>
  );
};

export default InvestmentPortfolio;
