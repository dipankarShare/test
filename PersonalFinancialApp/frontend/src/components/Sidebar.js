import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Link, useLocation } from "react-router-dom";

const SidebarContainer = styled.div`
  width: 280px;
  background-color: #1b263b;
  padding: 20px;
  border-right: 1px solid #415a77;
`;

const Logo = styled.h1`
  color: #e0e1dd;
  margin-bottom: 30px;
  font-size: 24px;
  text-align: center;
`;

const Section = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h3`
  color: #778da9;
  margin-bottom: 15px;
  font-size: 16px;
`;

const NavLink = styled(Link)`
  display: block;
  color: #e0e1dd;
  text-decoration: none;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #415a77;
  }

  &.active {
    background-color: #0077b6;
  }
`;

const DropdownContainer = styled.div`
  margin-bottom: 8px;
`;

const DropdownHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #e0e1dd;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #415a77;
  }
`;

const DropdownIcon = styled.span`
  transition: transform 0.2s;
  transform: ${(props) => (props.isOpen ? "rotate(90deg)" : "rotate(0deg)")};
`;

const DropdownContent = styled.div`
  max-height: ${(props) => (props.isOpen ? "300px" : "0")};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  margin-left: 16px;
`;

const DropdownItem = styled(Link)`
  display: block;
  color: #b8c5d1;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  margin-bottom: 4px;
  transition: background-color 0.2s;
  font-size: 14px;

  &:hover {
    background-color: #415a77;
    color: #e0e1dd;
  }

  &.active {
    background-color: #0077b6;
    color: #fff;
  }
`;

const BankItem = styled.div`
  padding: 10px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: ${(props) => (props.selected ? "#fff" : "#778da9")};
  background-color: ${(props) => (props.selected ? "#0077b6" : "transparent")};

  &:hover {
    background-color: #415a77;
  }
`;

const AccountItem = styled.div`
  padding: 8px 16px;
  margin: 4px 0 4px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: ${(props) => (props.selected ? "#fff" : "#778da9")};
  background-color: ${(props) => (props.selected ? "#6b7280" : "transparent")};
  font-size: 14px;
  border-left: 2px solid #415a77;

  &:hover {
    background-color: #415a77;
  }
`;

const AccountBalance = styled.div`
  font-size: 12px;
  color: #81c784;
  margin-top: 2px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 10px;
  border: 1px solid #415a77;
  border-radius: 4px;
  background-color: #0d1b2a;
  color: white;

  option {
    background-color: #0d1b2a;
    color: white;
  }
`;

const AddBankForm = styled.div`
  margin-top: 15px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 10px;
  border: 1px solid #415a77;
  border-radius: 4px;
  background-color: #0d1b2a;
  color: white;

  &::placeholder {
    color: #778da9;
  }
`;

const Button = styled.button`
  width: 100%;
  background-color: #0077b6;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #023e8a;
  }
`;

const JupyterLink = styled.a`
  display: block;
  color: #e8eaf6;
  text-decoration: none;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background-color 0.2s;
  background-color: #4caf50;
  text-align: center;

  &:hover {
    background-color: #45a049;
  }
`;

function Sidebar({
  banks,
  selectedBank,
  setSelectedBank,
  selectedAccount,
  setSelectedAccount,
  onBankAdded,
}) {
  const [newBankName, setNewBankName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Debug state changes
  console.log(
    "Sidebar render - showAddForm:",
    showAddForm,
    "newBankName:",
    newBankName
  );
  const [accounts, setAccounts] = useState([]);
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState("checking");
  const [dropdownStates, setDropdownStates] = useState({
    transactions: false,
    analytics: false,
  });
  const location = useLocation();

  const toggleDropdown = (dropdown) => {
    setDropdownStates((prev) => ({
      ...prev,
      [dropdown]: !prev[dropdown],
    }));
  };

  const testConnection = async () => {
    try {
      console.log("Testing connection to backend...");
      const response = await fetch("http://127.0.0.1:8000/", {
        method: "GET",
      });
      console.log("Connection test response:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Backend is responding:", data);
        return true;
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      alert(
        `Backend connection failed: ${error.message}\n\nPlease make sure the backend server is running:\ncd backend\npython main.py`
      );
      return false;
    }
  };

  const handleAddBank = async (e) => {
    e.preventDefault();
    if (!newBankName.trim()) {
      alert("Please enter a bank name");
      return;
    }

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      return;
    }

    try {
      console.log("Adding bank:", newBankName);
      const response = await fetch("http://127.0.0.1:8000/banks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newBankName }),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Bank added successfully:", result);
        setNewBankName("");
        setShowAddForm(false);
        onBankAdded();
        alert("Bank added successfully!");
      } else {
        const error = await response.json();
        console.error("Error response:", error);
        alert(`Error adding bank: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding bank:", error);
      alert(
        `Error adding bank: ${error.message}\n\nBackend might not be running. Please start it with:\ncd backend\npython main.py`
      );
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newAccountName.trim()) {
      alert("Please enter an account name");
      return;
    }
    if (!selectedBank) {
      alert("Please select a bank first");
      return;
    }

    try {
      console.log(
        "Adding account:",
        newAccountName,
        "to bank:",
        selectedBank.name
      );
      const response = await fetch(
        `http://127.0.0.1:8000/banks/${selectedBank.id}/accounts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newAccountName,
            account_type: newAccountType,
          }),
        }
      );

      console.log("Account response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Account added successfully:", result);
        setNewAccountName("");
        setNewAccountType("checking");
        setShowAddAccountForm(false);
        fetchAccounts();
        alert("Account added successfully!");
      } else {
        const error = await response.json();
        console.error("Error response:", error);
        alert(`Error adding account: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding account:", error);
      alert(`Error adding account: ${error.message}`);
    }
  };

  const fetchAccounts = async () => {
    if (!selectedBank) return;
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/banks/${selectedBank.id}/accounts`
      );
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const loadSampleData = async () => {
    if (!selectedAccount) return;
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/sample-data/${selectedAccount.id}`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        alert("Sample data loaded successfully!");
        fetchAccounts(); // Refresh to show updated balance
      }
    } catch (error) {
      console.error("Error loading sample data:", error);
    }
  };

  useEffect(() => {
    if (selectedBank) {
      fetchAccounts();
      setSelectedAccount(null);
    } else {
      setAccounts([]);
      setSelectedAccount(null);
    }
  }, [selectedBank, setSelectedAccount]);

  return (
    <SidebarContainer>
      <Logo>Finance Manager</Logo>

      <Section>
        <SectionTitle>Navigation</SectionTitle>

        {/* Dashboard - Always visible */}
        <NavLink to="/" className={location.pathname === "/" ? "active" : ""}>
          📊 Dashboard
        </NavLink>

        {/* Transactions Dropdown */}
        <DropdownContainer>
          <DropdownHeader onClick={() => toggleDropdown("transactions")}>
            <span>💳 Transactions</span>
            <DropdownIcon isOpen={dropdownStates.transactions}>▶</DropdownIcon>
          </DropdownHeader>
          <DropdownContent isOpen={dropdownStates.transactions}>
            <DropdownItem
              to="/transactions"
              className={location.pathname === "/transactions" ? "active" : ""}
            >
              View Transactions
            </DropdownItem>
            <DropdownItem
              to="/import"
              className={location.pathname === "/import" ? "active" : ""}
            >
              Import CSV
            </DropdownItem>
            <DropdownItem
              to="/categories"
              className={location.pathname === "/categories" ? "active" : ""}
            >
              Categories
            </DropdownItem>
          </DropdownContent>
        </DropdownContainer>

        {/* Analytics Dropdown */}
        <DropdownContainer>
          <DropdownHeader onClick={() => toggleDropdown("analytics")}>
            <span>📈 Analytics</span>
            <DropdownIcon isOpen={dropdownStates.analytics}>▶</DropdownIcon>
          </DropdownHeader>
          <DropdownContent isOpen={dropdownStates.analytics}>
            <DropdownItem
              to="/analytics"
              className={location.pathname === "/analytics" ? "active" : ""}
            >
              Analytics Dashboard
            </DropdownItem>
            <DropdownItem
              as="a"
              href="http://localhost:8888"
              target="_blank"
              style={{
                backgroundColor: "#4caf50",
                color: "white",
                fontWeight: "bold",
              }}
            >
              🔬 Jupyter Notebook
            </DropdownItem>
            <DropdownItem
              to="/design-preview"
              className={
                location.pathname === "/design-preview" ? "active" : ""
              }
              style={{
                backgroundColor: "#ff9800",
                color: "white",
                fontWeight: "bold",
              }}
            >
              🎨 Design System Test
            </DropdownItem>
            <DropdownItem
              to="/backups"
              className={location.pathname === "/backups" ? "active" : ""}
              style={{
                backgroundColor: "#9c27b0",
                color: "white",
                fontWeight: "bold",
              }}
            >
              💾 Backup Manager
            </DropdownItem>
            <DropdownItem
              to="/data-manager"
              className={location.pathname === "/data-manager" ? "active" : ""}
              style={{
                backgroundColor: "#f44336",
                color: "white",
                fontWeight: "bold",
              }}
            >
              🗑️ Data Manager
            </DropdownItem>
            <DropdownItem
              to="/investments"
              className={location.pathname === "/investments" ? "active" : ""}
              style={{
                backgroundColor: "#2196f3",
                color: "white",
                fontWeight: "bold",
              }}
            >
              📈 Investment Portfolio
            </DropdownItem>
            <DropdownItem
              to="/credit-cards"
              className={location.pathname === "/credit-cards" ? "active" : ""}
              style={{
                backgroundColor: "#ff9800",
                color: "white",
                fontWeight: "bold",
              }}
            >
              💳 Credit Cards
            </DropdownItem>
          </DropdownContent>
        </DropdownContainer>
      </Section>

      <Section>
        <SectionTitle>Banks & Accounts</SectionTitle>
        {banks.map((bank) => (
          <div key={bank.id}>
            <BankItem
              selected={selectedBank?.id === bank.id}
              onClick={() => setSelectedBank(bank)}
            >
              <div>{bank.name}</div>
              <div
                style={{ fontSize: "12px", color: "#9fa8da", marginTop: "2px" }}
              >
                {bank.account_count || 0} accounts • $
                {(bank.total_balance || 0).toFixed(2)}
              </div>
            </BankItem>

            {selectedBank?.id === bank.id &&
              accounts.map((account) => (
                <AccountItem
                  key={account.id}
                  selected={selectedAccount?.id === account.id}
                  onClick={() => setSelectedAccount(account)}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>
                      {account.name} ({account.account_type})
                    </span>
                    {selectedAccount?.id === account.id && (
                      <span style={{ color: "#4caf50", fontSize: "14px" }}>
                        ✓
                      </span>
                    )}
                  </div>
                  <AccountBalance>
                    ${(account.balance || 0).toFixed(2)}
                  </AccountBalance>
                </AccountItem>
              ))}
          </div>
        ))}

        {!showAddForm ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log(
                "Add Bank button clicked - showAddForm:",
                showAddForm
              );
              setShowAddForm(true);
              console.log("setShowAddForm(true) called");
            }}
            style={{
              width: "100%",
              backgroundColor: "#0077b6",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            + Add Bank
          </button>
        ) : (
          <AddBankForm>
            <form
              onSubmit={(e) => {
                console.log("Form submitted with bank name:", newBankName);
                handleAddBank(e);
              }}
            >
              <Input
                type="text"
                placeholder="Bank name"
                value={newBankName}
                onChange={(e) => {
                  console.log("Bank name changed to:", e.target.value);
                  setNewBankName(e.target.value);
                }}
                autoFocus
              />
              <Button type="submit" disabled={!newBankName.trim()}>
                Add
              </Button>
              <Button
                type="button"
                onClick={() => {
                  console.log("Cancel clicked");
                  setShowAddForm(false);
                  setNewBankName("");
                }}
                style={{ marginTop: "5px", backgroundColor: "#757575" }}
              >
                Cancel
              </Button>
            </form>
          </AddBankForm>
        )}

        {selectedBank && !showAddAccountForm && (
          <Button
            onClick={() => {
              console.log(
                "Add Account button clicked for bank:",
                selectedBank.name
              );
              setShowAddAccountForm(true);
            }}
            style={{ marginTop: "10px", backgroundColor: "#4caf50" }}
          >
            + Add Account
          </Button>
        )}

        {showAddAccountForm && (
          <AddBankForm>
            <form
              onSubmit={(e) => {
                console.log(
                  "Account form submitted:",
                  newAccountName,
                  newAccountType
                );
                handleAddAccount(e);
              }}
            >
              <Input
                type="text"
                placeholder="Account name"
                value={newAccountName}
                onChange={(e) => {
                  console.log("Account name changed to:", e.target.value);
                  setNewAccountName(e.target.value);
                }}
                autoFocus
              />
              <Select
                value={newAccountType}
                onChange={(e) => {
                  console.log("Account type changed to:", e.target.value);
                  setNewAccountType(e.target.value);
                }}
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit Card</option>
                <option value="investment">Investment</option>
              </Select>
              <Button type="submit" disabled={!newAccountName.trim()}>
                Add Account
              </Button>
              <Button
                type="button"
                onClick={() => {
                  console.log("Account form cancelled");
                  setShowAddAccountForm(false);
                  setNewAccountName("");
                  setNewAccountType("checking");
                }}
                style={{ marginTop: "5px", backgroundColor: "#757575" }}
              >
                Cancel
              </Button>
            </form>
          </AddBankForm>
        )}

        {selectedAccount && (
          <Button
            onClick={loadSampleData}
            style={{ marginTop: "10px", backgroundColor: "#ff9800" }}
          >
            Load Sample Data
          </Button>
        )}
      </Section>
    </SidebarContainer>
  );
}

export default Sidebar;
