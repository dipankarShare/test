import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardSubtitle,
  Title, 
  Text, 
  Button, 
  Grid, 
  Flex,
  Badge,
  FadeIn
} from './ui';
import { theme } from '../theme';
import styled from 'styled-components';

// Custom styled components for dashboard-specific needs
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
    background: linear-gradient(90deg, ${theme.colors.primary[500]}, ${theme.colors.primary[400]});
  }
`;

const StatValue = styled.div`
  font-size: ${theme.typography.fontSize['3xl']};
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

const WelcomeCard = styled(Card)`
  background: linear-gradient(135deg, ${theme.colors.light.surface} 0%, ${theme.colors.light.elevated} 100%);
  border: 1px solid ${theme.colors.primary[500]}20;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, ${theme.colors.primary[500]}, ${theme.colors.primary[400]}, ${theme.colors.primary[600]});
  }
`;

const QuickActionCard = styled(Card)`
  cursor: pointer;
  transition: all ${theme.transitions.normal};
  border: 1px solid ${theme.colors.light.border};
  
  &:hover {
    border-color: ${theme.colors.primary[500]};
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.xl};
  }
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${theme.borderRadius.xl};
  background: ${props => props.color || theme.colors.primary[500]}20;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing[4]};
  font-size: 24px;
`;

function Dashboard({ selectedBank, selectedAccount }) {
  const setupDemo = async () => {
    try {
      const response = await fetch('http://localhost:8000/setup-demo', {
        method: 'POST',
      });
      if (response.ok) {
        alert('Demo data created! Please refresh the page to see the new bank and account.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error setting up demo:', error);
      alert('Error setting up demo data');
    }
  };

  // Use real data when available, fallback to mock data for display
  const stats = selectedAccount ? [
    { label: 'Total Balance', value: `$${selectedAccount.balance.toFixed(2)}`, change: '+2.5%', trend: 'up' },
    { label: 'Monthly Income', value: '$5,200.00', change: '+8.1%', trend: 'up' },
    { label: 'Monthly Expenses', value: '$3,180.00', change: '-1.2%', trend: 'down' },
    { label: 'Savings Rate', value: '38.8%', change: '+5.3%', trend: 'up' },
  ] : [
    { label: 'Total Balance', value: '$12,450.00', change: '+2.5%', trend: 'up' },
    { label: 'Monthly Income', value: '$5,200.00', change: '+8.1%', trend: 'up' },
    { label: 'Monthly Expenses', value: '$3,180.00', change: '-1.2%', trend: 'down' },
    { label: 'Savings Rate', value: '38.8%', change: '+5.3%', trend: 'up' },
  ];

  const quickActions = [
    { 
      title: 'Import Transactions', 
      description: 'Upload CSV files', 
      icon: '📊', 
      color: theme.colors.primary[500],
      path: '/import'
    },
    { 
      title: 'Categorize', 
      description: 'Organize expenses', 
      icon: '🏷️', 
      color: theme.colors.success[500],
      path: '/categories'
    },
    { 
      title: 'Analytics', 
      description: 'View insights', 
      icon: '📈', 
      color: theme.colors.info[500],
      path: '/analytics'
    },
    { 
      title: 'Jupyter Notebook', 
      description: 'Advanced analysis', 
      icon: '🔬', 
      color: theme.colors.warning[500],
      href: 'http://localhost:8888'
    },
  ];

  return (
    <FadeIn>
      {/* Minimal Header - Just Account Info */}
      {(selectedAccount || selectedBank) && (
        <Text variant="muted" size="lg" noMargin style={{ marginBottom: theme.spacing[6] }}>
          {selectedAccount 
            ? `${selectedAccount.name} • ${selectedBank?.name}` 
            : selectedBank
            ? `${selectedBank.name} • Select an account`
            : ''
          }
        </Text>
      )}

      {/* Financial Stats - Top Priority */}
      <Grid columns="repeat(auto-fit, minmax(250px, 1fr))" gap={4} style={{ marginBottom: theme.spacing[8] }}>
        {stats.map((stat, index) => (
          <FadeIn key={stat.label} style={{ animationDelay: `${index * 100}ms` }}>
            <StatsCard>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
              {stat.change && (
                <Flex justify="center" style={{ marginTop: theme.spacing[3] }}>
                  <Badge variant={stat.trend === 'up' ? 'success' : stat.trend === 'down' ? 'error' : 'neutral'}>
                    {stat.trend === 'up' ? '↗' : stat.trend === 'down' ? '↘' : ''} {stat.change}
                  </Badge>
                </Flex>
              )}
            </StatsCard>
          </FadeIn>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Card style={{ marginTop: theme.spacing[8] }}>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardSubtitle>Common tasks to manage your finances</CardSubtitle>
        </CardHeader>
        
        <Grid columns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
          {quickActions.map((action, index) => (
            <FadeIn key={action.title} style={{ animationDelay: `${(index + 4) * 100}ms` }}>
              <QuickActionCard
                as={action.href ? 'a' : 'div'}
                href={action.href}
                target={action.href ? '_blank' : undefined}
                onClick={action.path ? () => window.location.href = action.path : undefined}
              >
                <IconWrapper color={action.color}>
                  {action.icon}
                </IconWrapper>
                <Text weight="semibold" noMargin>{action.title}</Text>
                <Text variant="muted" size="sm" noMargin style={{ marginTop: theme.spacing[1] }}>
                  {action.description}
                </Text>
              </QuickActionCard>
            </FadeIn>
          ))}
        </Grid>
      </Card>

      {/* Demo Setup Section */}
      {!selectedBank && (
        <Card style={{ marginTop: theme.spacing[8], textAlign: 'center' }}>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardSubtitle>Add a bank and create accounts to start tracking your finances</CardSubtitle>
          </CardHeader>
          <Button onClick={setupDemo} variant="primary" size="lg">
            Setup Demo Data
          </Button>
        </Card>
      )}

      {/* Recent Activity Placeholder */}
      {selectedAccount && (
        <Card style={{ marginTop: theme.spacing[8] }}>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardSubtitle>Latest transactions and updates</CardSubtitle>
          </CardHeader>
          
          <Flex direction="column" gap={4}>
            {[1, 2, 3].map((item) => (
              <Flex key={item} align="center" justify="space-between" style={{ 
                padding: theme.spacing[4], 
                background: theme.colors.light.elevated,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.light.border}`
              }}>
                <Flex align="center" gap={3}>
                  <IconWrapper color={theme.colors.neutral[600]} style={{ width: '32px', height: '32px', fontSize: '16px' }}>
                    💳
                  </IconWrapper>
                  <div>
                    <Text noMargin weight="medium">Transaction imported</Text>
                    <Text variant="muted" size="sm" noMargin>2 minutes ago</Text>
                  </div>
                </Flex>
                <Badge variant="info">New</Badge>
              </Flex>
            ))}
          </Flex>
        </Card>
      )}
    </FadeIn>
  );
}

export default Dashboard;