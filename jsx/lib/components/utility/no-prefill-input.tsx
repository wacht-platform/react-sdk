import {
    forwardRef,
    useState,
    type InputHTMLAttributes,
    type FocusEvent,
} from "react";

/**
 * Drop-in `<input>` that keeps the browser's saved-value suggestion dropdown
 * (shown on focus) but skips silent autofill-on-load: the field is `readOnly`
 * until the user first focuses it, so password managers don't pre-populate it
 * on mount. Behaves like a normal input in every other way.
 */
export const NoPrefillInput = forwardRef<
    HTMLInputElement,
    InputHTMLAttributes<HTMLInputElement>
>(({ onFocus, readOnly, ...rest }, ref) => {
    const [active, setActive] = useState(false);
    return (
        <input
            ref={ref}
            {...rest}
            readOnly={readOnly || !active}
            onFocus={(e: FocusEvent<HTMLInputElement>) => {
                if (!active) setActive(true);
                onFocus?.(e);
            }}
        />
    );
});
NoPrefillInput.displayName = "NoPrefillInput";
