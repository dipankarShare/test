import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardSubtitle,
  Title, 
  Heading,
  Text, 
  Button, 
  Input,
  Select,
  Grid, 
  Flex,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  FadeIn,
  Spinner,
  Divider
} from './ui';
import { theme } from '../theme';

function DesignSystemPreview() {
  const [loading, setLoading] = useState(false);

  const handleTestAction = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div style={{ padding: '2rem', background: theme.colors.light.bg, minHeight: '100vh' }}>
      <FadeIn>
        <Title>🎨 Design System Preview</Title>
        <Text variant="muted" size="lg">
          Preview of the new modern design system components
        </Text>
      </FadeIn>

      <Divider />

      {/* Typography Section */}
      <FadeIn style={{ animationDelay: '100ms' }}>
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardSubtitle>Text styles and hierarchy</CardSubtitle>
          </CardHeader>
          
          <div>
            <Title>Main Title (4xl)</Title>
            <Heading>Section Heading (xl)</Heading>
            <Text size="lg" weight="semibold">Large semibold text</Text>
            <Text>Regular body text</Text>
            <Text variant="secondary">Secondary text</Text>
            <Text variant="muted" size="sm">Small muted text</Text>
          </div>
        </Card>
      </FadeIn>

      {/* Buttons Section */}
      <FadeIn style={{ animationDelay: '200ms' }}>
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardSubtitle>Interactive button variants</CardSubtitle>
          </CardHeader>
          
          <Flex wrap="wrap" gap={4}>
            <Button variant="primary" onClick={handleTestAction}>
              {loading ? <Spinner size="16px" /> : 'Primary Button'}
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success">Success</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </Flex>
        </Card>
      </FadeIn>

      {/* Form Elements */}
      <FadeIn style={{ animationDelay: '300ms' }}>
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardSubtitle>Inputs and form controls</CardSubtitle>
          </CardHeader>
          
          <Grid columns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
            <div>
              <Text weight="medium" noMargin style={{ marginBottom: '0.5rem' }}>Text Input</Text>
              <Input placeholder="Enter your name..." />
            </div>
            <div>
              <Text weight="medium" noMargin style={{ marginBottom: '0.5rem' }}>Select Dropdown</Text>
              <Select>
                <option>Choose an option</option>
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </Select>
            </div>
          </Grid>
        </Card>
      </FadeIn>

      {/* Badges and Status */}
      <FadeIn style={{ animationDelay: '400ms' }}>
        <Card>
          <CardHeader>
            <CardTitle>Status Indicators</CardTitle>
            <CardSubtitle>Badges and status elements</CardSubtitle>
          </CardHeader>
          
          <Flex wrap="wrap" gap={3}>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
            <Badge>Default</Badge>
          </Flex>
        </Card>
      </FadeIn>

      {/* Data Table */}
      <FadeIn style={{ animationDelay: '500ms' }}>
        <Card>
          <CardHeader>
            <CardTitle>Data Table</CardTitle>
            <CardSubtitle>Modern table styling</CardSubtitle>
          </CardHeader>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              <TableRow>
                <TableCell>2024-01-15</TableCell>
                <TableCell>Grocery Store Purchase</TableCell>
                <TableCell>Food</TableCell>
                <TableCell style={{ color: theme.colors.error[500] }}>-$45.67</TableCell>
                <TableCell><Badge variant="success">Completed</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2024-01-14</TableCell>
                <TableCell>Salary Deposit</TableCell>
                <TableCell>Income</TableCell>
                <TableCell style={{ color: theme.colors.success[500] }}>+$3,200.00</TableCell>
                <TableCell><Badge variant="info">Processed</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2024-01-13</TableCell>
                <TableCell>Electric Bill</TableCell>
                <TableCell>Utilities</TableCell>
                <TableCell style={{ color: theme.colors.error[500] }}>-$89.23</TableCell>
                <TableCell><Badge variant="warning">Pending</Badge></TableCell>
              </TableRow>
            </tbody>
          </Table>
        </Card>
      </FadeIn>

      {/* Stats Cards Grid */}
      <FadeIn style={{ animationDelay: '600ms' }}>
        <Card>
          <CardHeader>
            <CardTitle>Statistics Cards</CardTitle>
            <CardSubtitle>Financial metrics display</CardSubtitle>
          </CardHeader>
          
          <Grid columns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
            {[
              { label: 'Total Balance', value: '$12,450.00', change: '+2.5%', positive: true },
              { label: 'Monthly Income', value: '$5,200.00', change: '+8.1%', positive: true },
              { label: 'Monthly Expenses', value: '$3,180.00', change: '-1.2%', positive: false },
              { label: 'Savings Rate', value: '38.8%', change: '+5.3%', positive: true },
            ].map((stat, index) => (
              <Card key={stat.label} style={{ 
                textAlign: 'center',
                borderTop: `4px solid ${theme.colors.primary[500]}`
              }}>
                <Text size="3xl" weight="bold" style={{ 
                  color: theme.colors.primary[400],
                  marginBottom: theme.spacing[2]
                }}>
                  {stat.value}
                </Text>
                <Text variant="muted" size="sm" weight="medium" style={{ 
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: theme.spacing[3]
                }}>
                  {stat.label}
                </Text>
                <Badge variant={stat.positive ? 'success' : 'error'}>
                  {stat.positive ? '↗' : '↘'} {stat.change}
                </Badge>
              </Card>
            ))}
          </Grid>
        </Card>
      </FadeIn>

      {/* Loading States */}
      <FadeIn style={{ animationDelay: '700ms' }}>
        <Card>
          <CardHeader>
            <CardTitle>Loading States</CardTitle>
            <CardSubtitle>Spinners and loading indicators</CardSubtitle>
          </CardHeader>
          
          <Flex align="center" gap={6}>
            <div>
              <Text weight="medium" noMargin style={{ marginBottom: '0.5rem' }}>Small</Text>
              <Spinner size="16px" />
            </div>
            <div>
              <Text weight="medium" noMargin style={{ marginBottom: '0.5rem' }}>Medium</Text>
              <Spinner size="24px" />
            </div>
            <div>
              <Text weight="medium" noMargin style={{ marginBottom: '0.5rem' }}>Large</Text>
              <Spinner size="32px" />
            </div>
          </Flex>
        </Card>
      </FadeIn>

      {/* Color Palette */}
      <FadeIn style={{ animationDelay: '800ms' }}>
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardSubtitle>Theme colors and variants</CardSubtitle>
          </CardHeader>
          
          <div>
            <Text weight="medium" style={{ marginBottom: theme.spacing[3] }}>Primary Colors</Text>
            <Flex wrap="wrap" gap={2} style={{ marginBottom: theme.spacing[6] }}>
              {[400, 500, 600, 700].map(shade => (
                <div key={shade} style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: theme.colors.primary[shade],
                  borderRadius: theme.borderRadius.lg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {shade}
                </div>
              ))}
            </Flex>

            <Text weight="medium" style={{ marginBottom: theme.spacing[3] }}>Semantic Colors</Text>
            <Flex wrap="wrap" gap={2}>
              {[
                { name: 'Success', color: theme.colors.success[500] },
                { name: 'Warning', color: theme.colors.warning[500] },
                { name: 'Error', color: theme.colors.error[500] },
                { name: 'Info', color: theme.colors.info[500] },
              ].map(color => (
                <div key={color.name} style={{
                  width: '80px',
                  height: '60px',
                  backgroundColor: color.color,
                  borderRadius: theme.borderRadius.lg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  {color.name}
                </div>
              ))}
            </Flex>
          </div>
        </Card>
      </FadeIn>

      <Divider />

      <FadeIn style={{ animationDelay: '900ms' }}>
        <Card style={{ textAlign: 'center' }}>
          <Text size="lg" weight="semibold">
            🎉 Design System Preview Complete!
          </Text>
          <Text variant="muted" style={{ marginTop: theme.spacing[2] }}>
            This shows all the components available in the new design system.
            Ready to apply to your Personal Finance Manager!
          </Text>
        </Card>
      </FadeIn>
    </div>
  );
}

export default DesignSystemPreview;