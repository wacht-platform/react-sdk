import styled from "styled-components";
import { Building2, Plus } from "lucide-react";
import { DefaultStylesProvider } from "../utility/root";

interface Organization {
	id: string;
	name: string;
	role: string;
	imageUrl?: string;
}

const Container = styled.div`
  max-width: 30rem;
  width: 100%;
  background: var(--color-background);
  border-radius: 1rem;
  box-shadow: 0 0.25rem 0.75rem var(--color-shadow);

  @media (max-width: 37.5rem) {
    width: 90%;
    max-width: none;
    border-radius: 0.75rem;
  }

  @media (max-width: 23.5rem) {
    width: 100%;
  }
`;

const Header = styled.div`
  padding: 1.75rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 0.875rem;

  @media (max-width: 37.5rem) {
    padding: 1.25rem;
    gap: 0.625rem;
  }

  @media (max-width: 23.5rem) {
    padding: 1rem;
    gap: 0.5rem;
  }
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0;

  @media (max-width: 37.5rem) {
    font-size: 1.125rem;
  }

  @media (max-width: 23.5rem) {
    font-size: 1rem;
  }
`;

const List = styled.div`
  padding: 1rem;

  @media (max-width: 37.5rem) {
    padding: 0.75rem;
  }

  @media (max-width: 23.5rem) {
    padding: 0.5rem;
  }
`;

const OrganizationItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) => (props.$active ? "var(--color-input-background)" : "transparent")};
  margin-bottom: 0.5rem;

  &:hover {
    background: var(--color-input-background);
  }

  @media (max-width: 37.5rem) {
    padding: 0.75rem;
    border-radius: 0.625rem;
  }

  @media (max-width: 23.5rem) {
    padding: 0.5rem;
  }
`;

const OrgImage = styled.div<{ url?: string }>`
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  background: ${(props) => (props.url ? `url(${props.url})` : "var(--color-input-background)")};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary-text);

  @media (max-width: 37.5rem) {
    width: 3rem;
    height: 3rem;
    border-radius: 0.625rem;
  }

  @media (max-width: 23.5rem) {
    width: 2.5rem;
    height: 2.5rem;
  }
`;

const OrgInfo = styled.div`
  margin-left: 1rem;
  flex: 1;

  @media (max-width: 37.5rem) {
    margin-left: 0.75rem;
  }

  @media (max-width: 23.5rem) {
    margin-left: 0.5rem;
  }
`;

const OrgName = styled.div`
  font-size: 1.0625rem;
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: 0.25rem;

  @media (max-width: 37.5rem) {
    font-size: 0.9375rem;
  }

  @media (max-width: 23.5rem) {
    font-size: 0.875rem;
  }
`;

const OrgRole = styled.div`
  font-size: 0.9375rem;
  color: var(--color-secondary-text);

  @media (max-width: 37.5rem) {
    font-size: 0.8125rem;
  }

  @media (max-width: 23.5rem) {
    font-size: 0.75rem;
  }
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.75rem;
  color: var(--color-secondary-text);
  cursor: pointer;
  border-radius: 0.5rem;

  &:hover {
    background: var(--color-input-background);
  }

  @media (max-width: 37.5rem) {
    padding: 0.5rem;
  }

  @media (max-width: 23.5rem) {
    padding: 0.25rem;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: var(--color-border);
  margin: 0.75rem 0;
`;

const ActionButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: none;
  background: transparent;
  color: var(--color-foreground);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 0.75rem;

  &:hover {
    background: var(--color-input-background);
  }

  @media (max-width: 37.5rem) {
    padding: 0.75rem;
    font-size: 0.875rem;
    gap: 0.5rem;
  }

  @media (max-width: 23.5rem) {
    padding: 0.5rem;
    font-size: 0.75rem;
    gap: 0.25rem;
  }
`;

interface OrganizationListProps {
	organizations: Organization[];
	activeOrg: string;
	setActiveOrg: (id: string) => void;
}

export const OrganizationList = ({
	organizations,
	activeOrg,
	setActiveOrg,
}: OrganizationListProps) => {
	return (
		<DefaultStylesProvider>
			<Container>
				<Header>
					<Building2 size={24} />
					<Title>Organizations</Title>
				</Header>
				<List>
					{organizations.map((org) => (
						<OrganizationItem
							key={org.id}
							$active={activeOrg === org.id}
							onClick={() => setActiveOrg(org.id)}
						>
							<OrgImage url={org.imageUrl}>
								{!org.imageUrl && <Building2 size={24} />}
							</OrgImage>
							<OrgInfo>
								<OrgName>{org.name}</OrgName>
								<OrgRole>{org.role}</OrgRole>
							</OrgInfo>
							<IconButton>
								•••
							</IconButton>
						</OrganizationItem>
					))}
					<Divider />
					<ActionButton>
						<Plus size={20} />
						Create Organization
					</ActionButton>
				</List>
			</Container>
		</DefaultStylesProvider>
	);
};

export default OrganizationList;
