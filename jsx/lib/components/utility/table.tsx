import {
  forwardRef,
  type HTMLAttributes,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";

const cx = (base: string, className?: string) =>
  className ? `${base} ${className}` : base;

export const Table = forwardRef<
  HTMLTableElement,
  TableHTMLAttributes<HTMLTableElement>
>(({ className, ...rest }, ref) => (
  <table ref={ref} className={cx("w-table", className)} {...rest} />
));
Table.displayName = "Table";

export const TableHead = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>((props, ref) => <thead ref={ref} {...props} />);
TableHead.displayName = "TableHead";

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>((props, ref) => <tbody ref={ref} {...props} />);
TableBody.displayName = "TableBody";

export const TableRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement>
>((props, ref) => <tr ref={ref} {...props} />);
TableRow.displayName = "TableRow";

export const TableHeader = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>((props, ref) => <th ref={ref} {...props} />);
TableHeader.displayName = "TableHeader";

export const TableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...rest }, ref) => (
  <td ref={ref} className={className} {...rest} />
));
TableCell.displayName = "TableCell";

export const TableCellFlex = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...rest }, ref) => (
  <td ref={ref} className={cx("w-td--flex", className)} {...rest} />
));
TableCellFlex.displayName = "TableCellFlex";

export const ActionsCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...rest }, ref) => (
  <td ref={ref} className={cx("w-td--actions", className)} {...rest} />
));
ActionsCell.displayName = "ActionsCell";
