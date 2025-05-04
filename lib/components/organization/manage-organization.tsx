import React, { createContext, useContext, useState } from "react";
import styled from "styled-components";
import {
	Building,
	CheckCircle,
	ArrowRight,
	ArrowLeft,
	AlertTriangle,
	Plus,
	ChevronDown,
	ChevronUp,
	MoreVertical,
	Globe,
	Copy,
	ExternalLink,
	Trash,
} from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-organization";
import { Spinner } from "../utility";
import { match } from "ts-pattern";
import { FormGroup, Label } from "../utility/form";
import { Input } from "../utility/input";
import { Button } from "../user/add-phone-popover";
import { AddDomainPopover } from "./add-domain-popover";
import { Dropdown, DropdownItem } from "@/components/utility/dropdown";
import useSWR from "swr";

const TypographyProvider = styled.div`
  * {
    box-sizing: border-box;
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  }
`;

const Container = styled.div`
  width: 900px;
  max-width: 100%;
  height: 600px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  padding: 24px;
  transition: all 0.3s ease;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 16px;
  }
`;

const MainContent = styled.div<{ $isAdding: boolean }>`
  display: flex;
  flex-direction: column;
  transform: translateX(${(props) => (props.$isAdding ? "-100%" : "0")});
  transition: transform 0.3s ease;
  width: 100%;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  height: 100%;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProfileHeader = styled.div`
  display: flex;
  padding: 0 4px;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 24px;
`;

const Avatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
`;

const ProfileName = styled.div`
  flex: 1;
`;

const Name = styled.h2`
  font-size: 16px;
  margin: 0;
  color: #1e293b;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 2px;
  border-bottom: 1px solid #e2e8f0;
  gap: 12px;
  color: #1e293b;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f8fafc;
  }
`;

const InfoLabel = styled.div`
  color: #64748b;
  font-size: 14px;
  width: 180px;
`;

const InfoContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  pointer-events: none;
  font-size: 14px;
`;

const AddItemForm = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 100%;
  width: 100%;
  height: 100%;
  background: white;
  overflow-y: auto;
  transform: translateX(${(props) => (props.$isVisible ? "-100%" : "0")});
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  background: none;
  border: none;
  padding: 8px 0;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: #1e293b;
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background-color: #e2e8f0;
  margin: 6px 0;
  width: 100%;
`;

type Screen = "general" | "members" | "domains" | "billing" | "security" | null;

type ScreenContextType = {
	screen: Screen;
	setScreen: React.Dispatch<React.SetStateAction<Screen>>;
};

const ScreenContext = createContext<ScreenContextType>({
	screen: null,
	setScreen: () => {},
});

const OrganizationManagementSection = () => {
	const { activeOrganization: selectedOrganization, loading } =
		useActiveOrganization();
	const { setScreen } = useContext(ScreenContext);

	if (loading || !selectedOrganization) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					padding: "40px 0",
				}}
			>
				<Spinner />
			</div>
		);
	}

	const organization = selectedOrganization;

	return (
		<>
			<SectionTitle style={{ marginBottom: "20px" }}>
				Manage {organization.name}
			</SectionTitle>
			<ProfileSection>
				<ProfileHeader onClick={() => setScreen("general")}>
					<Avatar
						src={
							organization.image_url ||
							"https://images.unsplash.com/photo-1560179707-f14e90ef3623?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80"
						}
						alt="Organization Logo"
					/>
					<ProfileName>
						<Name>{organization.name}</Name>
					</ProfileName>

					<ArrowRight size={14} style={{ color: "#64748b" }} />
				</ProfileHeader>

				<InfoItem onClick={() => setScreen("domains")}>
					<InfoLabel>Verified Domains</InfoLabel>
					<InfoContent>
						<div
							style={{
								flex: 1,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							Add verified domains for smooth onboarding
						</div>
						<ArrowRight size={14} style={{ color: "#64748b" }} />
					</InfoContent>
				</InfoItem>

				<InfoItem onClick={() => setScreen("members")}>
					<InfoLabel>Manage Members</InfoLabel>
					<InfoContent>
						<div
							style={{
								flex: 1,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							Manage existing members and their roles
						</div>
						<ArrowRight size={14} style={{ color: "#64748b" }} />
					</InfoContent>
				</InfoItem>

				<InfoItem onClick={() => setScreen("members")}>
					<InfoLabel>Organization Roles</InfoLabel>
					<InfoContent>
						<div
							style={{
								flex: 1,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							Manage access to your organization resources
						</div>
						<ArrowRight size={14} style={{ color: "#64748b" }} />
					</InfoContent>
				</InfoItem>

				<SectionTitle style={{ marginTop: "32px", marginBottom: "16px" }}>
					Administration
				</SectionTitle>

				<InfoItem onClick={() => setScreen("billing")}>
					<InfoLabel>Billing & Usage</InfoLabel>
					<InfoContent>
						<div
							style={{
								flex: 1,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							Manage your billing profile and active subscriptions
						</div>
						<ArrowRight size={14} style={{ color: "#64748b" }} />
					</InfoContent>
				</InfoItem>

				<InfoItem onClick={() => setScreen("security")}>
					<InfoLabel>Access & Security</InfoLabel>
					<InfoContent>
						<div
							style={{
								flex: 1,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							Manage organization access and security settings
						</div>
						<ArrowRight size={14} style={{ color: "#64748b" }} />
					</InfoContent>
				</InfoItem>

				<InfoItem onClick={() => setScreen("security")}>
					<InfoLabel>Audit Logs</InfoLabel>
					<InfoContent>
						<div
							style={{
								flex: 1,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							Track organization activity and changes
						</div>
						<ArrowRight size={14} style={{ color: "#64748b" }} />
					</InfoContent>
				</InfoItem>
			</ProfileSection>
		</>
	);
};

const SectionHeader = ({ title }: { title: string }) => {
	const { setScreen } = useContext(ScreenContext);

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "8px",
				fontSize: 14,
			}}
		>
			<BackButton onClick={() => setScreen(null)}>
				<ArrowLeft size={16} />
			</BackButton>
			<SectionTitle>{title}</SectionTitle>
		</div>
	);
};

const GeneralSettingsSection = () => {
	const { activeOrganization: selectedOrganization, loading } =
		useActiveOrganization();
	const [name, setName] = useState(selectedOrganization?.name || "");
	const [description, setDescription] = useState(
		selectedOrganization?.description || "",
	);
	const [image, setImage] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(
		selectedOrganization?.image_url || null,
	);
	const [successMessage, setSuccessMessage] = useState("");
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	React.useEffect(() => {
		if (selectedOrganization) {
			setName(selectedOrganization.name || "");
			setDescription(selectedOrganization.description || "");
			setPreviewUrl(selectedOrganization.image_url || null);
		}
	}, [selectedOrganization]);

	if (loading || !selectedOrganization) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					padding: "40px 0",
				}}
			>
				<Spinner />
			</div>
		);
	}

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files?.[0]) {
			const file = event.target.files[0];
			setImage(file);
			setPreviewUrl(URL.createObjectURL(file));
		}
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Update organization", { name, description, image });
		setSuccessMessage("Organization details updated successfully");
		setTimeout(() => setSuccessMessage(""), 3000);
	};

	const handleLeaveOrg = () => {};

	return (
		<div>
			<SectionHeader title="Organization Settings" />

			{successMessage && (
				<div
					style={{
						marginBottom: "20px",
						padding: "8px",
						background: "#dcfce7",
						color: "#166534",
						borderRadius: "4px",
						display: "flex",
						alignItems: "center",
						gap: "8px",
					}}
				>
					<CheckCircle size={16} />
					{successMessage}
				</div>
			)}

			<form onSubmit={handleSubmit} style={{ width: "100%" }}>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						textAlign: "center",
						marginBottom: "24px",
					}}
				>
					<div style={{ position: "relative", marginBottom: "16px" }}>
						<button
							type="button"
							onClick={triggerFileInput}
							style={{
								background: "none",
								border: "none",
								padding: 0,
								cursor: "pointer",
							}}
						>
							<div
								style={{
									width: "100px",
									height: "100px",
									borderRadius: "12px",
									overflow: "hidden",
									boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
								}}
							>
								{previewUrl ? (
									<img
										src={previewUrl}
										alt="Organization Logo"
										style={{
											width: "100%",
											height: "100%",
											objectFit: "cover",
										}}
									/>
								) : (
									<Building size={36} color="#64748b" />
								)}
							</div>
							<input
								type="file"
								ref={fileInputRef}
								style={{ display: "none" }}
								accept="image/*"
								onChange={handleImageChange}
							/>
						</button>
						<div
							style={{ fontSize: "13px", color: "#64748b", marginTop: "8px" }}
						>
							Click to upload a new logo
						</div>
					</div>
				</div>

				<div>
					<FormGroup>
						<Label>Organization Name</Label>
						<Input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Organization Name"
							style={{
								width: "100%",
								padding: "10px 12px",
								borderRadius: "6px",
								fontSize: "14px",
								backgroundColor: "#fff",
							}}
						/>
					</FormGroup>
				</div>

				<div style={{ marginTop: "16px" }}>
					<button
						type="submit"
						style={{
							width: "100%",
							padding: "9px 16px",
							background: "#6366f1",
							color: "white",
							border: "none",
							borderRadius: "8px",
							fontWeight: 500,
							fontSize: "14px",
							cursor: "pointer",
							transition: "background-color 0.2s",
						}}
					>
						Save Changes
					</button>
				</div>

				<div style={{ marginTop: "40px" }}>
					<LeaveOrgAccordion handleLeaveOrg={handleLeaveOrg} />
				</div>
			</form>
		</div>
	);
};

const LeaveOrgAccordion = ({
	handleLeaveOrg,
}: {
	handleLeaveOrg: () => void;
}) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div
			style={{
				paddingTop: "16px",
				borderTop: "1px solid #e2e8f0",
			}}
		>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					width: "100%",
					padding: "8px 0",
					background: "transparent",
					border: "none",
					cursor: "pointer",
					textAlign: "left",
					color: "#ef4444",
					fontWeight: 500,
					fontSize: "14px",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
					<AlertTriangle size={16} />
					Leave Organization
				</div>
				<div style={{ transition: "transform 0.2s ease" }}>
					{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
				</div>
			</button>

			{isOpen && (
				<div
					style={{
						padding: "16px",
						background: "#fef2f2",
						borderRadius: "8px",
						marginTop: "8px",
					}}
				>
					<p
						style={{
							fontSize: "14px",
							color: "#4b5563",
							margin: "0 0 16px 0",
							lineHeight: "1.5",
						}}
					>
						Leaving this organization will remove your access to all resources,
						projects, and data within this organization. This action cannot be
						undone.
					</p>
					<button
						type="button"
						onClick={handleLeaveOrg}
						style={{
							padding: "8px 16px",
							backgroundColor: "#dc2626",
							border: "none",
							borderRadius: "6px",
							fontSize: "14px",
							fontWeight: 500,
							color: "white",
							cursor: "pointer",
						}}
					>
						Leave Organization
					</button>
				</div>
			)}
		</div>
	);
};

const Badge = styled.span`
  background: #fff8e6;
  color: #854d0e;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DomainItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }
`;

const DomainContent = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const DomainInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #64748b;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #1e293b;
`;

const DomainsSection = () => {
	const {
		activeOrganization,
		loading,
		getDomains: getOrganizationDomains,
	} = useActiveOrganization();

	const {
		data: domains = [],
		isLoading,
		mutate,
	} = useSWR(
		activeOrganization?.id ? `/domains/${activeOrganization.id}` : null,
		() => getOrganizationDomains?.() || [],
		{
			refreshInterval: 30000,
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			dedupingInterval: 5000,
		},
	);

	const [isAddingDomain, setIsAddingDomain] = useState(false);
	const [activeDomain, setActiveDomain] = useState<string | null>(null);
	const [domainInVerification, setDomainInVerification] = useState<
		string | null
	>(null);

	const handleDeleteDomain = async (domainId: string) => {
		console.log(domainId);
		mutate();
	};

	const handleVerifyDomain = async (domainId: string) => {
		setDomainInVerification(domainId);
	};

	if (loading || isLoading) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					padding: "40px 0",
				}}
			>
				<Spinner />
			</div>
		);
	}

	return (
		<>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<SectionHeader title="Organization Domains" />
				<div style={{ position: "relative" }}>
					<Button
						$primary
						style={{ padding: "6px 12px" }}
						onClick={() => setIsAddingDomain(true)}
					>
						<Plus size={16} />
						<span>New Domain</span>
					</Button>
					{isAddingDomain && (
						<AddDomainPopover onClose={() => setIsAddingDomain(false)} />
					)}
				</div>
			</div>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
				}}
			>
				{!domains?.length ? (
					<div
						style={{
							textAlign: "center",
							padding: "20px",
							color: "#64748b",
						}}
					>
						No domains added
					</div>
				) : (
					domains.map((domain) => (
						<DomainItem key={domain.id}>
							<DomainContent>
								<IconWrapper>
									<Globe size={18} />
								</IconWrapper>
								<DomainInfo>
									<div
										style={{
											fontSize: "14px",
											fontWeight: 500,
											color: "#1e293b",
										}}
									>
										{domain.fqdn}
									</div>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "8px",
										}}
									>
										<Badge>
											<AlertTriangle size={12} />
											Pending Verification
										</Badge>
										<span style={{ fontSize: "12px", color: "#64748b" }}>
											Added 2 days ago
										</span>
									</div>
								</DomainInfo>
							</DomainContent>
							<div style={{ position: "relative" }}>
								<IconButton
									onClick={() =>
										setActiveDomain(
											activeDomain === domain.id ? null : domain.id,
										)
									}
								>
									<MoreVertical size={16} />
								</IconButton>
								{domainInVerification === domain.id && (
									<AddDomainPopover
										domain={domain}
										onClose={() => setDomainInVerification(null)}
									/>
								)}
								{domainInVerification !== domain.id && (
									<Dropdown
										isOpen={activeDomain === domain.id}
										onClose={() => setActiveDomain(null)}
										position={{ right: 0 }}
									>
										{!domain.verified && (
											<DropdownItem
												style={{ width: 180 }}
												onClick={() => {
													handleVerifyDomain(domain.id);
												}}
											>
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: "8px",
													}}
												>
													<CheckCircle size={16} color="#6366f1" />
													Verify Domain
												</div>
											</DropdownItem>
										)}
										<DropdownItem
											onClick={() => console.log("copy", domain.fqdn)}
										>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "8px",
												}}
											>
												<Copy size={16} color="#64748b" />
												Copy Domain
											</div>
										</DropdownItem>
										<DropdownItem
											onClick={() =>
												window.open(`https://${domain.fqdn}`, "_blank")
											}
										>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "8px",
												}}
											>
												<ExternalLink size={16} color="#64748b" />
												Visit Domain
											</div>
										</DropdownItem>
										<DropdownDivider />
										<DropdownItem
											$destructive
											onClick={() => handleDeleteDomain(domain.id)}
										>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "8px",
												}}
											>
												<Trash size={16} color="#ef4444" />
												Remove Domain
											</div>
										</DropdownItem>
									</Dropdown>
								)}
							</div>
						</DomainItem>
					))
				)}
			</div>
		</>
	);
};

const MembersSection = () => {
	const {
		activeOrganization: selectedOrganization,
		loading,
		getMembers,
		getInvitations,
	} = useActiveOrganization();

	const { data: members = [], isLoading: membersLoading } = useSWR(
		selectedOrganization
			? `/api/organizations/${selectedOrganization.id}/members`
			: null,
		() => getMembers(),
	);

	const { data: invitations = [], isLoading: invitationsLoading } = useSWR(
		selectedOrganization
			? `/api/organizations/${selectedOrganization.id}/invitations`
			: null,
		() => getInvitations(),
	);

	console.log(members, invitations);

	if (loading || invitationsLoading || membersLoading) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					padding: "40px 0",
				}}
			>
				<Spinner />
			</div>
		);
	}

	return (
		<div>
			<SectionHeader title="Members" />

			<p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
				Manage organization members and their roles.
			</p>

			<div style={{ marginBottom: "16px" }}>
				<Button
					$primary
					type="button"
					style={{ display: "flex", alignItems: "center", gap: "8px" }}
				>
					<Plus size={16} />
					Invite Member
				</Button>
			</div>

			<div
				style={{
					color: "#64748b",
					fontSize: "14px",
					textAlign: "center",
					padding: "40px 0",
				}}
			>
				Member management interface would go here
			</div>
		</div>
	);
};

// Billing Management Section
const BillingSection = () => {
	const { activeOrganization: selectedOrganization, loading } =
		useActiveOrganization();

	if (loading || !selectedOrganization) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					padding: "40px 0",
				}}
			>
				<Spinner />
			</div>
		);
	}

	return (
		<div>
			<SectionHeader title="Billing" />

			<p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
				Manage your organization's billing settings and subscription.
			</p>

			<div
				style={{
					color: "#64748b",
					fontSize: "14px",
					textAlign: "center",
					padding: "40px 0",
				}}
			>
				Billing management interface would go here
			</div>
		</div>
	);
};

const SecuritySection = () => {
	const { activeOrganization: selectedOrganization, loading } =
		useActiveOrganization();

	if (loading || !selectedOrganization) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					padding: "40px 0",
				}}
			>
				<Spinner />
			</div>
		);
	}

	return (
		<div>
			<SectionHeader title="Security" />

			<p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
				Manage security settings for your organization.
			</p>

			<div
				style={{
					color: "#64748b",
					fontSize: "14px",
					textAlign: "center",
					padding: "40px 0",
				}}
			>
				Security settings interface would go here
			</div>
		</div>
	);
};

export const ManageOrganization = () => {
	const { loading } = useActiveOrganization();
	const [screen, setScreen] = useState<Screen>(null);

	if (loading)
		return (
			<Container
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<Spinner />
			</Container>
		);

	return (
		<TypographyProvider>
			<ScreenContext.Provider value={{ screen, setScreen }}>
				<Container>
					<Layout>
						<div
							style={{
								position: "relative",
								width: "100%",
								overflow: "hidden",
							}}
						>
							<MainContent $isAdding={!!screen}>
								<OrganizationManagementSection />
							</MainContent>

							<AddItemForm $isVisible={!!screen}>
								{match(screen)
									.with("general", () => <GeneralSettingsSection />)
									.with("domains", () => <DomainsSection />)
									.with("members", () => <MembersSection />)
									.with("billing", () => <BillingSection />)
									.with("security", () => <SecuritySection />)
									.otherwise(() => null)}
							</AddItemForm>
						</div>
					</Layout>
				</Container>
			</ScreenContext.Provider>
		</TypographyProvider>
	);
};

export default ManageOrganization;
