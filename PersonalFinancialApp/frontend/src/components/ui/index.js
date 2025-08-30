import styled from "styled-components";
import { theme } from "../../theme";

// Layout Components
export const Container = styled.div`
  max-width: ${theme.layout.container.maxWidth};
  padding: ${theme.layout.container.padding};
  margin: 0 auto;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: ${(props) =>
    props.columns || "repeat(auto-fit, minmax(300px, 1fr))"};
  gap: ${(props) => theme.spacing[props.gap] || theme.spacing[6]};
  margin-bottom: ${theme.spacing[6]};
`;

export const Flex = styled.div`
  display: flex;
  align-items: ${(props) => props.align || "center"};
  justify-content: ${(props) => props.justify || "flex-start"};
  gap: ${(props) => theme.spacing[props.gap] || theme.spacing[4]};
  flex-direction: ${(props) => props.direction || "row"};
  flex-wrap: ${(props) => props.wrap || "nowrap"};
`;

// Card Components
export const Card = styled.div`
  background: ${theme.components.card.background};
  border: ${theme.components.card.border};
  border-radius: ${theme.components.card.borderRadius};
  padding: ${theme.components.card.padding};
  box-shadow: ${theme.components.card.shadow};
  transition: all ${theme.transitions.normal};

  &:hover {
    box-shadow: ${theme.shadows.lg};
    transform: translateY(-1px);
  }
`;

export const CardHeader = styled.div`
  margin-bottom: ${theme.spacing[6]};
  padding-bottom: ${theme.spacing[4]};
  border-bottom: 1px solid ${theme.colors.light.border};
`;

export const CardTitle = styled.h2`
  color: ${theme.colors.light.text.primary};
  font-size: ${theme.typography.fontSize["2xl"]};
  font-weight: ${theme.typography.fontWeight.semibold};
  margin: 0;
  line-height: ${theme.typography.lineHeight.tight};
`;

export const CardSubtitle = styled.p`
  color: ${theme.colors.light.text.muted};
  font-size: ${theme.typography.fontSize.sm};
  margin: ${theme.spacing[2]} 0 0 0;
  line-height: ${theme.typography.lineHeight.normal};
`;

// Typography
export const Title = styled.h1`
  color: ${theme.colors.light.text.primary};
  font-size: ${theme.typography.fontSize["4xl"]};
  font-weight: ${theme.typography.fontWeight.bold};
  margin: 0 0 ${theme.spacing[8]} 0;
  line-height: ${theme.typography.lineHeight.tight};
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing[8]};
`;

export const Form = styled.form`
  display: grid;
  gap: ${theme.spacing[4]};
  margin-top: ${theme.spacing[5]};
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
`;

export const Label = styled.label`
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.light.text.primary};
  font-size: ${theme.typography.fontSize.sm};
`;

export const Alert = styled.div`
  padding: ${theme.spacing[4]};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing[4]};
  border: 1px solid;

  background: ${(props) => {
    if (props.type === "error") return theme.colors.error[50];
    if (props.type === "warning") return theme.colors.warning[50];
    if (props.type === "success") return theme.colors.success[50];
    return theme.colors.info[50];
  }};

  border-color: ${(props) => {
    if (props.type === "error") return theme.colors.error[200];
    if (props.type === "warning") return theme.colors.warning[200];
    if (props.type === "success") return theme.colors.success[200];
    return theme.colors.info[200];
  }};

  color: ${(props) => {
    if (props.type === "error") return theme.colors.error[800];
    if (props.type === "warning") return theme.colors.warning[800];
    if (props.type === "success") return theme.colors.success[800];
    return theme.colors.info[800];
  }};
`;

export const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid ${theme.colors.light.border};
  margin-bottom: ${theme.spacing[6]};
`;

export const Tab = styled.button`
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: ${theme.colors.light.text.secondary};
  cursor: pointer;
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  transition: all ${theme.transitions.normal};

  &:hover {
    color: ${theme.colors.light.text.primary};
  }

  ${(props) =>
    props.active &&
    `
    color: ${theme.colors.primary[600]};
    border-bottom-color: ${theme.colors.primary[600]};
  `}
`;

export const Heading = styled.h3`
  color: ${theme.colors.light.text.primary};
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.semibold};
  margin: 0 0 ${theme.spacing[4]} 0;
  line-height: ${theme.typography.lineHeight.tight};
`;

export const Text = styled.p`
  color: ${(props) => {
    if (props.variant === "muted") return theme.colors.light.text.muted;
    if (props.variant === "secondary") return theme.colors.light.text.secondary;
    return theme.colors.light.text.primary;
  }};
  font-size: ${(props) =>
    theme.typography.fontSize[props.size] || theme.typography.fontSize.base};
  font-weight: ${(props) =>
    theme.typography.fontWeight[props.weight] ||
    theme.typography.fontWeight.normal};
  line-height: ${theme.typography.lineHeight.normal};
  margin: ${(props) => (props.noMargin ? "0" : `0 0 ${theme.spacing[4]} 0`)};
`;

// Button Components
export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[2]};

  background: ${(props) => {
    const variant = props.variant || "primary";
    return (
      theme.components.button[variant]?.background ||
      theme.components.button.primary.background
    );
  }};

  color: ${(props) => {
    const variant = props.variant || "primary";
    return (
      theme.components.button[variant]?.color ||
      theme.components.button.primary.color
    );
  }};

  border: none;
  border-radius: ${theme.components.button.primary.borderRadius};
  padding: ${(props) => {
    if (props.size === "sm") return "0.5rem 1rem";
    if (props.size === "lg") return "1rem 2rem";
    return theme.components.button.primary.padding;
  }};

  font-size: ${(props) => {
    if (props.size === "sm") return theme.typography.fontSize.sm;
    if (props.size === "lg") return theme.typography.fontSize.lg;
    return theme.typography.fontSize.base;
  }};

  font-weight: ${theme.components.button.primary.fontWeight};
  font-family: ${theme.typography.fontFamily.sans.join(", ")};

  cursor: pointer;
  transition: all ${theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${(props) => {
      const variant = props.variant || "primary";
      return (
        theme.components.button[variant]?.backgroundHover ||
        theme.components.button.primary.backgroundHover
      );
    }};
    transform: translateY(-1px);
    box-shadow: ${theme.shadows.md};
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  &:focus {
    outline: 2px solid ${theme.colors.primary[500]};
    outline-offset: 2px;
  }
`;

// Input Components
export const Input = styled.input`
  width: 100%;
  background: ${theme.components.input.background};
  border: ${theme.components.input.border};
  border-radius: ${theme.components.input.borderRadius};
  padding: ${theme.components.input.padding};
  color: ${theme.components.input.color};
  font-size: ${theme.typography.fontSize.base};
  font-family: ${theme.typography.fontFamily.sans.join(", ")};
  transition: all ${theme.transitions.fast};

  &::placeholder {
    color: ${theme.components.input.placeholder};
  }

  &:focus {
    outline: none;
    border: ${theme.components.input.borderFocus};
    box-shadow: 0 0 0 3px ${theme.colors.primary[500]}20;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Select = styled.select`
  width: 100%;
  background: ${theme.components.input.background};
  border: ${theme.components.input.border};
  border-radius: ${theme.components.input.borderRadius};
  padding: ${theme.components.input.padding};
  color: ${theme.components.input.color};
  font-size: ${theme.typography.fontSize.base};
  font-family: ${theme.typography.fontFamily.sans.join(", ")};
  transition: all ${theme.transitions.fast};
  cursor: pointer;

  &:focus {
    outline: none;
    border: ${theme.components.input.borderFocus};
    box-shadow: 0 0 0 3px ${theme.colors.primary[500]}20;
  }

  option {
    background: ${theme.components.input.background};
    color: ${theme.components.input.color};
  }
`;

// Table Components
export const Table = styled.table`
  width: 100%;
  background: ${theme.components.table.background};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
  border-collapse: collapse;
  box-shadow: ${theme.shadows.base};
  table-layout: fixed;

  /* Explicit column widths for proper alignment */
  & th:nth-child(1),
  & td:nth-child(1) {
    width: 100px;
    text-align: left;
  } /* Date */
  & th:nth-child(2),
  & td:nth-child(2) {
    width: 40%;
    text-align: left;
  } /* Description */
  & th:nth-child(3),
  & td:nth-child(3) {
    width: 20%;
    text-align: left;
  } /* Note */
  & th:nth-child(4),
  & td:nth-child(4) {
    width: 20%;
    text-align: left;
  } /* Category */
  & th:nth-child(5),
  & td:nth-child(5) {
    width: 120px;
    text-align: right;
  } /* Amount */
`;

export const TableHead = styled.thead`
  background: ${theme.components.table.headerBackground};
`;

export const TableRow = styled.tr`
  border-bottom: 1px solid ${theme.components.table.borderColor};
  transition: background-color ${theme.transitions.fast};

  &:hover {
    background: ${theme.components.table.hoverBackground};
  }

  &:nth-child(even) {
    background: ${(props) =>
      props.striped ? theme.components.table.stripedBackground : "transparent"};
  }
`;

export const TableHeader = styled.th`
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  text-align: left;
  color: ${theme.colors.light.text.primary};
  font-weight: ${theme.typography.fontWeight.semibold};
  font-size: ${theme.typography.fontSize.sm};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${theme.components.table.headerBackground};
  border-bottom: 2px solid ${theme.components.table.borderColor};
  position: sticky;
  top: 0;
  z-index: 10;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 48px;

  &:last-child {
    text-align: right;
  }
`;

export const TableCell = styled.td`
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  color: ${theme.colors.light.text.secondary};
  font-size: ${theme.typography.fontSize.sm};
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 48px;

  &:last-child {
    text-align: right;
  }
`;

// Status Components
export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${theme.spacing[1]} ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.medium};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;

  background: ${(props) => {
    if (props.variant === "success") return theme.colors.success[500];
    if (props.variant === "warning") return theme.colors.warning[500];
    if (props.variant === "error") return theme.colors.error[500];
    if (props.variant === "info") return theme.colors.info[500];
    return theme.colors.neutral[600];
  }};

  color: ${(props) => {
    if (props.variant === "warning") return theme.colors.neutral[900];
    return theme.colors.neutral[50];
  }};
`;

// Loading Components
export const Spinner = styled.div`
  width: ${(props) => props.size || "24px"};
  height: ${(props) => props.size || "24px"};
  border: 2px solid ${theme.colors.neutral[700]};
  border-top: 2px solid ${theme.colors.primary[500]};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

// Utility Components
export const Divider = styled.hr`
  border: none;
  height: 1px;
  background: ${theme.colors.light.border};
  margin: ${theme.spacing[6]} 0;
`;

export const Spacer = styled.div`
  height: ${(props) => theme.spacing[props.size] || theme.spacing[4]};
  width: 100%;
`;

// Animation Components
export const FadeIn = styled.div`
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const SlideIn = styled.div`
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;
