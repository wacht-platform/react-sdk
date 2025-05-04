import { type ReactNode, useEffect, useRef } from "react";
import styled from "styled-components";

const DropdownContainer = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 4px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  z-index: 10;
  min-width: 140px;
`;

interface DropdownProps {
	children: ReactNode;
	isOpen: boolean;
	onClose: () => void;
	position?: {
		top?: number | string;
		right?: number | string;
		bottom?: number | string;
		left?: number | string;
	};
}

export const Dropdown = ({
	children,
	isOpen,
	onClose,
	position,
}: DropdownProps) => {
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<DropdownContainer ref={dropdownRef} style={position}>
			{children}
		</DropdownContainer>
	);
};

export const DropdownItem = styled.button<{ $destructive?: boolean }>`
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: ${(props) => (props.$destructive ? "#ef4444" : "#1e293b")};

  &:hover {
    background: ${(props) => (props.$destructive ? "#fee2e2" : "#f8fafc")};
  }
`;
