import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Plot from 'react-plotly.js';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardSubtitle,
  Title, 
  Text, 
  Grid, 
  Flex,
  Badge,
  FadeIn,
  Spinner
} from './ui';
import { theme } from '../theme';

const ChartCard = styled(Card)`
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${theme.colors.primary[500]}, ${theme.colors.primary[400]});
  }
`;

const StatsCard = styled(Card)`
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${theme.colors.success[500]}, ${theme.colors.success[400]});
  }
`;

const StatValue = styled.div`
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.primary[400]};
  margin-bottom: ${theme.spacing[2]};
  line-height: 1;
`;

const StatLabel = styled.div`
  color: ${theme.colors.light.text.muted};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const EmptyStateCard = styled(Card)`
  text-align: center;
  padding: ${theme.spacing[12]} ${theme.spacing[6]};
  background: linear-gradient(135deg, ${theme.colors.light.surface} 0%, ${theme.colors.light.elevated} 100%);
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

function Analytics({ selectedAccount }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAccount) {
      fetchAnalytics();
    }
  }, [selectedAccount]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/analytics/${selectedAccount.id}`);
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary stats
  const getSummaryStats = () => {
    if (!analyticsData) return null;
    
    const totalSpending = analyticsData.monthly_spending.reduce((sum, item) => sum + item.amount, 0);
    const avgMonthlySpending = totalSpending / Math.max(analyticsData.monthly_spending.length, 1);
    const topCategory = analyticsData.categories.length > 0 
      ? analyticsData.categories.reduce((max, cat) => cat.amount > max.amount ? cat : max)
      : null;
    
    return {
      totalSpending,
      avgMonthlySpending,
      topCategory,
      monthsTracked: analyticsData.monthly_spending.length,
      categoriesCount: analyticsData.categories.length
    };
  };

  const stats = getSummaryStats();

  if (!selectedAccount) {
    return (
      <FadeIn>
        <Title>Financial Analytics</Title>
        <EmptyStateCard>
          <IconWrapper>📊</IconWrapper>
          <Text size="xl" weight="semibold" noMargin>No Account Selected</Text>
          <Text variant="muted" style={{ marginTop: theme.spacing[2] }}>
            Please select an account from the sidebar to view detailed analytics and insights
          </Text>
        </EmptyStateCard>
      </FadeIn>
    );
  }

  if (loading) {
    return (
      <FadeIn>
        <Flex align="center" justify="space-between" style={{ marginBottom: theme.spacing[8] }}>
          <div>
            <Title>Analytics • {selectedAccount.name}</Title>
            <Text variant="muted" size="lg">Loading your financial insights...</Text>
          </div>
          <Badge variant="info">Analyzing</Badge>
        </Flex>
        
        <Card style={{ textAlign: 'center', padding: theme.spacing[12] }}>
          <Spinner size="lg" />
          <Text style={{ marginTop: theme.spacing[4] }}>
            Crunching your transaction data...
          </Text>
        </Card>
      </FadeIn>
    );
  }

  if (!analyticsData || (analyticsData.monthly_spending.length === 0 && analyticsData.categories.length === 0)) {
    return (
      <FadeIn>
        <Flex align="center" justify="space-between" style={{ marginBottom: theme.spacing[8] }}>
          <div>
            <Title>Analytics • {selectedAccount.name}</Title>
            <Text variant="muted" size="lg">Ready to analyze your spending patterns</Text>
          </div>
          <Badge variant="warning">No Data</Badge>
        </Flex>
        
        <EmptyStateCard>
          <IconWrapper>📈</IconWrapper>
          <Text size="xl" weight="semibold" noMargin>No Transaction Data</Text>
          <Text variant="muted" style={{ marginTop: theme.spacing[2] }}>
            Import transactions to unlock powerful analytics and spending insights
          </Text>
        </EmptyStateCard>
      </FadeIn>
    );
  }

  const monthlySpendingChart = {
    data: [{
      x: analyticsData.monthly_spending.map(item => item.month),
      y: analyticsData.monthly_spending.map(item => item.amount),
      type: 'bar',
      marker: {
        color: theme.colors.primary[500],
        line: {
          color: theme.colors.primary[600],
          width: 1
        }
      },
      hovertemplate: '<b>%{x}</b><br>Spending: $%{y:,.2f}<extra></extra>'
    }],
    layout: {
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { 
        color: theme.colors.light.text.primary,
        family: theme.typography.fontFamily.sans
      },
      xaxis: {
        gridcolor: theme.colors.light.border,
        color: theme.colors.light.text.primary,
        showgrid: true,
        gridwidth: 1
      },
      yaxis: {
        gridcolor: theme.colors.light.border,
        color: theme.colors.light.text.primary,
        showgrid: true,
        gridwidth: 1,
        tickformat: '$,.0f'
      },
      margin: { t: 20, r: 20, b: 40, l: 60 },
      hoverlabel: {
        bgcolor: theme.colors.light.surface,
        bordercolor: theme.colors.light.border,
        font: { color: theme.colors.light.text.primary }
      }
    },
    config: {
      displayModeBar: false,
      responsive: true
    }
  };

  const categoryChart = {
    data: [{
      labels: analyticsData.categories.map(item => item.category),
      values: analyticsData.categories.map(item => item.amount),
      type: 'pie',
      marker: {
        colors: [
          theme.colors.primary[500],
          theme.colors.success[500],
          theme.colors.warning[500],
          theme.colors.error[500],
          theme.colors.info[500],
          theme.colors.neutral[500]
        ],
        line: {
          color: theme.colors.light.surface,
          width: 2
        }
      },
      textinfo: 'label+percent',
      textposition: 'outside',
      hovertemplate: '<b>%{label}</b><br>Amount: $%{value:,.2f}<br>Percentage: %{percent}<extra></extra>'
    }],
    layout: {
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { 
        color: theme.colors.light.text.primary,
        family: theme.typography.fontFamily.sans
      },
      margin: { t: 20, r: 20, b: 20, l: 20 },
      showlegend: false,
      hoverlabel: {
        bgcolor: theme.colors.light.surface,
        bordercolor: theme.colors.light.border,
        font: { color: theme.colors.light.text.primary }
      }
    },
    config: {
      displayModeBar: false,
      responsive: true
    }
  };

  return (
    <FadeIn>
      {/* Header */}
      <Flex align="center" justify="space-between" style={{ marginBottom: theme.spacing[8] }}>
        <div>
          <Title>Analytics • {selectedAccount.name}</Title>
          <Text variant="muted" size="lg">
            Insights from {stats.monthsTracked} months of transaction data
          </Text>
        </div>
        <Badge variant="success">Active</Badge>
      </Flex>

      {/* Summary Stats */}
      <Grid columns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} style={{ marginBottom: theme.spacing[8] }}>
        <FadeIn style={{ animationDelay: '100ms' }}>
          <StatsCard>
            <StatValue>${stats.totalSpending.toFixed(2)}</StatValue>
            <StatLabel>Total Spending</StatLabel>
          </StatsCard>
        </FadeIn>
        
        <FadeIn style={{ animationDelay: '200ms' }}>
          <StatsCard>
            <StatValue>${stats.avgMonthlySpending.toFixed(2)}</StatValue>
            <StatLabel>Avg Monthly</StatLabel>
          </StatsCard>
        </FadeIn>
        
        <FadeIn style={{ animationDelay: '300ms' }}>
          <StatsCard>
            <StatValue>{stats.topCategory?.category || 'N/A'}</StatValue>
            <StatLabel>Top Category</StatLabel>
          </StatsCard>
        </FadeIn>
        
        <FadeIn style={{ animationDelay: '400ms' }}>
          <StatsCard>
            <StatValue>{stats.categoriesCount}</StatValue>
            <StatLabel>Categories</StatLabel>
          </StatsCard>
        </FadeIn>
      </Grid>

      {/* Charts */}
      <Grid columns="1fr" gap={6}>
        {analyticsData.monthly_spending.length > 0 && (
          <FadeIn style={{ animationDelay: '500ms' }}>
            <ChartCard>
              <CardHeader>
                <CardTitle>Monthly Spending Trends</CardTitle>
                <CardSubtitle>
                  Track your spending patterns over time
                </CardSubtitle>
              </CardHeader>
              <div style={{ height: '400px' }}>
                <Plot
                  data={monthlySpendingChart.data}
                  layout={monthlySpendingChart.layout}
                  config={monthlySpendingChart.config}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
                />
              </div>
            </ChartCard>
          </FadeIn>
        )}

        {analyticsData.categories.length > 0 && (
          <FadeIn style={{ animationDelay: '600ms' }}>
            <ChartCard>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardSubtitle>
                  See where your money goes across different categories
                </CardSubtitle>
              </CardHeader>
              <div style={{ height: '400px' }}>
                <Plot
                  data={categoryChart.data}
                  layout={categoryChart.layout}
                  config={categoryChart.config}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
                />
              </div>
            </ChartCard>
          </FadeIn>
        )}
      </Grid>

      {/* Category Details */}
      {analyticsData.categories.length > 0 && (
        <FadeIn style={{ animationDelay: '700ms' }}>
          <Card style={{ marginTop: theme.spacing[8] }}>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardSubtitle>Detailed spending by category</CardSubtitle>
            </CardHeader>
            
            <Grid columns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
              {analyticsData.categories.map((category, index) => (
                <FadeIn key={category.category} style={{ animationDelay: `${800 + index * 50}ms` }}>
                  <Card style={{ 
                    background: theme.colors.light.elevated,
                    border: `1px solid ${theme.colors.light.border}`
                  }}>
                    <Flex align="center" justify="space-between">
                      <div>
                        <Text weight="semibold" noMargin>{category.category}</Text>
                        <Text variant="muted" size="sm" noMargin style={{ marginTop: theme.spacing[1] }}>
                          {((category.amount / stats.totalSpending) * 100).toFixed(1)}% of total
                        </Text>
                      </div>
                      <Text size="lg" weight="bold" color="primary">
                        ${category.amount.toFixed(2)}
                      </Text>
                    </Flex>
                  </Card>
                </FadeIn>
              ))}
            </Grid>
          </Card>
        </FadeIn>
      )}
    </FadeIn>
  );
}

export default Analytics;