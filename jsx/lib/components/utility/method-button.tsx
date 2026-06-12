import React from "react";
import { CaretRight } from "@phosphor-icons/react";

interface MethodButtonProps {
    icon: React.ReactNode;
    label: string;
    description?: string;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit";
}

export function MethodButton({ icon, label, description, onClick, disabled, type = "button" }: MethodButtonProps) {
    return (
        <button
            type={type}
            className="w-method"
            onClick={onClick}
            disabled={disabled}
            data-disabled={disabled ? "" : undefined}
        >
            <span className="w-method-ic">{icon}</span>
            <span className="w-method-body">
                <span className="w-method-title">{label}</span>
                {description && <span className="w-method-desc">{description}</span>}
            </span>
            <span className="w-method-go">
                <CaretRight />
            </span>
        </button>
    );
}
