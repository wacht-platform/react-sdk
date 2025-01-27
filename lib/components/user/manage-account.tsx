import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import {
  User,
  Shield,
  Edit2,
  ArrowRight,
  ArrowLeft,
  MoreVertical,
  LogOut,
  Ban,
} from "lucide-react";
import { TypographyProvider } from "../utility/typography";
import { useUser } from "../../hooks/use-user";
import { FirefoxIcon } from "../icons/firefox";

const Container = styled.div`
  max-width: 1000px;
  height: 650px;
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
  font-weight: 500;
`;

const ProfileHeader = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const Avatar = styled.img`
  width: 80px;
  height: 80px;
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
  font-size: 20px;
  margin: 0;
  color: #1e293b;
  font-weight: 500;
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
  width: 160px;
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

const DropdownMenu = styled.div<{ $openUpwards?: boolean }>`
  position: absolute;
  right: 0;
  ${(props) => (props.$openUpwards ? "bottom: 100%;" : "top: 100%;")}
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  min-width: 180px;
  z-index: 10;
  overflow: hidden;
  margin-top: ${(props) => (props.$openUpwards ? "0" : "4px")};
  margin-bottom: ${(props) => (props.$openUpwards ? "4px" : "0")};
`;

const DropdownItem = styled.button<{ $destructive?: boolean }>`
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${(props) => (props.$destructive ? "#ef4444" : "#1e293b")};
  transition: background-color 0.2s ease;

  &:hover {
    background: ${(props) => (props.$destructive ? "#fee2e2" : "#f8fafc")};
  }
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
  gap: 24px;
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
  margin-bottom: 24px;
  
  &:hover {
    color: #1e293b;
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [openUpwards, setOpenUpwards] = useState(false);

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

      // Check if dropdown should open upwards
      if (dropdownRef.current) {
        const dropdownRect = dropdownRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - dropdownRect.bottom;
        const requiredSpace = 100; // Approximate height of dropdown
        setOpenUpwards(spaceBelow < requiredSpace);
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <DropdownMenu ref={dropdownRef} $openUpwards={openUpwards}>
      <DropdownItem onClick={() => onLogout(sessionId)}>
        <LogOut size={14} />
        Logout Session
      </DropdownItem>
      <DropdownItem $destructive onClick={() => onBanIp(location)}>
        <Ban size={14} />
        Ban IP Address
      </DropdownItem>
    </DropdownMenu>
  );
};

export const ManageAccount = () => {
  const [activeTab, setActiveTab] = useState("manage-account");
  const [addingItem, setAddingItem] = useState<
    "email" | "phone" | "social" | null
  >(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const logoutSession = (sessionId: string) => {
    // Mock implementation
    console.log("Logging out session:", sessionId);
  };

  const banIpAddress = (ipAddress: string) => {
    // Mock implementation
    console.log("Banning IP address:", ipAddress);
  };
  const { user } = useUser();

  const removeEmail = (email: string) => {
    // Mock implementation
    console.log("Remove email:", email);
  };

  const removePhone = (phone: string) => {
    // Mock implementation
    console.log("Remove phone:", phone);
  };

  const disconnectAccount = (provider: string) => {
    // Mock implementation
    console.log("Disconnect account:", provider);
  };

  const handleCloseDropdown = () => {
    setActiveSession(null);
  };

  const renderContent = () => {
    if (activeTab === "manage-account") {
      return (
        <>
          <SectionTitle style={{ marginBottom: "16px" }}>
            Account Details
          </SectionTitle>
          <ProfileSection>
            <ProfileHeader>
              <Avatar
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Profile"
              />
              <ProfileName>
                <Name>Arlene McCoy</Name>
              </ProfileName>
              <EditButton>
                <Edit2 size={16} />
                Edit profile
              </EditButton>
            </ProfileHeader>

            <InfoItem onClick={() => setAddingItem("email")}>
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
                  example@gmail.com, example@personal.com, email@work.io
                </div>
                <ArrowRight size={14} style={{ color: "#64748b" }} />
              </InfoContent>
            </InfoItem>

            <InfoItem onClick={() => setAddingItem("phone")}>
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
                  +1(555)123-4567
                </div>
                <ArrowRight size={14} style={{ color: "#64748b" }} />
              </InfoContent>
            </InfoItem>

            <InfoItem onClick={() => setAddingItem("social")}>
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
                  Google • example@email.com
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
              <InfoLabel>Authenticator App</InfoLabel>
              <InfoContent>
                <div
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Add a second layer of security to your account
                </div>
                <ArrowRight size={14} style={{ color: "#64748b" }} />
              </InfoContent>
            </InfoItem>

            <InfoItem onClick={() => setActiveTab("security")}>
              <InfoLabel>Backup codes</InfoLabel>
              <InfoContent>
                <div
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Generate backup codes for emergency access
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
                <FirefoxIcon style={{ width: 24, height: 24 }} />
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
            <MainContent $isAdding={!!addingItem}>
              {renderContent()}
            </MainContent>

            <AddItemForm $isVisible={!!addingItem}>
              <BackButton onClick={() => setAddingItem(null)}>
                <ArrowLeft size={16} />
                Back to profile
              </BackButton>
              <SectionTitle>
                {addingItem === "email" && "Email addresses"}
                {addingItem === "phone" && "Phone numbers"}
                {addingItem === "social" && "Connected accounts"}
              </SectionTitle>
              {addingItem === "email" && (
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
                    {user.emails.map((email) => (
                      <div
                        key={email.address}
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
                            {email.address}
                          </div>
                          {email.isPrimary && (
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              Primary email
                            </div>
                          )}
                        </div>
                        <EditButton
                          onClick={() => removeEmail(email.address)}
                          style={{ background: "#fee2e2", color: "#ef4444" }}
                        >
                          Remove
                        </EditButton>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <label
                        htmlFor="new-email"
                        style={{ fontSize: "14px", color: "#64748b" }}
                      >
                        New email address
                      </label>
                      <input
                        id="new-email"
                        type="email"
                        placeholder="Enter your email address"
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <EditButton style={{ width: "fit-content" }}>
                      Add email address
                    </EditButton>
                  </div>
                </div>
              )}
              {addingItem === "phone" && (
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
                    {user.phones.map((phone) => (
                      <div
                        key={phone.number}
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
                            {phone.number}
                          </div>
                          {phone.isPrimary && (
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              Primary phone
                            </div>
                          )}
                        </div>
                        <EditButton
                          onClick={() => removePhone(phone.number)}
                          style={{ background: "#fee2e2", color: "#ef4444" }}
                        >
                          Remove
                        </EditButton>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <label
                        htmlFor="new-phone"
                        style={{ fontSize: "14px", color: "#64748b" }}
                      >
                        New phone number
                      </label>
                      <input
                        id="new-phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <EditButton style={{ width: "fit-content" }}>
                      Add phone number
                    </EditButton>
                  </div>
                </div>
              )}
              {addingItem === "social" && (
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
                    {user.connectedAccounts.map((account) => (
                      <div
                        key={account.provider + account.email}
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
                            {account.email}
                          </div>
                        </div>
                        <EditButton
                          onClick={() => disconnectAccount(account.provider)}
                          style={{ background: "#fee2e2", color: "#ef4444" }}
                        >
                          Disconnect
                        </EditButton>
                      </div>
                    ))}
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
