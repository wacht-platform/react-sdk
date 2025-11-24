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
            const spaceRight = windowWidth - rect.left;
            const spaceLeft = rect.right;
            const spaceBelow = windowHeight - rect.bottom;
            const spaceAbove = rect.top;

            let pos: PopoverPosition = {};

            // Horizontal Positioning
            // Prefer aligning left edge with trigger left edge (opening to right)
            if (spaceRight >= minWidth) {
                pos.left = rect.left;
            } else if (spaceLeft >= minWidth) {
                // If not enough space on right, align right edge with trigger right edge (opening to left)
                // We use 'right' style or calculate 'left' based on width?
                // Let's use 'right' relative to window edge if possible, or calculated left
                // Using calculated left is often safer for portals
                pos.left = rect.right - minWidth;
            } else {
                // Not enough space on either side, center or force fit
                pos.left = Math.max(offset, Math.min(windowWidth - minWidth - offset, rect.left));
            }

            // Vertical Positioning
            // Prefer opening down
            if (spaceBelow >= 150) { // Minimum useful height
                pos.top = rect.bottom + offset;
                pos.maxHeight = Math.min(defaultMaxHeight, spaceBelow - offset * 2);
            } else if (spaceAbove >= 150) {
                // Open up
                pos.bottom = windowHeight - rect.top + offset;
                pos.maxHeight = Math.min(defaultMaxHeight, spaceAbove - offset * 2);
            } else {
                // Not enough space either way, prefer down and scroll
                pos.top = rect.bottom + offset;
                pos.maxHeight = Math.max(100, spaceBelow - offset * 2);
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
