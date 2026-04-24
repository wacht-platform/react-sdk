import styled from "styled-components";

export const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
`;

export const TableHead = styled.thead`
  background: color-mix(in srgb, var(--color-popover-foreground) 3%, transparent);
`;

export const TableBody = styled.tbody`
  tr:last-child td:last-child {
    overflow: visible;
  }
`;

export const TableRow = styled.tr`
  transition: background 0.12s ease;

  tbody &:not(:last-child) td {
    border-bottom: 1px solid var(--color-border);
  }

  tbody &:hover td {
    background: color-mix(in srgb, var(--color-popover-foreground) 4%, transparent);
  }
`;

export const TableHeader = styled.th`
  text-align: left;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-secondary-text);
  white-space: nowrap;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    text-align: right;
    width: var(--size-30u);
  }
`;

export const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 13px;
  color: var(--color-foreground);
  vertical-align: middle;
  white-space: nowrap;
  transition: background 0.12s ease;
`;

export const TableCellFlex = styled(TableCell)`
  & > div {
    display: flex;
    align-items: center;
    gap: 10px;
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
