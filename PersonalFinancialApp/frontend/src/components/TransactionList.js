import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import {
  Card,
  CardHeader,
  CardTitle,
  CardSubtitle,
  Title,
  Text,
  Flex,
  Badge,
  FadeIn,
  Input,
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "./ui";
import CategorySelector from "./CategorySelector";
import { theme } from "../theme";

const FilterCard = styled(Card)`
  margin-bottom: ${theme.spacing[6]};
`;

const SortableHeader = styled(TableHeader)`
  cursor: pointer;
  user-select: none;
  position: relative;
  transition: all ${theme.transitions.fast};

  &:hover {
    background-color: ${theme.colors.light.border};
  }

  &::after {
    content: "${(props) =>
      props.sorted === "asc" ? "↑" : props.sorted === "desc" ? "↓" : "↕"}";
    position: absolute;
    right: 12px;
    opacity: ${(props) => (props.sorted ? 1 : 0.4)};
    font-size: 14px;
    font-weight: bold;
  }
`;

const AmountCell = styled(TableCell)`
  color: ${(props) =>
    props.amount >= 0 ? theme.colors.success[600] : theme.colors.error[600]};
  font-weight: ${theme.typography.fontWeight.semibold};
  text-align: right;
  font-family: ${theme.typography.fontFamily.mono.join(", ")};
`;

const EmptyStateCard = styled(Card)`
  text-align: center;
  padding: ${theme.spacing[12]} ${theme.spacing[6]};
  background: linear-gradient(
    135deg,
    ${theme.colors.light.surface} 0%,
    ${theme.colors.light.elevated} 100%
  );
  border: 2px dashed ${theme.colors.light.border};
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.primary[500]}20;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${theme.spacing[4]};
  font-size: 32px;
`;

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[4]};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing[3]};
  }
`;

const FilterRow2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto auto;
  gap: ${theme.spacing[4]};
  align-items: end;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing[3]};
  }
`;

const ClearButton = styled.button`
  background: ${theme.colors.light.elevated};
  border: 1px solid ${theme.colors.light.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  color: ${theme.colors.light.text.muted};
  cursor: pointer;
  transition: all ${theme.transitions.fast};
  font-size: ${theme.typography.fontSize.sm};

  &:hover {
    background: ${theme.colors.light.border};
    color: ${theme.colors.light.text.primary};
  }
`;

function TransactionList({ selectedAccount }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter and sort states
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  // Batch editing states
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchCategory, setBatchCategory] = useState("");

  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions();
    }
  }, [selectedAccount]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/transactions/${selectedAccount.id}?limit=1000`
      );
      const data = await response.json();
      console.log(
        `📊 Loaded ${data.length} transactions for account ${selectedAccount.name}`
      );
      console.log(
        `📊 Sample transactions:`,
        data.slice(0, 3).map((t) => ({
          description: t.description.substring(0, 30) + "...",
          category: t.category,
          amount: t.amount,
        }))
      );
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Fuzzy search function for descriptions
  const fuzzyMatch = (text, searchTerm) => {
    if (!searchTerm) return true;
    if (!text) return false;

    const textLower = text.toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    // Exact match
    if (textLower.includes(searchLower)) return true;

    // Fuzzy matching - check if all characters of search term exist in order
    let searchIndex = 0;
    for (
      let i = 0;
      i < textLower.length && searchIndex < searchLower.length;
      i++
    ) {
      if (textLower[i] === searchLower[searchIndex]) {
        searchIndex++;
      }
    }

    return searchIndex === searchLower.length;
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    // Debug: Log the current category search value
    if (categorySearch) {
      console.log(
        `🔍 Starting filter with categorySearch: "${categorySearch}"`
      );
      console.log(`🔍 Total transactions to filter: ${transactions.length}`);
    }

    let filtered = transactions.filter((transaction) => {
      // Fuzzy description search
      const descriptionMatch =
        !descriptionSearch ||
        fuzzyMatch(transaction.description, descriptionSearch) ||
        (transaction.note && fuzzyMatch(transaction.note, descriptionSearch));

      // Enhanced category search - handle both simple names and full paths
      const categoryMatch =
        !categorySearch ||
        (transaction.category &&
          // Direct match (e.g., "Mortgage" matches "Mortgage")
          (transaction.category
            .toLowerCase()
            .includes(categorySearch.toLowerCase()) ||
            // Extract last part of full path (e.g., "Expenses:Housing:Mortgage" -> "Mortgage")
            categorySearch
              .toLowerCase()
              .includes(transaction.category.toLowerCase()) ||
            // Handle partial matches in full paths
            (categorySearch.includes(":") &&
              categorySearch.split(":").pop().toLowerCase() ===
                transaction.category.toLowerCase())));

      // Debug logging for category search
      if (categorySearch && transaction.category) {
        console.log(
          `Category Debug: Search="${categorySearch}", Transaction="${transaction.category}", Match=${categoryMatch}`
        );
      }

      // Additional debugging for all transactions
      if (categorySearch) {
        console.log(
          `Filtering transaction: "${transaction.description}" | Category: "${transaction.category}" | Match: ${categoryMatch}`
        );
      }

      // Date range filter
      const transactionDate = new Date(transaction.date);
      const startMatch = !startDate || transactionDate >= new Date(startDate);
      const endMatch = !endDate || transactionDate <= new Date(endDate);

      // Amount range filter
      const minMatch =
        !minAmount || Math.abs(transaction.amount) >= parseFloat(minAmount);
      const maxMatch =
        !maxAmount || Math.abs(transaction.amount) <= parseFloat(maxAmount);

      return (
        descriptionMatch &&
        categoryMatch &&
        startMatch &&
        endMatch &&
        minMatch &&
        maxMatch
      );
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "date":
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case "description":
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case "amount":
          aValue = Math.abs(a.amount);
          bValue = Math.abs(b.amount);
          break;
        case "category":
          aValue = (a.category || "").toLowerCase();
          bValue = (b.category || "").toLowerCase();
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    // Debug logging for filtering results
    if (categorySearch) {
      console.log(`=== Filtering Results ===`);
      console.log(`Total transactions: ${transactions.length}`);
      console.log(`Filtered transactions: ${filtered.length}`);
      console.log(`Category search term: "${categorySearch}"`);

      // Show sample of what was filtered
      const sampleFiltered = filtered.slice(0, 5);
      console.log(
        `Sample filtered transactions:`,
        sampleFiltered.map((t) => ({
          description: t.description.substring(0, 30) + "...",
          category: t.category,
          amount: t.amount,
        }))
      );
    }

    return filtered;
  }, [
    transactions,
    descriptionSearch,
    categorySearch,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setDescriptionSearch("");
    setCategorySearch("");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
  };

  // Batch editing functions
  const toggleBatchMode = () => {
    setIsBatchMode(!isBatchMode);
    if (isBatchMode) {
      setSelectedTransactions(new Set());
      setBatchCategory("");
    }
  };

  const toggleTransactionSelection = (transactionId) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const selectAllTransactions = () => {
    if (selectedTransactions.size === filteredAndSortedTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(
        new Set(filteredAndSortedTransactions.map((t) => t.id))
      );
    }
  };

  const selectUncategorizedTransactions = () => {
    const uncategorizedIds = filteredAndSortedTransactions
      .filter((t) => !t.category || t.category === "Uncategorized")
      .map((t) => t.id);

    if (uncategorizedIds.length === 0) {
      alert("No uncategorized transactions found in the current view.");
      return;
    }

    setSelectedTransactions(new Set(uncategorizedIds));
  };

  const applyBatchCategory = async () => {
    if (selectedTransactions.size === 0 || !batchCategory) return;

    try {
      const updates = Array.from(selectedTransactions).map((transactionId) => ({
        id: transactionId,
        category: batchCategory,
      }));

      // Update each transaction
      for (const update of updates) {
        const response = await fetch(
          `http://localhost:8000/transactions/${update.id}/category`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: update.category }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update transaction ${update.id}`);
        }
      }

      // Refresh transactions and clear batch mode
      await fetchTransactions();
      setSelectedTransactions(new Set());
      setBatchCategory("");
      setIsBatchMode(false);

      alert(
        `Successfully updated ${updates.length} transactions to category: ${batchCategory}`
      );
    } catch (error) {
      console.error("Error updating transactions:", error);
      alert("Error updating transactions. Please try again.");
    }
  };

  const getSortIndicator = (field) => {
    if (sortField === field) {
      return sortDirection;
    }
    return null;
  };

  if (!selectedAccount) {
    return (
      <FadeIn>
        <Title>Transactions</Title>
        <EmptyStateCard>
          <IconWrapper>💳</IconWrapper>
          <Text size="xl" weight="semibold" noMargin>
            No Account Selected
          </Text>
          <Text variant="muted" style={{ marginTop: theme.spacing[2] }}>
            Please select an account from the sidebar to view transactions
          </Text>
        </EmptyStateCard>
      </FadeIn>
    );
  }

  if (loading) {
    return (
      <FadeIn>
        <Flex
          align="center"
          justify="space-between"
          style={{ marginBottom: theme.spacing[8] }}
        >
          <div>
            <Title>Transactions • {selectedAccount.name}</Title>
            <Text variant="muted" size="lg">
              Loading your transaction history...
            </Text>
          </div>
          <Badge variant="info">Loading</Badge>
        </Flex>

        <Card style={{ textAlign: "center", padding: theme.spacing[12] }}>
          <Text>Loading transactions...</Text>
        </Card>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      {/* Header */}
      <Flex
        align="center"
        justify="space-between"
        style={{ marginBottom: theme.spacing[6] }}
      >
        <div>
          <Title>Transactions • {selectedAccount.name}</Title>
          <Text variant="muted" size="lg">
            {filteredAndSortedTransactions.length} of {transactions.length}{" "}
            transactions
          </Text>
        </div>
        <Badge variant="success">{transactions.length} Total</Badge>
      </Flex>

      {/* Filters */}
      <FilterCard>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardSubtitle>
            Find specific transactions by date, amount, or description
          </CardSubtitle>
        </CardHeader>

        {/* Search Row */}
        <FilterRow>
          <div>
            <Text weight="medium" style={{ marginBottom: theme.spacing[2] }}>
              Description Search (Fuzzy)
            </Text>
            <Input
              type="text"
              placeholder="Search in description and notes..."
              value={descriptionSearch}
              onChange={(e) => setDescriptionSearch(e.target.value)}
            />
          </div>

          <div>
            <Text weight="medium" style={{ marginBottom: theme.spacing[2] }}>
              Category Search
            </Text>
            <CategorySelector
              value={categorySearch}
              onChange={(value) => {
                console.log(
                  `🎯 CategorySelector onChange called with: "${value}"`
                );
                setCategorySearch(value);
              }}
              placeholder="Search categories..."
            />
          </div>
        </FilterRow>

        {/* Filter Row */}
        <FilterRow2>
          <div>
            <Text weight="medium" style={{ marginBottom: theme.spacing[2] }}>
              Start Date
            </Text>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <Text weight="medium" style={{ marginBottom: theme.spacing[2] }}>
              End Date
            </Text>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div>
            <Text weight="medium" style={{ marginBottom: theme.spacing[2] }}>
              Amount Range
            </Text>
            <Flex gap={2}>
              <Input
                type="number"
                placeholder="Min"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                style={{ width: "80px" }}
              />
              <Input
                type="number"
                placeholder="Max"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                style={{ width: "80px" }}
              />
            </Flex>
          </div>

          <ClearButton onClick={clearFilters}>Clear All</ClearButton>
          <button
            onClick={toggleBatchMode}
            style={{
              background: isBatchMode
                ? theme.colors.error[600]
                : theme.colors.primary[600],
              color: "white",
              border: "none",
              borderRadius: theme.borderRadius.md,
              padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {isBatchMode ? "Exit Batch Mode" : "Batch Edit Categories"}
          </button>
        </FilterRow2>
      </FilterCard>

      {/* Batch Editing Controls */}
      {isBatchMode && (
        <Card style={{ marginBottom: theme.spacing[4] }}>
          <CardHeader>
            <CardTitle>Batch Category Editor</CardTitle>
            <CardSubtitle>
              {selectedTransactions.size} transaction(s) selected
            </CardSubtitle>
          </CardHeader>
          <div style={{ padding: theme.spacing[4] }}>
            <Flex
              gap={4}
              align="center"
              style={{ marginBottom: theme.spacing[4] }}
            >
              <div style={{ flex: 1 }}>
                <Text
                  weight="medium"
                  style={{ marginBottom: theme.spacing[2] }}
                >
                  New Category
                </Text>
                <CategorySelector
                  value={batchCategory}
                  onChange={setBatchCategory}
                  placeholder="Select new category..."
                />
              </div>
              <button
                onClick={applyBatchCategory}
                disabled={selectedTransactions.size === 0 || !batchCategory}
                style={{
                  background: theme.colors.primary[600],
                  color: "white",
                  border: "none",
                  borderRadius: theme.borderRadius.md,
                  padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
                  cursor:
                    selectedTransactions.size > 0 && batchCategory
                      ? "pointer"
                      : "not-allowed",
                  fontWeight: "600",
                  opacity:
                    selectedTransactions.size > 0 && batchCategory ? 1 : 0.6,
                }}
              >
                Apply to {selectedTransactions.size} Transaction(s)
              </button>
            </Flex>

            {/* Selection Options */}
            <Flex
              gap={3}
              align="center"
              style={{
                borderTop: `1px solid ${theme.colors.light.border}`,
                paddingTop: theme.spacing[4],
              }}
            >
              <Text size="sm" variant="muted" weight="medium">
                Quick Selection:
              </Text>
              <button
                onClick={selectAllTransactions}
                style={{
                  background: theme.colors.light.elevated,
                  color: theme.colors.light.text.primary,
                  border: `1px solid ${theme.colors.light.border}`,
                  borderRadius: theme.borderRadius.sm,
                  padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {selectedTransactions.size ===
                filteredAndSortedTransactions.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <button
                onClick={selectUncategorizedTransactions}
                style={{
                  background: theme.colors.warning[100],
                  color: theme.colors.warning[700],
                  border: `1px solid ${theme.colors.warning[300]}`,
                  cursor: "pointer",
                  borderRadius: theme.borderRadius.sm,
                  padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Select Uncategorized
              </button>
              <Text size="sm" variant="muted">
                {
                  filteredAndSortedTransactions.filter(
                    (t) => !t.category || t.category === "Uncategorized"
                  ).length
                }{" "}
                uncategorized
              </Text>
            </Flex>
          </div>
        </Card>
      )}

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <EmptyStateCard>
          <IconWrapper>📊</IconWrapper>
          <Text size="xl" weight="semibold" noMargin>
            No Transactions Found
          </Text>
          <Text variant="muted" style={{ marginTop: theme.spacing[2] }}>
            Import a CSV file to get started with your transaction history
          </Text>
        </EmptyStateCard>
      ) : filteredAndSortedTransactions.length === 0 ? (
        <EmptyStateCard>
          <IconWrapper>🔍</IconWrapper>
          <Text size="xl" weight="semibold" noMargin>
            No Matching Transactions
          </Text>
          <Text variant="muted" style={{ marginTop: theme.spacing[2] }}>
            Try adjusting your search criteria or clearing the filters
          </Text>
        </EmptyStateCard>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                {isBatchMode && (
                  <TableHeader style={{ width: "50px" }}>
                    <input
                      type="checkbox"
                      checked={
                        selectedTransactions.size ===
                          filteredAndSortedTransactions.length &&
                        filteredAndSortedTransactions.length > 0
                      }
                      onChange={selectAllTransactions}
                      style={{ cursor: "pointer" }}
                    />
                  </TableHeader>
                )}
                <SortableHeader
                  onClick={() => handleSort("date")}
                  sorted={getSortIndicator("date")}
                >
                  Date
                </SortableHeader>
                <SortableHeader
                  onClick={() => handleSort("description")}
                  sorted={getSortIndicator("description")}
                >
                  Description
                </SortableHeader>
                <TableHeader>Note</TableHeader>
                <SortableHeader
                  onClick={() => handleSort("category")}
                  sorted={getSortIndicator("category")}
                >
                  Category
                </SortableHeader>
                <SortableHeader
                  onClick={() => handleSort("amount")}
                  sorted={getSortIndicator("amount")}
                >
                  Amount
                </SortableHeader>
              </TableRow>
            </TableHead>
            <tbody>
              {filteredAndSortedTransactions.map((transaction, index) => (
                <TableRow key={transaction.id}>
                  {isBatchMode && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedTransactions.has(transaction.id)}
                        onChange={() =>
                          toggleTransactionSelection(transaction.id)
                        }
                        style={{ cursor: "pointer" }}
                      />
                    </TableCell>
                  )}
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.note || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {transaction.category || "Uncategorized"}
                    </Badge>
                  </TableCell>
                  <AmountCell amount={transaction.amount}>
                    {formatAmount(transaction.amount)}
                  </AmountCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </FadeIn>
  );
}

export default TransactionList;
