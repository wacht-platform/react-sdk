import styled from "styled-components";

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

export const TableHead = styled.thead`
  background-color: var(--color-input-background);
  border-bottom: 1px solid var(--color-border);
`;

export const TableBody = styled.tbody`
  background-color: var(--color-background);
`;

export const TableRow = styled.tr`
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--color-input-background);
  }
`;

export const TableHeader = styled.th`
  text-align: left;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 12px;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

export const TableCell = styled.td`
  padding: 16px 24px;
  font-size: 14px;
  color: var(--color-foreground);
  vertical-align: middle;
`;

export const TableCellFlex = styled(TableCell)`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const ActionsCell = styled(TableCell)`
  text-align: right;
  width: 50px;
  white-space: nowrap;
`;
