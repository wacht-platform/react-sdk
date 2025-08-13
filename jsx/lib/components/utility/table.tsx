import styled from "styled-components";

export const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-background);
`;

export const TableHead = styled.thead`
  background-color: var(--color-background-alt);
`;

export const TableBody = styled.tbody`
  background-color: var(--color-background);
  
  tr:last-child td:last-child {
    overflow: visible;
  }
`;

export const TableRow = styled.tr`
  &:not(:last-child) td {
    border-bottom: 1px solid var(--color-border);
  }
`;

export const TableHeader = styled.th`
  text-align: left;
  padding: 8px 16px;
  font-weight: 400;
  font-size: 14px;
  color: var(--color-secondary-text);
  background-color: var(--color-background-alt);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
  
  &:last-child {
    text-align: right;
    width: 60px;
  }
  
  &:first-child {
    width: 40%;
  }
`;

export const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: var(--color-foreground);
  vertical-align: middle;
  background-color: var(--color-background);
  white-space: nowrap;
`;

export const TableCellFlex = styled(TableCell)`
  & > div {
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

export const ActionsCell = styled(TableCell)`
  text-align: right;
  width: auto;
  white-space: nowrap;
  position: relative;
  overflow: visible;
`;
