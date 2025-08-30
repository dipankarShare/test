import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { theme } from "../theme";

const CategoryContainer = styled.div`
  position: relative;
  width: 100%;
`;

const CategoryInput = styled.input`
  width: 100%;
  padding: ${theme.spacing[3]};
  border: 1px solid ${theme.colors.light.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.light.surface};
  color: ${theme.colors.light.text.primary};
  font-size: ${theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${theme.colors.primary[100]};
  }
`;

const CategoryDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${theme.colors.light.surface};
  border: 1px solid ${theme.colors.light.border};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${theme.shadows.lg};
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
`;

const CategoryGroup = styled.div`
  border-bottom: 1px solid ${theme.colors.light.border};

  &:last-child {
    border-bottom: none;
  }
`;

const CategoryGroupHeader = styled.div`
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  background: ${theme.colors.light.elevated};
  font-weight: ${theme.typography.fontWeight.semibold};
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.light.text.secondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background: ${theme.colors.light.border};
  }
`;

const CategoryItem = styled.div`
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  cursor: pointer;
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.light.text.primary};
  padding-left: ${(props) => theme.spacing[3] + props.level * 16}px;

  &:hover {
    background: ${theme.colors.primary[50]};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ExpandIcon = styled.span`
  transition: transform ${theme.transitions.normal};
  transform: ${(props) => (props.expanded ? "rotate(90deg)" : "rotate(0deg)")};
`;

function CategorySelector({
  value,
  onChange,
  placeholder = "Select category...",
}) {
  const [categories, setCategories] = useState({ hierarchy: {}, flat: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [filteredCategories, setFilteredCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = categories.flat.filter(
        (cat) =>
          cat.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories([]);
    }
  }, [searchTerm, categories]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
        const mainCategories = Object.keys(data.categories.hierarchy);
        const expanded = {};
        mainCategories.forEach((cat) => {
          expanded[cat] = true;
        });
        setExpandedGroups(expanded);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsOpen(true);
    if (!term) {
      onChange("");
    }
  };

  const clearSelection = () => {
    setSearchTerm("");
    onChange("");
    setIsOpen(false);
  };

  const handleCategorySelect = (category) => {
    onChange(category.value);
    setSearchTerm(""); // Clear search term after selection
    setIsOpen(false);
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const renderHierarchy = (hierarchy, level = 0) => {
    return Object.entries(hierarchy).map(([key, data]) => {
      const hasChildren = Object.keys(data.children).length > 0;
      const isExpanded = expandedGroups[key] || false;

      return (
        <div key={key}>
          {hasChildren ? (
            <CategoryGroupHeader onClick={() => toggleGroup(key)}>
              {data.display_name}
              <ExpandIcon expanded={(isExpanded || false).toString()}>
                ▶
              </ExpandIcon>
            </CategoryGroupHeader>
          ) : (
            <CategoryItem
              level={level}
              onClick={() =>
                handleCategorySelect({
                  value: data.path,
                  label: data.display_name,
                })
              }
            >
              {data.display_name}
            </CategoryItem>
          )}

          {hasChildren && (isExpanded || false) && (
            <div>{renderHierarchy(data.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const displayValue =
    value && !searchTerm
      ? categories.flat.find((cat) => cat.value === value)?.label || value
      : searchTerm;

  return (
    <CategoryContainer>
      <div style={{ position: "relative" }}>
        <CategoryInput
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
        />
        {(value || searchTerm) && (
          <button
            type="button"
            onClick={clearSelection}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: "#666",
              padding: "0",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <CategoryDropdown>
          {searchTerm && filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <CategoryItem
                key={category.value}
                level={0}
                onClick={() => handleCategorySelect(category)}
              >
                {category.label}
              </CategoryItem>
            ))
          ) : searchTerm && filteredCategories.length === 0 ? (
            <CategoryItem level={0}>
              No categories found matching "{searchTerm}"
            </CategoryItem>
          ) : (
            <CategoryGroup>
              {renderHierarchy(categories.hierarchy)}
            </CategoryGroup>
          )}
        </CategoryDropdown>
      )}
    </CategoryContainer>
  );
}

export default CategorySelector;
