import styled from "styled-components";

export const TwoFactorContainer = styled.div`
  display: flex;
  gap: 0;
  margin-top: var(--space-8u);
  position: relative;
  min-height: calc(var(--size-50u) * 2);

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
  margin-bottom: var(--space-8u);
`;

export const SectionTitle = styled.h3`
  font-size: calc(var(--font-size-lg) + var(--border-width-thin));
  font-weight: 400;
  color: var(--color-card-foreground);
  margin: 0;
`;

export const StatusBadge = styled.span<{ $active?: boolean }>`
  font-size: var(--font-size-xs);
  font-weight: 400;
  padding: var(--space-1u) var(--space-3u);
  border-radius: var(--radius-2xs);
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
  margin: var(--space-8u) 0;
  padding: var(--space-8u);
  background: var(--color-secondary);
  border-radius: var(--radius-md);
  border: var(--border-width-thin) solid var(--color-border);
`;

export const CodeInput = styled.input`
  width: 100%;
  padding: var(--space-3u) var(--space-4u);
  font-size: var(--font-size-lg);
  font-family: monospace;
  text-align: center;
  letter-spacing: var(--space-1u);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-xs);
  background: var(--color-input-background);
  margin-bottom: var(--space-6u);

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

export const BackupCodesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4u);
  margin: var(--space-8u) 0;
`;

export const BackupCode = styled.button<{ $used?: boolean }>`
  padding: var(--space-4u) var(--space-6u);
  font-family: monospace;
  font-size: var(--font-size-md);
  background: ${(props) =>
    props.$used ? "var(--color-background-hover)" : "var(--color-background)"};
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-2xs);
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
  padding: var(--space-4u) var(--space-8u);
  font-size: var(--font-size-md);
  font-weight: 400;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all 0.15s ease;
  border: var(--border-width-thin) solid;
  flex: 1;

  ${(props) => {
    switch (props.$variant) {
      case "primary":
        return `
          background: var(--color-primary);
          color: var(--color-foreground-inverse);
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
          color: var(--color-card-foreground);
          border-color: var(--color-border);
          &:hover { background: var(--color-accent); }
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
  gap: var(--space-4u);
  margin-top: var(--space-6u);
`;

export const InfoText = styled.p`
  font-size: var(--font-size-md);
  font-weight: 400;
  color: var(--color-secondary-text);
  margin: var(--space-5u) 0;
  line-height: 1.5;
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: var(--space-12u) 0;
`;

export const EmptyStateText = styled.p`
  font-size: var(--font-size-md);
  font-weight: 400;
  color: var(--color-secondary-text);
  margin: 0 0 var(--space-6u) 0;
  line-height: 1.5;
`;
