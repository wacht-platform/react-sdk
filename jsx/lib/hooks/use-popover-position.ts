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
    /** The popover element — measured for accurate width alignment. */
    contentRef?: RefObject<HTMLElement | null>;
}

export const usePopoverPosition = ({
    triggerRef,
    isOpen,
    minWidth = 300,
    defaultMaxHeight = 400,
    offset = 8,
    contentRef,
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

            // Use the popover's real rendered width when available (it's laid out
            // even while visibility:hidden) so alignment matches the actual box
            // instead of a guessed minWidth.
            const width = contentRef?.current?.offsetWidth || minWidth;

            const spaceBelow = windowHeight - rect.bottom;
            const spaceAbove = rect.top;

            const pos: PopoverPosition = {};

            // Vertical: prefer the side with more room
            if (spaceBelow >= spaceAbove) {
                pos.top = rect.bottom + offset;
                pos.maxHeight = Math.min(defaultMaxHeight, spaceBelow - offset * 2);
            } else {
                pos.bottom = windowHeight - rect.top + offset;
                pos.maxHeight = Math.min(defaultMaxHeight, spaceAbove - offset * 2);
            }

            // Horizontal: align to the trigger, clamped to the viewport using the
            // real width; open toward the side with more room.
            const availableRight = windowWidth - rect.left;
            const availableLeft = rect.right;
            const desiredLeft =
                availableRight >= availableLeft ? rect.left : rect.right - width;
            pos.left = Math.max(
                offset,
                Math.min(windowWidth - width - offset, desiredLeft),
            );

            setPosition(pos);
        };

        // Measure after layout so contentRef has its dimensions.
        const raf = requestAnimationFrame(calculatePosition);

        window.addEventListener("resize", calculatePosition);
        window.addEventListener("scroll", calculatePosition, true);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", calculatePosition);
            window.removeEventListener("scroll", calculatePosition, true);
        };
    }, [isOpen, minWidth, defaultMaxHeight, offset, contentRef]);

    return position;
};
