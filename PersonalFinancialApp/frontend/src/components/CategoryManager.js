import React, { useState, useEffect } from "react";
import styled from "styled-components";

const Container = styled.div`
  padding: 20px;
  width: 100%;
  overflow-x: auto;
`;

const Title = styled.h1`
  color: #e0e1dd;
  margin-bottom: 30px;
`;

const Section = styled.div`
  background-color: #1b263b;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: #e0e1dd;
  margin-bottom: 15px;
`;

const Table = styled.table`
  width: 100%;
  background-color: #1b263b;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  table-layout: fixed;
  border-collapse: collapse;

  /* Ensure columns maintain their widths */
  & th,
  & td {
    box-sizing: border-box;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Force column widths to be respected */
  & tbody tr td {
    overflow: hidden;
  }

  /* Allow description column to wrap and show full text */
  & tbody tr td.description-cell {
    white-space: normal !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    overflow: visible !important;
    text-overflow: unset !important;
  }
`;

const Th = styled.th`
  background-color: #415a77;
  color: white;
  padding: 12px;
  text-align: left;
  position: relative;
  user-select: none;

  &.resizable {
    cursor: col-resize;
  }

  &.resizable::after {
    content: "";
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: transparent;
    cursor: col-resize;
  }

  &.resizable:hover::after {
    background: #00b4d8;
  }
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #415a77;
  color: #e0e1dd;
  box-sizing: border-box;

  &.description-cell {
    min-width: 300px;
    max-width: 400px;
    word-wrap: break-word !important;
    white-space: normal !important;
    overflow-wrap: break-word !important;
    overflow: visible !important;
  }

  &.note-cell {
    min-width: 150px;
    max-width: 200px;
    word-wrap: break-word;
    white-space: normal;
    overflow-wrap: break-word;
  }
`;

const Button = styled.button`
  background-color: ${(props) =>
    props.variant === "danger"
      ? "#dc3545"
      : props.variant === "success"
      ? "#28a745"
      : "#0077b6"};
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
  margin-bottom: 10px;

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #415a77;
  border-radius: 4px;
  background-color: #0d1b2a;
  color: white;
  margin-right: 10px;
  margin-bottom: 10px;

  &::placeholder {
    color: #778da9;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #415a77;
  border-radius: 4px;
  background-color: #0d1b2a;
  color: white;
  margin-right: 10px;
  margin-bottom: 10px;
`;

const Checkbox = styled.input`
  margin-right: 8px;
`;

const BatchControls = styled.div`
  background-color: #415a77;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
`;

function CategoryManager({ selectedAccount }) {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [newCategory, setNewCategory] = useState("");
  const [predefinedCategories, setPredefinedCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState({
    date: 100,
    description: 500,
    note: 200,
    amount: 80,
    category: 120,
  });

  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions();
      fetchCategories();
    }
    fetchPredefinedCategories();
  }, [selectedAccount]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/transactions/${selectedAccount.id}?limit=500`
      );
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/categories/${selectedAccount.id}`
      );
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchPredefinedCategories = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/predefined-categories"
      );
      const data = await response.json();
      setPredefinedCategories(data.flat || []);
    } catch (error) {
      console.error("Error fetching predefined categories:", error);
    }
  };

  const handleSelectTransaction = (transactionId) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map((t) => t.id)));
    }
  };

  const handleColumnResize = (column, newWidth) => {
    setColumnWidths((prev) => ({
      ...prev,
      [column]: Math.max(80, newWidth), // Minimum width of 80px
    }));
  };

  const handleBatchUpdate = async () => {
    if (selectedTransactions.size === 0 || !newCategory.trim()) {
      alert("Please select transactions and enter a category");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/batch-update-category",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transaction_ids: Array.from(selectedTransactions),
            category: newCategory.trim(),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setSelectedTransactions(new Set());
        setNewCategory("");
        fetchTransactions();
        fetchCategories();
      } else {
        alert("Error updating categories");
      }
    } catch (error) {
      console.error("Error updating categories:", error);
      alert("Error updating categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCategorizе = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/auto-categorize/${selectedAccount.id}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchTransactions();
        fetchCategories();
      } else {
        alert("Error auto-categorizing transactions");
      }
    } catch (error) {
      console.error("Error auto-categorizing:", error);
      alert("Error auto-categorizing transactions");
    } finally {
      setLoading(false);
    }
  };

  const filterByCategory = (category) => {
    return transactions.filter((t) => t.category === category);
  };

  if (!selectedAccount) {
    return (
      <Container>
        <Title>Category Manager</Title>
        <div style={{ textAlign: "center", color: "#778da9", padding: "50px" }}>
          Please select an account from the sidebar to manage categories
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Category Manager - {selectedAccount.name}</Title>

      <Section>
        <SectionTitle>Quick Actions</SectionTitle>
        <Button onClick={handleAutoCategorizе} disabled={loading}>
          {loading ? "Processing..." : "Auto-Categorize All"}
        </Button>
        <p style={{ color: "#778da9", fontSize: "14px", marginTop: "10px" }}>
          Automatically categorize uncategorized transactions based on similar
          descriptions
        </p>
      </Section>

      <Section>
        <SectionTitle>Category Summary</SectionTitle>
        {categories.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
            }}
          >
            {categories.map((category) => (
              <div
                key={category.name}
                style={{
                  background: "#415a77",
                  padding: "15px",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#00b4d8",
                  }}
                >
                  {category.count}
                </div>
                <div style={{ color: "#e0e1dd", fontSize: "14px" }}>
                  {category.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{ color: "#778da9", textAlign: "center", padding: "20px" }}
          >
            No categories used yet. Import transactions and start categorizing!
          </div>
        )}
      </Section>

      <Section>
        <SectionTitle>Suggested Categories</SectionTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "8px",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {predefinedCategories.slice(0, 30).map((category) => (
            <Button
              key={category}
              onClick={() => setNewCategory(category)}
              style={{
                fontSize: "12px",
                padding: "6px 10px",
                backgroundColor:
                  newCategory === category ? "#00b4d8" : "#415a77",
              }}
            >
              {category}
            </Button>
          ))}
        </div>
        <p style={{ color: "#778da9", fontSize: "12px", marginTop: "10px" }}>
          Click on a category to select it for batch update
        </p>
      </Section>

      <Section>
        <SectionTitle>Batch Category Update</SectionTitle>
        <BatchControls>
          <Button onClick={handleSelectAll}>
            {selectedTransactions.size === transactions.length
              ? "Deselect All"
              : "Select All"}
          </Button>
          <span style={{ color: "#e0e1dd" }}>
            {selectedTransactions.size} selected
          </span>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flex: 1,
            }}
          >
            <Input
              type="text"
              placeholder="New category name or select from dropdown"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              value=""
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ minWidth: "200px" }}
            >
              <option value="">Select predefined category</option>
              {predefinedCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
          <Button
            onClick={handleBatchUpdate}
            disabled={
              loading || selectedTransactions.size === 0 || !newCategory.trim()
            }
            variant="success"
          >
            Update Selected
          </Button>
        </BatchControls>
      </Section>

      <Section>
        <SectionTitle>Transactions ({transactions.length})</SectionTitle>
        {transactions.length === 0 ? (
          <div
            style={{ textAlign: "center", color: "#778da9", padding: "30px" }}
          >
            No transactions found
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>
                  <Checkbox
                    type="checkbox"
                    checked={
                      selectedTransactions.size === transactions.length &&
                      transactions.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </Th>
                <Th
                  style={{ width: `${columnWidths.date}px` }}
                  className="resizable"
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startWidth = columnWidths.date;
                    const handleMouseMove = (moveEvent) => {
                      const deltaX = moveEvent.clientX - startX;
                      handleColumnResize("date", startWidth + deltaX);
                    };
                    const handleMouseUp = () => {
                      document.removeEventListener(
                        "mousemove",
                        handleMouseMove
                      );
                      document.removeEventListener("mouseup", handleMouseUp);
                    };
                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                >
                  Date
                </Th>
                <Th
                  style={{ width: `${columnWidths.description}px` }}
                  className="resizable"
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startWidth = columnWidths.description;
                    const handleMouseMove = (moveEvent) => {
                      const deltaX = moveEvent.clientX - startX;
                      handleColumnResize("description", startWidth + deltaX);
                    };
                    const handleMouseUp = () => {
                      document.removeEventListener(
                        "mousemove",
                        handleMouseMove
                      );
                      document.removeEventListener("mouseup", handleMouseUp);
                    };
                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                >
                  Description
                </Th>
                <Th
                  style={{ width: `${columnWidths.note}px` }}
                  className="resizable"
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startWidth = columnWidths.note;
                    const handleMouseMove = (moveEvent) => {
                      const deltaX = moveEvent.clientX - startX;
                      handleColumnResize("note", startWidth + deltaX);
                    };
                    const handleMouseUp = () => {
                      document.removeEventListener(
                        "mousemove",
                        handleMouseMove
                      );
                      document.removeEventListener("mouseup", handleMouseUp);
                    };
                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                >
                  Note
                </Th>
                <Th
                  style={{ width: `${columnWidths.amount}px` }}
                  className="resizable"
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startWidth = columnWidths.amount;
                    const handleMouseMove = (moveEvent) => {
                      const deltaX = moveEvent.clientX - startX;
                      handleColumnResize("amount", startWidth + deltaX);
                    };
                    const handleMouseUp = () => {
                      document.removeEventListener(
                        "mousemove",
                        handleMouseMove
                      );
                      document.removeEventListener("mouseup", handleMouseUp);
                    };
                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                >
                  Amount
                </Th>
                <Th
                  style={{ width: `${columnWidths.category}px` }}
                  className="resizable"
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startWidth = columnWidths.category;
                    const handleMouseMove = (moveEvent) => {
                      const deltaX = moveEvent.clientX - startX;
                      handleColumnResize("category", startWidth + deltaX);
                    };
                    const handleMouseUp = () => {
                      document.removeEventListener(
                        "mousemove",
                        handleMouseMove
                      );
                      document.removeEventListener("mouseup", handleMouseUp);
                    };
                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                >
                  Category
                </Th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <Td>
                    <Checkbox
                      type="checkbox"
                      checked={selectedTransactions.has(transaction.id)}
                      onChange={() => handleSelectTransaction(transaction.id)}
                    />
                  </Td>
                  <Td style={{ width: `${columnWidths.date}px` }}>
                    {new Date(transaction.date).toLocaleDateString()}
                  </Td>
                  <Td
                    className="description-cell"
                    style={{ width: `${columnWidths.description}px` }}
                  >
                    {transaction.description}
                  </Td>
                  <Td
                    className="note-cell"
                    style={{ width: `${columnWidths.note}px` }}
                  >
                    {transaction.note || "—"}
                  </Td>
                  <Td
                    style={{
                      width: `${columnWidths.amount}px`,
                      color: transaction.amount >= 0 ? "#28a745" : "#dc3545",
                      fontWeight: "bold",
                    }}
                  >
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </Td>
                  <Td style={{ width: `${columnWidths.category}px` }}>
                    <span
                      style={{
                        background:
                          transaction.category === "Uncategorized"
                            ? "#6c757d"
                            : "#0077b6",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      {transaction.category}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
    </Container>
  );
}

export default CategoryManager;
