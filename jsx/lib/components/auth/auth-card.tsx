import type { ReactNode } from "react";
import { DefaultStylesProvider } from "../utility/root";
import { AuthFormImage } from "./auth-image";

/** Centered surface card with an optional recessed footer bar. */
export function AuthCard({
    children,
    footer,
}: {
    children: ReactNode;
    footer?: ReactNode;
}) {
    return (
        <div className="w-card w-auth-card">
            <div className="w-create-body">{children}</div>
            {footer && <div className="w-create-foot">{footer}</div>}
        </div>
    );
}

/** Centered logo + title + sub header; optional trailing node (e.g. address badge). */
export function AuthHead({
    title,
    sub,
    children,
}: {
    title: string;
    sub?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <div className="w-auth-head">
            <AuthFormImage />
            <div className="w-auth-head-text">
                <h1 className="w-auth-title">{title}</h1>
                {sub && <p className="w-auth-sub">{sub}</p>}
            </div>
            {children}
        </div>
    );
}

export function Spin({ size = 16, onAccent }: { size?: number; onAccent?: boolean }) {
    return (
        <span
            className={onAccent ? "w-spin w-spin--on-accent" : "w-spin"}
            style={{ width: size, height: size }}
        />
    );
}

/** Full-card loading state used during session/redirect waits. Renders a
 *  skeleton shaped like the form so the swap-in doesn't jump. */
export function AuthCardLoader() {
    return (
        <DefaultStylesProvider>
            <div className="w-card w-auth-card">
                <div className="w-create-body">
                    <div className="w-auth-skel" aria-hidden="true">
                        <div className="w-auth-skel-head">
                            <span className="w-skel w-skel-avatar" />
                            <span className="w-skel w-skel-title" />
                            <span className="w-skel w-skel-sub" />
                        </div>
                        <div className="w-auth-skel-fields">
                            <div className="w-auth-skel-field">
                                <span className="w-skel w-skel-label" />
                                <span className="w-skel w-skel-input" />
                            </div>
                            <div className="w-auth-skel-field">
                                <span className="w-skel w-skel-label" />
                                <span className="w-skel w-skel-input" />
                            </div>
                            <span className="w-skel w-skel-btn" />
                        </div>
                    </div>
                </div>
            </div>
        </DefaultStylesProvider>
    );
}
