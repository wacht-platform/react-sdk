import {
    forwardRef,
    useEffect,
    useState,
    type ButtonHTMLAttributes,
    type HTMLAttributes,
    type LabelHTMLAttributes,
    type ReactNode,
} from "react";

const cx = (...parts: (string | false | undefined)[]) =>
    parts.filter(Boolean).join(" ");

/* ───────────────────────────────────────────────────────────────────────────
 * Account screen chrome
 * ──────────────────────────────────────────────────────────────────────── */

export const TypographyProvider = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-contents", className)} {...rest} />
));
TypographyProvider.displayName = "TypographyProvider";

export const Container = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-card", "w-flex-col", "w-full", "w-minh-full", className)}
        {...rest}
    />
));
Container.displayName = "Container";

export const TabsContainer = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-tabsbar", className)} {...rest} />
));
TabsContainer.displayName = "TabsContainer";

export const TabsList = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-flex", "w-items-center", "w-gap-1", "w-tabs", className)}
        {...rest}
    />
));
TabsList.displayName = "TabsList";

export const Tab = forwardRef<
    HTMLButtonElement,
    ButtonHTMLAttributes<HTMLButtonElement> & { $isActive?: boolean }
>(({ $isActive, className, ...rest }, ref) => (
    <button
        ref={ref}
        className={cx("w-tab", $isActive && "w-tab--active", className)}
        {...rest}
    />
));
Tab.displayName = "Tab";

export const TabIcon = forwardRef<
    HTMLSpanElement,
    HTMLAttributes<HTMLSpanElement>
>(({ className, ...rest }, ref) => (
    <span ref={ref} className={cx("w-inline", "w-gap-1", className)} {...rest} />
));
TabIcon.displayName = "TabIcon";

export const TabContent = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, children, ...rest }, ref) => (
    <div ref={ref} className={cx("w-tabbody", className)} {...rest}>
        <div className="w-tabpane">{children}</div>
    </div>
));
TabContent.displayName = "TabContent";

export const IconButton = forwardRef<
    HTMLButtonElement,
    ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...rest }, ref) => (
    <button
        ref={ref}
        className={cx("w-btn", "w-btn--icon", className)}
        {...rest}
    />
));
IconButton.displayName = "IconButton";

export const HeaderCTAContainer = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx(
            "w-flex",
            "w-items-center",
            "w-justify-between",
            "w-wrap",
            "w-gap-3",
            className,
        )}
        {...rest}
    />
));
HeaderCTAContainer.displayName = "HeaderCTAContainer";

export const ProfileSectionLayout = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-flex", "w-items-start", "w-gap-6", className)}
        {...rest}
    />
));
ProfileSectionLayout.displayName = "ProfileSectionLayout";

export const ProfileImageContainer = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-none", className)} {...rest} />
));
ProfileImageContainer.displayName = "ProfileImageContainer";

export const SecurityItemRow = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-vrow", className)}
        {...rest}
    />
));
SecurityItemRow.displayName = "SecurityItemRow";

export const SecurityItemContent = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-grow", className)} {...rest} />
));
SecurityItemContent.displayName = "SecurityItemContent";

export const SecurityItemActions = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-flex", "w-items-center", "w-gap-2", "w-none", className)}
        {...rest}
    />
));
SecurityItemActions.displayName = "SecurityItemActions";

export const ResponsiveHeaderContainer = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-sechead", className)}
        {...rest}
    />
));
ResponsiveHeaderContainer.displayName = "ResponsiveHeaderContainer";

export const DesktopTableContainer = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-full", className)} {...rest} />
));
DesktopTableContainer.displayName = "DesktopTableContainer";

export const FormRow = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-flex", "w-gap-3", className)} {...rest} />
));
FormRow.displayName = "FormRow";

export const ConnectionItemRow = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-vrow", className)}
        {...rest}
    />
));
ConnectionItemRow.displayName = "ConnectionItemRow";

export const ConnectionLeft = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-flex", "w-items-center", "w-gap-2", "w-grow", className)}
        {...rest}
    />
));
ConnectionLeft.displayName = "ConnectionLeft";

export const ConnectionRight = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx(
            "w-flex",
            "w-items-center",
            "w-justify-end",
            "w-gap-1",
            "w-none",
            className,
        )}
        {...rest}
    />
));
ConnectionRight.displayName = "ConnectionRight";

export const IconWrapper = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-iconbox", className)}
        {...rest}
    />
));
IconWrapper.displayName = "IconWrapper";

export const ButtonActions = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-flex", "w-wrap", "w-gap-2", className)}
        {...rest}
    />
));
ButtonActions.displayName = "ButtonActions";

export const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [query]);

    return matches;
};

/* ───────────────────────────────────────────────────────────────────────────
 * Layout primitives
 * ──────────────────────────────────────────────────────────────────────── */

export const PageHeader = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-page-head", className)}
        {...rest}
    />
));
PageHeader.displayName = "PageHeader";

export const PageHeaderAvatar = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-avatar", className)} {...rest} />
));
PageHeaderAvatar.displayName = "PageHeaderAvatar";

export const PageHeaderInfo = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-flex-col", "w-gap-1", "w-grow", className)}
        {...rest}
    />
));
PageHeaderInfo.displayName = "PageHeaderInfo";

export const PageHeaderName = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-sec", "w-truncate", className)} {...rest} />
));
PageHeaderName.displayName = "PageHeaderName";

export const PageHeaderSub = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-secsub", "w-truncate", className)}
        {...rest}
    />
));
PageHeaderSub.displayName = "PageHeaderSub";

export const PageHeaderActions = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx(
            "w-flex",
            "w-items-center",
            "w-gap-1",
            "w-none",
            className,
        )}
        {...rest}
    />
));
PageHeaderActions.displayName = "PageHeaderActions";

export const PageContent = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-flex-col", "w-gap-4", className)} {...rest} />
));
PageContent.displayName = "PageContent";

export const Card = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <section ref={ref} className={cx("w-card", className)} {...rest} />
));
Card.displayName = "Card";

export const DangerCard = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <section ref={ref} className={cx("w-card", "w-danger", className)} {...rest} />
));
DangerCard.displayName = "DangerCard";

export const CardHeader = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-card-head", className)}
        {...rest}
    />
));
CardHeader.displayName = "CardHeader";

export const CardTitleBlock = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-flex-col", "w-gap-1", "w-grow", className)}
        {...rest}
    />
));
CardTitleBlock.displayName = "CardTitleBlock";

export const CardTitle = forwardRef<
    HTMLHeadingElement,
    HTMLAttributes<HTMLHeadingElement>
>(({ className, ...rest }, ref) => (
    <h3 ref={ref} className={cx("w-sec", className)} {...rest} />
));
CardTitle.displayName = "CardTitle";

export const CardSubtitle = forwardRef<
    HTMLParagraphElement,
    HTMLAttributes<HTMLParagraphElement>
>(({ className, ...rest }, ref) => (
    <p ref={ref} className={cx("w-secsub", className)} {...rest} />
));
CardSubtitle.displayName = "CardSubtitle";

export const CardActions = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-flex", "w-items-center", "w-wrap", "w-gap-2", "w-none", className)}
        {...rest}
    />
));
CardActions.displayName = "CardActions";

export const CardDivider = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-hr", className)} {...rest} />
));
CardDivider.displayName = "CardDivider";

export const CardBody = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-card-body", className)} {...rest} />
));
CardBody.displayName = "CardBody";

export const CardFooter = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-card-foot", className)}
        {...rest}
    />
));
CardFooter.displayName = "CardFooter";

/* Row list (security items, etc.) */
export const RowList = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-list", className)} {...rest} />
));
RowList.displayName = "RowList";

export const RowItem = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-rowitem", className)}
        {...rest}
    />
));
RowItem.displayName = "RowItem";

export const RowInfo = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-flex-col", "w-gap-1", "w-grow", className)}
        {...rest}
    />
));
RowInfo.displayName = "RowInfo";

export const RowTitle = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-sec", className)} {...rest} />
));
RowTitle.displayName = "RowTitle";

export const RowSub = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-secsub", className)} {...rest} />
));
RowSub.displayName = "RowSub";

export const RowActions = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-flex", "w-items-center", "w-wrap", "w-gap-2", "w-none", className)}
        {...rest}
    />
));
RowActions.displayName = "RowActions";

/* Status pill */
type PillVariant = "primary" | "success" | "warning" | "danger" | "neutral";

const pillVariantClass: Record<PillVariant, string> = {
    primary: "w-pill--current",
    success: "w-pill--success",
    warning: "w-pill--pending",
    danger: "w-pill--error",
    neutral: "",
};

export const StatusPill = ({
    $variant = "neutral",
    className,
    children,
    ...rest
}: HTMLAttributes<HTMLSpanElement> & { $variant?: PillVariant }) => (
    <span
        className={cx("w-pill", pillVariantClass[$variant], className)}
        {...rest}
    >
        <span className="w-dot" />
        {children as ReactNode}
    </span>
);

/* Table */
export const Table = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-list", className)} {...rest} />
));
Table.displayName = "Table";

export const TableHead = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement> & { $cols?: string }
>(({ $cols, className, style, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-listhead", "w-gap-4", className)}
        style={{ gridTemplateColumns: $cols || "1fr 1fr auto", ...style }}
        {...rest}
    />
));
TableHead.displayName = "TableHead";

export const Th = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={className} {...rest} />
));
Th.displayName = "Th";

export const Tr = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement> & { $cols?: string }
>(({ $cols, className, style, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-row", "w-gap-4", className)}
        style={{ gridTemplateColumns: $cols || "1fr 1fr auto", ...style }}
        {...rest}
    />
));
Tr.displayName = "Tr";

export const Td = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-truncate", "w-text-secondary", className)}
        {...rest}
    />
));
Td.displayName = "Td";

/* Form field bits */
export const FieldGrid = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={cx("w-grid-2", className)}
        {...rest}
    />
));
FieldGrid.displayName = "FieldGrid";

export const Field = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("w-field", className)} {...rest} />
));
Field.displayName = "Field";

export const FieldLabel = forwardRef<
    HTMLLabelElement,
    LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...rest }, ref) => (
    <label ref={ref} className={cx("w-label", className)} {...rest} />
));
FieldLabel.displayName = "FieldLabel";
