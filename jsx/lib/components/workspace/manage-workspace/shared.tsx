import React, { forwardRef } from "react";
import { useEffect, useState } from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

const cx = (...parts: (string | undefined | false)[]) =>
    parts.filter(Boolean).join(" ");

export const TypographyProvider = ({ className, ...props }: DivProps) => (
    <div className={cx("w-contents", className)} {...props} />
);

export const Container = ({ className, ...props }: DivProps) => (
    <div
        className={cx("w-card", "w-flex-col", "w-full", "w-minh-full", className)}
        {...props}
    />
);

export const TabsContainer = ({ className, ...props }: DivProps) => (
    <div className={cx("w-tabsbar", className)} {...props} />
);

export const TabsList = ({ className, ...props }: DivProps) => (
    <div
        className={cx("w-flex", "w-items-center", "w-gap-1", "w-tabs", className)}
        {...props}
    />
);

export const Tab = ({
    $isActive,
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { $isActive: boolean }) => (
    <button
        className={cx("w-tab", $isActive && "w-tab--active", className)}
        {...props}
    />
);

export const ButtonActions = ({ className, ...props }: DivProps) => (
    <div className={cx("w-flex", "w-wrap", "w-gap-2", className)} {...props} />
);

export const TabIcon = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
    <span className={cx("w-inline", "w-gap-2", className)} {...props} />
);

export const TabContent = ({ className, children, ...props }: DivProps) => (
    <div className={cx("w-tabbody", className)} {...props}>
        <div className="w-tabpane">{children}</div>
    </div>
);

export const IconButton = forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
    <button ref={ref} className={cx("w-kebab", className)} {...props} />
));
IconButton.displayName = "IconButton";

export const HeaderCTAContainer = ({ className, ...props }: DivProps) => (
    <div className={cx("w-sechead", className)} {...props} />
);

export const SectionLayout = ({ className, ...props }: DivProps) => (
    <div
        className={cx("w-flex", "w-items-start", "w-gap-6", className)}
        {...props}
    />
);

export const ImageContainer = ({ className, ...props }: DivProps) => (
    <div className={cx("w-none", className)} {...props} />
);

export const ItemRow = ({ className, ...props }: DivProps) => (
    <div
        className={cx(
            "w-flex",
            "w-items-center",
            "w-justify-between",
            "w-gap-4",
            className,
        )}
        {...props}
    />
);

export const ItemContent = ({ className, ...props }: DivProps) => (
    <div className={cx("w-grow", className)} {...props} />
);

export const ItemActions = ({ className, ...props }: DivProps) => (
    <div
        className={cx("w-flex", "w-items-center", "w-gap-3", "w-none", className)}
        {...props}
    />
);

export const ResponsiveHeaderContainer = ({ className, ...props }: DivProps) => (
    <div className={cx("w-sechead", className)} {...props} />
);

export const DesktopTableContainer = ({ className, ...props }: DivProps) => (
    <div className={cx("w-full", className)} {...props} />
);

export const MobileListContainer = ({ className, ...props }: DivProps) => (
    <div className={cx("w-flex-col", "w-gap-4", className)} {...props} />
);

export const FormRow = ({ className, ...props }: DivProps) => (
    <div className={cx("w-flex", "w-gap-3", className)} {...props} />
);

export const ConnectionItemRow = ({ className, ...props }: DivProps) => (
    <div className={cx("w-vrow", className)} {...props} />
);

export const ConnectionLeft = ({ className, ...props }: DivProps) => (
    <div
        className={cx(
            "w-flex",
            "w-items-center",
            "w-gap-3",
            "w-wrap",
            "w-none",
            className,
        )}
        {...props}
    />
);

export const IconWrapper = ({ className, ...props }: DivProps) => (
    <div className={cx("w-iconbox", className)} {...props} />
);

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

/* ─── PageHeader ──────────────────────────────────────────────────────────── */

export const PageHeader = ({ className, ...props }: DivProps) => (
    <div className={cx("w-page-head", className)} {...props} />
);

export const PageHeaderAvatar = ({ className, ...props }: DivProps) => (
    <div
        className={cx("w-avatar", "w-avatar--lg", className)}
        {...props}
    />
);

export const PageHeaderInfo = ({ className, ...props }: DivProps) => (
    <div className={cx("w-grow", "w-flex-col", "w-gap-1", className)} {...props} />
);

export const PageHeaderName = ({ className, ...props }: DivProps) => (
    <div className={cx("w-sec", "w-truncate", className)} {...props} />
);

export const PageHeaderSub = ({ className, ...props }: DivProps) => (
    <div className={cx("w-secsub", "w-truncate", className)} {...props} />
);

/* ─── StatusPill ──────────────────────────────────────────────────────────── */

type PillVariant = "primary" | "success" | "warning" | "danger" | "neutral";

const PILL_VARIANT: Record<PillVariant, string> = {
    primary: "w-pill--current",
    success: "w-pill--success",
    warning: "w-pill--warning",
    danger: "w-pill--error",
    neutral: "",
};

export const StatusPill = ({
    $variant,
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLSpanElement> & { $variant?: PillVariant }) => (
    <span
        className={cx("w-pill", $variant && PILL_VARIANT[$variant], className)}
        {...props}
    >
        <span className="w-dot" />
        {children}
    </span>
);

/* ─── SectionLabel ────────────────────────────────────────────────────────── */

export const SectionLabel = ({
    $first,
    className,
    ...props
}: DivProps & { $first?: boolean }) => (
    <div className={cx("w-sec", className)} {...props} />
);

/* ─── Inline action containers ────────────────────────────────────────────── */

export const InlineActions = ({ className, ...props }: DivProps) => (
    <div className={cx("w-actions", className)} {...props} />
);
