import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    as?: "input" | "textarea";
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ as = "input", className, ...rest }, ref) => {
        const classes = `w-input${className ? ` ${className}` : ""}`;
        if (as === "textarea") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return <textarea className={classes} {...(rest as any)} />;
        }
        return <input ref={ref} className={classes} {...rest} />;
    },
);

Input.displayName = "Input";
