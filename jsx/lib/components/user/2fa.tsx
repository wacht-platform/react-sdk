import styled from "styled-components";

export const TwoFactorContainer = styled.div`
  display: flex;
  gap: 0;
  margin-top: 16px;
  position: relative;
  min-height: 200px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const TwoFactorSection = styled.div`
  flex: 1;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const SectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 400;
  color: var(--color-foreground);
  margin: 0;
`;

export const StatusBadge = styled.span<{ $active?: boolean }>`
  font-size: 11px;
  font-weight: 400;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${(props) =>
    props.$active
      ? "var(--color-success-background)"
      : "var(--color-background-hover)"};
  color: ${(props) =>
    props.$active ? "var(--color-success)" : "var(--color-secondary-text)"};
`;

export const QRCodeWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 16px 0;
  padding: 16px;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
`;

export const CodeInput = styled.input`
  width: 100%;
  padding: 6px 8px;
  font-size: 14px;
  font-family: monospace;
  text-align: center;
  letter-spacing: 2px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  margin-bottom: 12px;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

export const BackupCodesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 16px 0;
`;

export const BackupCode = styled.button<{ $used?: boolean }>`
  padding: 8px 12px;
  font-family: monospace;
  font-size: 13px;
  background: ${(props) =>
    props.$used ? "var(--color-background-hover)" : "var(--color-background)"};
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: ${(props) => (props.$used ? "default" : "pointer")};
  color: ${(props) =>
    props.$used ? "var(--color-secondary-text)" : "var(--color-foreground)"};
  text-decoration: ${(props) => (props.$used ? "line-through" : "none")};
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    ${(props) =>
    !props.$used &&
    `
      background: var(--color-primary-background);
      border-color: var(--color-primary);
    `}
  }
`;

export const ActionButton = styled.button<{
  $variant?: "primary" | "secondary" | "danger";
}>`
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 400;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid;
  flex: 1;

  ${(props) => {
    switch (props.$variant) {
      case "primary":
        return `
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
          &:hover { background: var(--color-primary-hover); }
        `;
      case "danger":
        return `
          background: transparent;
          color: var(--color-error);
          border-color: var(--color-error);
          &:hover { background: var(--color-error-background); }
        `;
      default:
        return `
          background: transparent;
          color: var(--color-foreground);
          border-color: var(--color-border);
          &:hover { background: var(--color-background-hover); }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

export const InfoText = styled.p`
  font-size: 13px;
  font-weight: 400;
  color: var(--color-secondary-text);
  margin: 10px 0;
  line-height: 1.5;
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 24px 0;
`;

export const EmptyStateText = styled.p`
  font-size: 13px;
  font-weight: 400;
  color: var(--color-secondary-text);
  margin: 0 0 12px 0;
  line-height: 1.5;
`;
