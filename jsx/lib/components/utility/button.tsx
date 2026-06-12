import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    $primary?: boolean;
    $outline?: boolean;
    $destructive?: boolean;
    $fullWidth?: boolean;
    $size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            $primary: _primary,
            $outline,
            $destructive,
            $fullWidth,
            $size,
            className,
            style,
            ...rest
        },
        ref,
    ) => {
        const variant = $destructive
            ? "w-btn--danger-solid"
            : $outline
              ? "w-btn--secondary"
              : "w-btn--primary";
        const size =
            $size === "sm" ? " w-btn--sm" : $size === "lg" ? " w-btn--lg" : "";
        const classes = `w-btn ${variant}${size}${className ? ` ${className}` : ""}`;
        return (
            <button
                ref={ref}
                className={classes}
                style={$fullWidth ? { width: "100%", ...style } : style}
                {...rest}
            />
        );
    },
);

Button.displayName = "Button";
