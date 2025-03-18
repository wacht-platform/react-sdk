import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import {
	Building2,
	ChevronDown,
	LogOut,
	Plus,
	Settings,
	Users,
} from "lucide-react";
import { DefaultStylesProvider } from "../utility/typography";

interface Organization {
	id: string;
	name: string;
	role: "admin" | "member";
	imageUrl?: string;
}

const Container = styled.div`
  position: relative;
  font-family: system-ui, -apple-system, sans-serif;
`;

const TriggerButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  max-width: 250px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: white;
  transition: all 0.2s;
  min-width: 180px;

  &:hover {
    background-color: #f8fafc;
  }

  @media (max-width: 600px) {
    padding: 4px 6px;
    min-width: 140px;
    font-size: 12px;
  }
`;

const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const OrgImage = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  object-fit: cover;

  @media (max-width: 600px) {
    width: 20px;
    height: 20px;
  }
`;

const OrgName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;

  @media (max-width: 600px) {
    font-size: 12px;
  }
`;

const ChevronIcon = styled(ChevronDown)<{ $isOpen: boolean }>`
  width: 16px;
  height: 16px;
  color: #64748b;
  transform: ${(props) => (props.$isOpen ? "rotate(180deg)" : "rotate(0)")};
  transition: transform 0.2s;
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 280px;
  max-height: 60vh;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 4px;
  z-index: 50;

  @media (max-width: 600px) {
    width: 90%;
    left: 5%;
    top: calc(100% + 2px);
    max-height: 50vh;
  }
`;

const DropdownHeader = styled.div`
  padding: 8px 8px 4px;
`;

const HeaderText = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  margin: 0;
`;

const OrgButton = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
  background-color: ${(props) => (props.$isActive ? "#f1f5f9" : "transparent")};
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #f1f5f9;
  }

  @media (max-width: 600px) {
    padding: 6px;
    gap: 8px;
  }
`;

const LargeOrgImage = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;

  @media (max-width: 600px) {
    width: 28px;
    height: 28px;
  }
`;

const OrgInfo = styled.div`
  flex: 1;
  text-align: left;
`;

const OrgTitle = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin: 0;

  @media (max-width: 600px) {
    font-size: 12px;
  }
`;

const OrgRole = styled.p`
  font-size: 13px;
  color: #64748b;
  text-transform: capitalize;
  margin: 0;

  @media (max-width: 600px) {
    font-size: 11px;
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: #e5e7eb;
  margin: 4px 0;
`;

const ActionButton = styled.button<{ $isDestructive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px;
  font-size: 14px;
  color: ${(props) => (props.$isDestructive ? "#ef4444" : "#1e293b")};
  transition: all 0.2s;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background-color: #f1f5f9;
  }

  @media (max-width: 600px) {
    padding: 6px;
    font-size: 12px;
  }

  svg {
    width: 16px;
    height: 16px;
    color: ${(props) => (props.$isDestructive ? "#ef4444" : "#64748b")};

    @media (max-width: 600px) {
      width: 14px;
      height: 14px;
    }
  }
`;

interface OrganizationSwitcherProps {
	Organizations: Organization[];
	currentOrg: Organization;
	setCurrentOrg: (org: Organization) => void;
}

export const OrganizationSwitcher = ({
	Organizations,
	currentOrg,
	setCurrentOrg,
}: OrganizationSwitcherProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleOrgSelect = (org: Organization) => {
		setCurrentOrg(org);
		setIsOpen(false);
	};

	return (
		<DefaultStylesProvider>
			<Container ref={dropdownRef}>
				<TriggerButton
					onClick={() => setIsOpen(!isOpen)}
					aria-expanded={isOpen}
					aria-haspopup="true"
				>
					<ButtonContent>
						{currentOrg.imageUrl ? (
							<OrgImage src={currentOrg.imageUrl} alt={currentOrg.name} />
						) : (
							<Building2
								size={24}
								style={{ color: "#1e293b", strokeWidth: 1.8 }}
							/>
						)}
						<OrgName>{currentOrg.name}</OrgName>
					</ButtonContent>
					<ChevronIcon $isOpen={isOpen} />
				</TriggerButton>

				{isOpen && (
					<Dropdown>
						<DropdownHeader>
							<HeaderText>Switch Organization</HeaderText>
						</DropdownHeader>

						{Organizations.map((org) => (
							<OrgButton
								key={org.id}
								onClick={() => handleOrgSelect(org)}
								$isActive={currentOrg.id === org.id}
							>
								{org.imageUrl ? (
									<LargeOrgImage src={org.imageUrl} alt={org.name} />
								) : (
									<Building2
										size={36}
										style={{ color: "#1e293b", strokeWidth: 1.5 }}
									/>
								)}
								<OrgInfo>
									<OrgTitle>{org.name}</OrgTitle>
									<OrgRole>{org.role}</OrgRole>
								</OrgInfo>
							</OrgButton>
						))}

						<Divider />

						<ActionButton>
							<Plus />
							Create Organization
						</ActionButton>
						<ActionButton>
							<Users />
							Organization Profile
						</ActionButton>
						<ActionButton>
							<Settings />
							Organization Settings
						</ActionButton>
						<ActionButton $isDestructive>
							<LogOut />
							Sign Out
						</ActionButton>
					</Dropdown>
				)}
			</Container>
		</DefaultStylesProvider>
	);
};

export default OrganizationSwitcher;
