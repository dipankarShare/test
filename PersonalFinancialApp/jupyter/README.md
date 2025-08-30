# 📊 Jupyter Notebook Guide for Personal Finance Analytics

## 🚀 How to Start Jupyter

### Option 1: Using Docker (Recommended)
```bash
# Start all services including Jupyter
docker-compose up -d

# Access Jupyter at: http://localhost:8888
# Token: finance123
```

### Option 2: Direct Access
```bash
# If Jupyter is already running
open http://localhost:8888
```

## 📚 Available Notebooks

### 1. **Personal_Finance_Analytics_Example.ipynb** 
**🎯 Complete financial analysis example**
- Financial overview dashboard
- Category analysis with hierarchical data
- Time-based spending patterns
- Budget vs actual analysis
- Advanced analytics and insights
- Financial health scoring

### 2. **Financial_Analysis.ipynb**
**📈 Basic analysis template**
- Simple charts and graphs
- Monthly trends
- Category breakdowns

## 🔧 What You Can Do

### 📊 **Data Analysis**
- Load your transaction data from the SQLite database
- Analyze spending patterns by category, time, and account
- Create interactive visualizations with Plotly
- Generate financial reports and insights

### 📈 **Visualizations**
- **Interactive Charts**: Plotly-based dashboards
- **Time Series**: Monthly/daily spending trends
- **Category Analysis**: Pie charts, bar charts, heatmaps
- **Budget Tracking**: Actual vs planned spending

### 🎯 **Financial Insights**
- **Savings Rate**: Track your savings percentage
- **Spending Patterns**: Identify trends and anomalies
- **Budget Analysis**: Compare actual vs recommended spending
- **Financial Health Score**: Overall financial wellness metric

## 📋 Step-by-Step Usage

### 1. **Start Jupyter**
```bash
docker-compose up -d
# Go to http://localhost:8888 (token: finance123)
```

### 2. **Open the Example Notebook**
- Click on `Personal_Finance_Analytics_Example.ipynb`
- This contains a complete analysis workflow

### 3. **Run the Analysis**
- Click "Run All" or run cells one by one
- The notebook will:
  - Connect to your finance database
  - Load your transaction data
  - Generate interactive visualizations
  - Provide financial insights and recommendations

### 4. **Customize for Your Needs**
- Modify budget percentages in the budget analysis section
- Add your own analysis cells
- Create custom visualizations
- Export results as HTML or PDF

## 🗄️ Database Access

The notebook connects to your finance database at `data/finance.db` and can access:

- **Transactions**: All your financial transactions
- **Categories**: Hierarchical category system
- **Accounts**: Bank accounts and balances
- **Predefined Categories**: 60+ professional finance categories

## 📊 Example Analyses

### Financial Dashboard
```python
# Quick financial overview
total_income = df[df['amount'] > 0]['amount'].sum()
total_expenses = df[df['amount'] < 0]['amount'].sum()
savings_rate = (total_income + total_expenses) / total_income * 100
```

### Category Analysis
```python
# Top spending categories
category_spending = df[df['amount'] < 0].groupby('category')['amount'].sum().abs()
top_categories = category_spending.sort_values(ascending=False).head(10)
```

### Time Trends
```python
# Monthly spending trends
monthly_spending = df.groupby(df['date'].dt.to_period('M'))['amount'].sum()
```

## 🎨 Visualization Examples

### Interactive Pie Chart
```python
import plotly.express as px
fig = px.pie(values=category_spending.values, names=category_spending.index)
fig.show()
```

### Time Series Plot
```python
fig = px.line(x=monthly_data.index, y=monthly_data.values, title='Monthly Trends')
fig.show()
```

## 💡 Pro Tips

### 🔄 **Regular Analysis**
- Run the notebook monthly to track progress
- Compare current month vs previous months
- Identify seasonal spending patterns

### 📈 **Custom Metrics**
- Create your own financial KPIs
- Set up automated alerts for unusual spending
- Track progress toward financial goals

### 🎯 **Budget Optimization**
- Use the budget analysis to identify overspending
- Adjust budget allocations based on actual patterns
- Set realistic savings targets

### 📊 **Data Quality**
- Review uncategorized transactions
- Use consistent category names
- Import historical data for better trends

## 🚨 Troubleshooting

### Database Connection Issues
```python
# Check if database exists
import os
print(os.path.exists('data/finance.db'))

# Verify tables
import sqlite3
conn = sqlite3.connect('data/finance.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print(cursor.fetchall())
```

### Missing Data
- Make sure you've imported transactions via the web app
- Check that accounts and banks are set up
- Verify category assignments

### Visualization Issues
- Ensure Plotly is installed: `pip install plotly`
- For static plots, use matplotlib: `plt.show()`
- Check data types: `df.dtypes`

## 🔗 Integration with Web App

The Jupyter notebook works seamlessly with your web application:

1. **Import data** via the web app's CSV import feature
2. **Categorize transactions** using the Category Manager
3. **Analyze data** in Jupyter notebooks
4. **Apply insights** back to your budgeting in the web app

This creates a powerful workflow for comprehensive financial management!

---

**🎉 Happy Analyzing!** Your financial data is now ready for deep insights and beautiful visualizations.