import { useState } from "react";
import styled from "styled-components";
import {
	User,
	Shield,
	ArrowRight,
	ArrowLeft,
	MoreVertical,
	LogOut,
	Ban,
	Plus,
} from "lucide-react";
import { EmailAddPopover } from "@/components/user/add-email-popover";
import { PhoneAddPopover } from "@/components/user/add-phone-popover";
import { Dropdown, DropdownItem } from "@/components/utility/dropdown";
import { useUser } from "@/hooks/use-user";

export const TypographyProvider = styled.div`
	* {
		box-sizing: border-box;
  		font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
	}
`;

const Container = styled.div`
  max-width: 1000px;
  height: 600px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  padding: 24px 16px;
  transition: all 0.3s ease;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 16px;
  }
`;

const Sidebar = styled.div`
  @media (min-width: 601px) {
    position: sticky;
    top: 16px;
    height: fit-content;
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
  grid-template-columns: 240px 1fr;
  gap: 32px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const MenuItem = styled.div<{ active?: boolean }>`
  padding: 8px 12px;
  margin: 2px 0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  font-size: 14px;
  align-items: center;
  gap: 8px;
  background: ${(props) => (props.active ? "#f8f7f4" : "transparent")};
  color: ${(props) => (props.active ? "#1e293b" : "#64748b")};
  font-weight: ${(props) => (props.active ? "500" : "normal")};
  transition: all 0.2s ease;

  &:hover {
    background: #f8f7f4;
  }
`;

const Title = styled.h1`
  font-size: 20px;
  margin: 0;
  color: #1e293b;
  font-weight: 500;
`;

const Subtitle = styled.p`
  color: #6366F1;
  font-size: 14px;
  margin: 0;
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  color: #1e293b;
  margin-bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProfileHeader = styled.div`
  display: flex;
  padding: 0 8px;
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
  @media (max-width: 600px) {
    width: 60px;
    height: 60px;
  }
`;

const ProfileName = styled.div`
  flex: 1;
`;

const Name = styled.h2`
  font-size: 16px;
  margin: 0;
  color: #1e293b;
`;

const EditButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: #f8f7f4;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f1efe9;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  gap: 12px;
  color: #1e293b;
  cursor: pointer;
  margin: 0 -8px;
  border-radius: 4px;
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

const LastLogin = styled.div`
  font-size: 13px;
  color: #64748b;
  margin-top: 8px;
  display: flex;
  align-items: center;
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

const Badge = styled.span`
  background: #E0E7FF;
  color: #4F46E5;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 500;
`;

const EmailItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  transition: all 0.2s ease;
`;

const EmailContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const SidebarTitle = styled.div`
  display: flex;
  flex-direction: column;
`;

const AddItemForm = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 100%;
  width: 100%;
  height: 100%;
  background: white;
  padding: 24px;
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

const OutlinedButton = styled.button`
  background: none;
  border: 1px solid #e2e8f0;
  color: #1e293b;
  padding: 4px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  &:hover {
    background: #f8fafc;
  }
`;

const SessionDropdown = ({
	isOpen,
	onClose,
	sessionId,
	location,
	onLogout,
	onBanIp,
}: {
	isOpen: boolean;
	onClose: () => void;
	sessionId: string;
	location: string;
	onLogout: (id: string) => void;
	onBanIp: (ip: string) => void;
}) => {
	return (
		<Dropdown isOpen={isOpen} onClose={onClose} position={{ right: 0 }}>
			<DropdownItem onClick={() => onLogout(sessionId)}>
				<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
					<LogOut size={14} />
					Logout Session
				</div>
			</DropdownItem>
			<DropdownItem $destructive onClick={() => onBanIp(location)}>
				<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
					<Ban size={14} />
					Ban IP Address
				</div>
			</DropdownItem>
		</Dropdown>
	);
};

export const ManageAccount = () => {
	const [activeTab, setActiveTab] = useState("manage-account");
	const [intermediateScreen, setIntermediateScreen] = useState<
		"email" | "phone" | "social" | null
	>(null);
	const [activeEmail, setActiveEmail] = useState<string | null>(null);
	const [activePhone, setActivePhone] = useState<string | null>(null);
	const [isAddingEmail, setIsAddingEmail] = useState(false);
	const [isAddingPhone, setIsAddingPhone] = useState(false);
	const [activeSession, setActiveSession] = useState<string | null>(null);
	const [newEmail, setNewEmail] = useState("");
	const [newPhone, setNewPhone] = useState("");
	const [emailIdInAction, setEmailIdInAction] = useState<string | null>(null);
	const [phoneIdInAction, setPhoneIdInAction] = useState<string | null>(null);

	const logoutSession = (sessionId: string) => {
		console.log("Logging out session:", sessionId);
	};

	const banIpAddress = (ipAddress: string) => {
		console.log("Banning IP address:", ipAddress);
	};
	const {
		user,
		loading,
		createEmailAddress,
		deleteEmailAddress,
		prepareEmailVerification,
		attemptEmailVerification,
		createPhoneNumber,
		deletePhoneNumber,
		preparePhoneVerification,
		attemptPhoneVerification,
		makePhonePrimary,
	} = useUser();

	const disconnectAccount = (connectionId: number) => {
		console.log("Disconnect account:", connectionId);
	};

	const handleCloseDropdown = () => {
		setActiveSession(null);
	};

	const handlePrepareVerification = async (id: string) => {
		await prepareEmailVerification(id);
	};

	const handlePreparePhoneVerification = async (id: string) => {
		await preparePhoneVerification(id);
	};

	const handleMakePrimary = async (id: string) => {
		// Add your logic to make email primary
		console.log(id);
		setActiveEmail(null);
	};

	const handleMakePhonePrimary = async (id: string) => {
		await makePhonePrimary(id);
		setActivePhone(null);
		user.refetch();
	};

	if (loading) return null;

	const renderContent = () => {
		if (activeTab === "manage-account") {
			return (
				<>
					<SectionTitle style={{ marginBottom: "20px" }}>
						Account Details
					</SectionTitle>
					<ProfileSection>
						<ProfileHeader>
							<Avatar
								src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
								alt="Profile"
							/>
							<ProfileName>
								<Name>
									{user?.first_name} {user?.last_name}
								</Name>
							</ProfileName>

							<ArrowRight size={14} style={{ color: "#64748b" }} />
						</ProfileHeader>

						<InfoItem onClick={() => setIntermediateScreen("email")}>
							<InfoLabel>Email addresses</InfoLabel>
							<InfoContent>
								<div
									style={{
										flex: 1,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{user?.user_email_addresses?.length
										? user.user_email_addresses
												.map((email) => email.email)
												.join(", ")
										: "No email addresses added"}
								</div>
								<ArrowRight size={14} style={{ color: "#64748b" }} />
							</InfoContent>
						</InfoItem>

						<InfoItem onClick={() => setIntermediateScreen("phone")}>
							<InfoLabel>Phone number</InfoLabel>
							<InfoContent>
								<div
									style={{
										flex: 1,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{user?.user_phone_numbers?.length
										? user.user_phone_numbers
												.map((phone) => phone.phone_number)
												.join(", ")
										: "No phone numbers added"}
								</div>
								<ArrowRight size={14} style={{ color: "#64748b" }} />
							</InfoContent>
						</InfoItem>

						<InfoItem onClick={() => setIntermediateScreen("social")}>
							<InfoLabel>Connected accounts</InfoLabel>
							<InfoContent>
								<div
									style={{
										flex: 1,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{user?.social_connections?.length
										? user.social_connections
												.map(
													(conn) => `${conn.provider} • ${conn.email_address}`,
												)
												.join(", ")
										: "No accounts connected"}
								</div>
								<ArrowRight size={14} style={{ color: "#64748b" }} />
							</InfoContent>
						</InfoItem>

						<SectionTitle style={{ marginTop: "32px", marginBottom: "16px" }}>
							Security settings
						</SectionTitle>

						<InfoItem onClick={() => setActiveTab("security")}>
							<InfoLabel>Password</InfoLabel>
							<InfoContent>
								<div
									style={{
										flex: 1,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									Last changed 3 months ago
								</div>
								<ArrowRight size={14} style={{ color: "#64748b" }} />
							</InfoContent>
						</InfoItem>

						<InfoItem onClick={() => setActiveTab("security")}>
							<InfoLabel>
								Two Factor Verification
								{user.second_factor_policy}
							</InfoLabel>
							<InfoContent>
								<div
									style={{
										flex: 1,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{user.second_factor_policy === "none"
										? "Add a second layer of security to your account"
										: "Set up your second factors"}
								</div>
								<ArrowRight size={14} style={{ color: "#64748b" }} />
							</InfoContent>
						</InfoItem>
					</ProfileSection>
				</>
			);
		}

		return (
			<>
				<ProfileSection>
					<SectionTitle>Active Sessions</SectionTitle>
					{user.sessions.map((session) => (
						<div
							key={session.id}
							style={{
								display: "flex",
								alignItems: "center",
								padding: "16px",
								background:
									activeSession === session.id ? "#f8fafc" : "transparent",
								borderRadius: "8px",
								marginTop: "12px",
								position: "relative",
							}}
						>
							<div style={{ marginRight: "16px" }}>
								{/* <FirefoxIcon style={{ width: 24, height: 24 }} /> */}
							</div>
							<div style={{ flex: 1 }}>
								<div
									style={{
										fontSize: "14px",
										color: "#1e293b",
										fontWeight: 500,
									}}
								>
									{session.browser}
								</div>
								<LastLogin>
									<div>{session.location}</div>
									<div>{session.id}</div>
								</LastLogin>
							</div>
							<div style={{ position: "relative" }}>
								<IconButton
									onClick={() =>
										setActiveSession(
											activeSession === session.id ? null : session.id,
										)
									}
								>
									<MoreVertical size={16} />
								</IconButton>
								<SessionDropdown
									isOpen={activeSession === session.id}
									onClose={handleCloseDropdown}
									sessionId={session.id}
									location={session.location}
									onLogout={logoutSession}
									onBanIp={banIpAddress}
								/>
							</div>
						</div>
					))}
				</ProfileSection>
			</>
		);
	};

	return (
		<TypographyProvider>
			<Container>
				<Layout>
					<Sidebar>
						<SidebarHeader>
							<SidebarTitle>
								<Title>Account</Title>
								<Subtitle>Manage your account info</Subtitle>
							</SidebarTitle>
						</SidebarHeader>
						<MenuItem
							active={activeTab === "manage-account"}
							onClick={() => setActiveTab("manage-account")}
						>
							<User size={16} />
							Manage Account
						</MenuItem>
						<MenuItem
							active={activeTab === "active-sessions"}
							onClick={() => setActiveTab("active-sessions")}
						>
							<Shield size={16} />
							Active Sessions
						</MenuItem>
					</Sidebar>

					<div
						style={{ position: "relative", width: "100%", overflow: "hidden" }}
					>
						<MainContent $isAdding={!!intermediateScreen}>
							{renderContent()}
						</MainContent>

						<AddItemForm $isVisible={!!intermediateScreen}>
							<BackButton onClick={() => setIntermediateScreen(null)}>
								<ArrowLeft size={16} />
								Back to profile
							</BackButton>
							{intermediateScreen === "email" && (
								<>
									<SectionTitle style={{ fontSize: "14px", margin: "6px 0" }}>
										<span style={{ fontWeight: 500 }}>Email addresses</span>
										<div style={{ position: "relative" }}>
											<OutlinedButton onClick={() => setIsAddingEmail(true)}>
												<Plus size={16} />
											</OutlinedButton>
											{isAddingEmail && (
												<EmailAddPopover
													onClose={() => setIsAddingEmail(false)}
													onAddEmail={async (email) => {
														const newEmail = await createEmailAddress(email);
														setNewEmail(newEmail.data.id);
														await prepareEmailVerification(newEmail.data.id);
														user.refetch();
													}}
													onPrepareVerification={async () => {
														await prepareEmailVerification(newEmail);
														user.refetch();
													}}
													onAttemptVerification={async (otp) => {
														await attemptEmailVerification(newEmail, otp);
														user.refetch();
													}}
												/>
											)}
										</div>
									</SectionTitle>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "4px",
										}}
									>
										{!user?.user_email_addresses?.length ? (
											<div
												style={{
													textAlign: "center",
													padding: "20px",
													color: "#64748b",
												}}
											>
												No email addresses added
											</div>
										) : (
											user.user_email_addresses.map((email) => (
												<EmailItem key={email.email}>
													<EmailContent>
														<div
															style={{
																fontSize: "14px",
																color: "#1e293b",
																display: "flex",
																alignItems: "center",
																gap: "8px",
															}}
														>
															{email.email}
															{email.id === user?.primary_email_address_id && (
																<Badge>Primary</Badge>
															)}
															<Badge>
																{!email.verified ? "Not Verified" : "Verified"}
															</Badge>
														</div>
													</EmailContent>
													<div style={{ position: "relative" }}>
														<IconButton
															onClick={() =>
																setActiveEmail(
																	activeEmail === email.id ? null : email.id,
																)
															}
														>
															<MoreVertical size={16} />
														</IconButton>
														{emailIdInAction === email.id && (
															<EmailAddPopover
																existingEmail={email.email}
																onClose={() => setEmailIdInAction(null)}
																onAddEmail={async (email) => {
																	const newEmail =
																		await createEmailAddress(email);
																	setNewEmail(newEmail.data.id);
																	await prepareEmailVerification(
																		newEmail.data.id,
																	);
																	user.refetch();
																}}
																onPrepareVerification={async () => {
																	await prepareEmailVerification(newEmail);
																	user.refetch();
																}}
																onAttemptVerification={async (otp) => {
																	await attemptEmailVerification(email.id, otp);
																	user.refetch();
																}}
															/>
														)}
														{!emailIdInAction && (
															<Dropdown
																isOpen={activeEmail === email.id}
																onClose={() => setActiveEmail(null)}
																position={{ right: 0 }}
															>
																{!email.verified && (
																	<DropdownItem
																		onClick={() => {
																			handlePrepareVerification(email.id);
																			setEmailIdInAction(email.id);
																		}}
																	>
																		Verify email
																	</DropdownItem>
																)}
																{email.id !==
																	user?.primary_email_address_id && (
																	<DropdownItem
																		onClick={() => handleMakePrimary(email.id)}
																	>
																		Make primary
																	</DropdownItem>
																)}
																<DropdownItem
																	$destructive
																	onClick={() => deleteEmailAddress(email.id)}
																>
																	Remove
																</DropdownItem>
															</Dropdown>
														)}
													</div>
												</EmailItem>
											))
										)}
									</div>
								</>
							)}
							{intermediateScreen === "phone" && (
								<>
									<SectionTitle style={{ fontSize: "14px", margin: "6px 0" }}>
										<span style={{ fontWeight: 500 }}>Phone number</span>
										<div style={{ position: "relative" }}>
											<OutlinedButton onClick={() => setIsAddingPhone(true)}>
												<Plus size={16} />
											</OutlinedButton>
											{isAddingPhone && (
												<PhoneAddPopover
													onClose={() => setIsAddingPhone(false)}
													onAddPhone={async (phone) => {
														const newPhone = await createPhoneNumber(phone);
														setNewPhone(newPhone.data.id);
														await preparePhoneVerification(newPhone.data.id);
														user.refetch();
													}}
													onPrepareVerification={async () => {
														await preparePhoneVerification(newPhone);
														user.refetch();
													}}
													onAttemptVerification={async (otp) => {
														await attemptPhoneVerification(newPhone, otp);
														user.refetch();
													}}
												/>
											)}
										</div>
									</SectionTitle>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "12px",
										}}
									>
										{!user?.user_phone_numbers?.length ? (
											<div
												style={{
													textAlign: "center",
													padding: "20px",
													color: "#64748b",
												}}
											>
												No phone numbers added
											</div>
										) : (
											user.user_phone_numbers.map((phone) => (
												<EmailItem key={phone.phone_number}>
													<EmailContent>
														<div
															style={{
																fontSize: "14px",
																color: "#1e293b",
																display: "flex",
																alignItems: "center",
																gap: "8px",
															}}
														>
															{phone.phone_number}
															{phone.id === user?.primary_email_address_id && (
																<Badge>Primary</Badge>
															)}
															<Badge>
																{!phone.verified ? "Not Verified" : "Verified"}
															</Badge>
														</div>
													</EmailContent>
													<div style={{ position: "relative" }}>
														<IconButton
															onClick={() =>
																setActivePhone(
																	activePhone === phone.id ? null : phone.id,
																)
															}
														>
															<MoreVertical size={16} />
														</IconButton>
														{phoneIdInAction === phone.id && (
															<PhoneAddPopover
																existingPhone={phone.phone_number}
																onClose={() => setPhoneIdInAction(null)}
																onAddPhone={async (phone) => {
																	const newPhone =
																		await createPhoneNumber(phone);
																	setNewPhone(newPhone.data.id);
																	await preparePhoneVerification(
																		newPhone.data.id,
																	);
																	user.refetch();
																}}
																onPrepareVerification={async () => {
																	await preparePhoneVerification(newPhone);
																	user.refetch();
																}}
																onAttemptVerification={async (otp) => {
																	await attemptPhoneVerification(phone.id, otp);
																	user.refetch();
																}}
															/>
														)}
														{!phoneIdInAction && (
															<Dropdown
																isOpen={activePhone === phone.id}
																onClose={() => setActivePhone(null)}
																position={{ right: 0 }}
															>
																{!phone.verified && (
																	<DropdownItem
																		onClick={() => {
																			handlePreparePhoneVerification(phone.id);
																			setPhoneIdInAction(phone.id);
																		}}
																	>
																		Verify phone
																	</DropdownItem>
																)}
																{phone.id !== user?.primary_phone_number_id && (
																	<DropdownItem
																		onClick={async () => {
																			await handleMakePhonePrimary(phone.id);
																			setActivePhone(null);
																			user.refetch();
																		}}
																	>
																		Make primary
																	</DropdownItem>
																)}
																<DropdownItem
																	$destructive
																	onClick={async () => {
																		await deletePhoneNumber(phone.id);
																		user.refetch();
																	}}
																>
																	Remove
																</DropdownItem>
															</Dropdown>
														)}
													</div>
												</EmailItem>
											))
										)}
									</div>
								</>
							)}
							{intermediateScreen === "social" && (
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "24px",
									}}
								>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "12px",
										}}
									>
										{!user?.social_connections?.length ? (
											<div
												style={{
													textAlign: "center",
													padding: "20px",
													color: "#64748b",
												}}
											>
												No accounts connected
											</div>
										) : (
											user.social_connections.map((account) => (
												<div
													key={account.provider + account.email_address}
													style={{
														display: "flex",
														alignItems: "center",
														justifyContent: "space-between",
														padding: "12px",
														background: "#f8fafc",
														borderRadius: "8px",
													}}
												>
													<div
														style={{
															display: "flex",
															flexDirection: "column",
															gap: "4px",
														}}
													>
														<div style={{ fontSize: "14px", color: "#1e293b" }}>
															{account.provider}
														</div>
														<div style={{ fontSize: "12px", color: "#64748b" }}>
															{account.email_address}
														</div>
													</div>
													<EditButton
														onClick={() => disconnectAccount(account.id)}
														style={{ background: "#fee2e2", color: "#ef4444" }}
													>
														Disconnect
													</EditButton>
												</div>
											))
										)}
									</div>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "12px",
										}}
									>
										<EditButton
											style={{ width: "100%", justifyContent: "center" }}
										>
											Continue with Google
										</EditButton>
										<EditButton
											style={{ width: "100%", justifyContent: "center" }}
										>
											Continue with GitHub
										</EditButton>
										<EditButton
											style={{ width: "100%", justifyContent: "center" }}
										>
											Continue with Microsoft
										</EditButton>
									</div>
								</div>
							)}
						</AddItemForm>
					</div>
				</Layout>
			</Container>
		</TypographyProvider>
	);
};

export default ManageAccount;
