import { useState, useCallback } from "react";

interface UseDialogResult {
	isOpen: boolean;
	open: () => void;
	close: () => void;
	toggle: () => void;
}

/**
 * A hook for controlling the open/closed state of a dialog
 * @returns Object with isOpen state and methods to control the dialog
 */
export const useDialog = (initialState = false): UseDialogResult => {
	const [isOpen, setIsOpen] = useState(initialState);

	const open = useCallback(() => setIsOpen(true), []);
	const close = useCallback(() => setIsOpen(false), []);
	const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

	return { isOpen, open, close, toggle };
};
