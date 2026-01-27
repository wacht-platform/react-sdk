import { useState, useEffect, RefObject } from "react";

export interface PopoverPosition {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    maxHeight?: number;
}

interface UsePopoverPositionProps {
    triggerRef: RefObject<HTMLElement | null>;
    isOpen: boolean;
    minWidth?: number;
    defaultMaxHeight?: number;
    offset?: number;
}

export const usePopoverPosition = ({
    triggerRef,
    isOpen,
    minWidth = 300,
    defaultMaxHeight = 400,
    offset = 8,
}: UsePopoverPositionProps) => {
    const [position, setPosition] = useState<PopoverPosition | undefined>();

    useEffect(() => {
        if (!isOpen || !triggerRef.current) {
            setPosition(undefined);
            return;
        }

        const calculatePosition = () => {
            if (!triggerRef.current) return;

            const rect = triggerRef.current.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // Calculate available space
            const spaceBelow = windowHeight - rect.bottom;
            const spaceAbove = rect.top;

            let pos: PopoverPosition = {};

            // Vertical Positioning: Strictly prefer side with MORE space
            if (spaceBelow >= spaceAbove) {
                pos.top = rect.bottom + offset;
                pos.maxHeight = Math.min(defaultMaxHeight, spaceBelow - offset * 2);
            } else {
                pos.bottom = windowHeight - rect.top + offset;
                pos.maxHeight = Math.min(defaultMaxHeight, spaceAbove - offset * 2);
            }

            // Horizontal Positioning: Prioritize the side with more space
            const availableRight = windowWidth - rect.left;
            const availableLeft = rect.right;

            if (availableRight >= availableLeft) {
                // Open towards right (align left edges)
                pos.left = Math.max(offset, Math.min(windowWidth - minWidth - offset, rect.left));
            } else {
                // Open towards left (align right edges)
                pos.left = Math.max(offset, Math.min(windowWidth - minWidth - offset, rect.right - minWidth));
            }

            setPosition(pos);
        };

        calculatePosition();

        // Recalculate on resize and scroll
        window.addEventListener("resize", calculatePosition);
        window.addEventListener("scroll", calculatePosition, true);

        return () => {
            window.removeEventListener("resize", calculatePosition);
            window.removeEventListener("scroll", calculatePosition, true);
        };
    }, [isOpen, minWidth, defaultMaxHeight, offset]);

    return position;
};
