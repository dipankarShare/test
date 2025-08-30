import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TransactionList from "./components/TransactionList";
import CSVImport from "./components/CSVImport";
import Analytics from "./components/Analytics";
import CategoryManager from "./components/CategoryManager";
import DesignSystemPreview from "./components/DesignSystemPreview";
import BackupManager from "./components/BackupManager";
import DataManager from "./components/DataManager";
import InvestmentPortfolio from "./components/InvestmentPortfolio";
import CreditCard from "./components/CreditCard";
import "./App.css";

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #0d1b2a;
  color: white;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

function App() {
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await fetch("http://localhost:8000/banks");
      const data = await response.json();
      setBanks(data);
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  return (
    <Router>
      <AppContainer>
        <Sidebar
          banks={banks}
          selectedBank={selectedBank}
          setSelectedBank={setSelectedBank}
          selectedAccount={selectedAccount}
          setSelectedAccount={setSelectedAccount}
          onBankAdded={fetchBanks}
        />
        <MainContent>
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  selectedBank={selectedBank}
                  selectedAccount={selectedAccount}
                />
              }
            />
            <Route
              path="/transactions"
              element={<TransactionList selectedAccount={selectedAccount} />}
            />
            <Route
              path="/import"
              element={<CSVImport selectedAccount={selectedAccount} />}
            />
            <Route
              path="/analytics"
              element={<Analytics selectedAccount={selectedAccount} />}
            />
            <Route
              path="/categories"
              element={<CategoryManager selectedAccount={selectedAccount} />}
            />
            <Route
              path="/backups"
              element={<BackupManager banks={banks} onRefresh={fetchBanks} />}
            />
            <Route path="/data-manager" element={<DataManager />} />
            <Route path="/investments" element={<InvestmentPortfolio />} />
            <Route path="/credit-cards" element={<CreditCard />} />

            {/* Design System Testing Routes */}
            <Route path="/design-preview" element={<DesignSystemPreview />} />
          </Routes>
        </MainContent>
      </AppContainer>
    </Router>
  );
}

export default App;
