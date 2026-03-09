import styled from "styled-components";

export const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--font-size-lg);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: transparent;
`;

export const TableHead = styled.thead`
  background-color: var(--color-background-subtle);
`;

export const TableBody = styled.tbody`
  tr:last-child td:last-child {
    overflow: visible;
  }
`;

export const TableRow = styled.tr`
  &:not(:last-child) td {
    border-bottom: var(--border-width-thin) solid var(--color-border);
  }
`;

export const TableHeader = styled.th`
  text-align: left;
  padding: var(--space-4u) var(--space-8u);
  font-weight: 400;
  font-size: var(--font-size-lg);
  color: var(--color-secondary-text);
  background-color: var(--color-background-subtle);
  border-bottom: var(--border-width-thin) solid var(--color-border);
  white-space: nowrap;
  
  &:last-child {
    text-align: right;
    width: var(--size-30u);
  }
  
  &:first-child {
    width: 40%;
  }
`;

export const TableCell = styled.td`
  padding: var(--space-6u) var(--space-8u);
  font-size: var(--font-size-lg);
  color: var(--color-foreground);
  vertical-align: middle;
  white-space: nowrap;
`;

export const TableCellFlex = styled(TableCell)`
  & > div {
    display: flex;
    align-items: center;
    gap: var(--space-6u);
  }
`;

export const ActionsCell = styled(TableCell)`
  text-align: right;
  width: auto;
  white-space: nowrap;
  position: relative;
  overflow: visible;

  & > * {
    width: fit-content;
    margin-left: auto;
  }

  & > [data-dropdown-trigger] {
    display: inline-flex;
    width: fit-content;
    margin-left: auto;
  }
`;
