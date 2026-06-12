import {
    forwardRef,
    type FormHTMLAttributes,
    type HTMLAttributes,
    type LabelHTMLAttributes,
} from "react";

export const Form = forwardRef<
    HTMLFormElement,
    FormHTMLAttributes<HTMLFormElement>
>(({ className, style, ...rest }, ref) => (
    <form
        ref={ref}
        className={className}
        style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            ...style,
        }}
        {...rest}
    />
));
Form.displayName = "Form";

export const FormGroup = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
    <div
        ref={ref}
        className={`w-field${className ? ` ${className}` : ""}`}
        {...rest}
    />
));
FormGroup.displayName = "FormGroup";

export const Label = forwardRef<
    HTMLLabelElement,
    LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...rest }, ref) => (
    <label
        ref={ref}
        className={`w-label${className ? ` ${className}` : ""}`}
        {...rest}
    />
));
Label.displayName = "Label";
