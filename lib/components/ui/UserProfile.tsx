import React, { useState } from 'react';
import styled from 'styled-components';
import { User, Shield, Plus, Edit2, Mail, Phone, History, Key, Smartphone, LucideIcon } from 'lucide-react';

const Container = styled.div`
  max-width: 800px;
  margin: 40px auto;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 24px;
`;

const Sidebar = styled.div`
  width: 200px;
  padding-right: 24px;
  border-right: 1px solid #e2e8f0;
`;

const MainContent = styled.div`
  flex: 1;
  padding-left: 24px;
`;

const Layout = styled.div`
  display: flex;
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const MenuItem = styled.div<{ active?: boolean }>`
  padding: 8px 16px;
  margin: 4px 0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${props => props.active ? '#f1f5f9' : 'transparent'};
  color: ${props => props.active ? '#1e293b' : '#64748b'};
  font-weight: ${props => props.active ? '500' : 'normal'};
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
  }

  @media (max-width: 600px) {
    padding: 6px 12px;
    font-size: 14px;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 8px;
  color: #1e293b;
  font-weight: 500;
`;

const Subtitle = styled.p`
  color: #64748b;
  font-size: 14px;
  margin-bottom: 24px;
`;

const ProfileSection = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const Avatar = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  @media (max-width: 600px) {
    width: 48px;
    height: 48px;
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
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #1e293b;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
  }

  @media (max-width: 600px) {
    padding: 4px 8px;
    font-size: 12px;
  }
`;

const InfoItem = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1e293b;
`;

const AddButton = styled.button`
  color: #2563eb;
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  transition: color 0.2s ease;

  &:hover {
    color: #1d4ed8;
  }

  @media (max-width: 600px) {
    font-size: 12px;
  }
`;

const Badge = styled.span`
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #64748b;
  margin-left: auto;
`;

const SecurityItem = styled.div`
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 16px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #f8fafc;
  }
  
  h3 {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #1e293b;
  }
  
  p {
    color: #64748b;
    font-size: 14px;
    margin: 0;
  }
`;

const LastLogin = styled.div`
  font-size: 13px;
  color: #64748b;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const renderContent = () => {
    if (activeTab === 'profile') {
      return (
        <>
          <ProfileSection>
            <SectionTitle>Profile details</SectionTitle>
            <ProfileHeader>
              <Avatar src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Profile" />
              <ProfileName>
                <Name>Dexter Dexter</Name>
              </ProfileName>
              <EditButton>
                <Edit2 size={16} />
                Edit profile
              </EditButton>
            </ProfileHeader>
          </ProfileSection>

          <ProfileSection>
            <SectionTitle>Email addresses</SectionTitle>
            <InfoItem>
              <Mail size={16} />
              example@work.com
              <Badge>Primary</Badge>
            </InfoItem>
            <InfoItem>
              <Mail size={16} />
              personal@example.com
            </InfoItem>
            <AddButton>
              <Plus size={16} />
              Add email address
            </AddButton>
          </ProfileSection>

          <ProfileSection>
            <SectionTitle>Phone numbers</SectionTitle>
            <InfoItem>
              <Phone size={16} />
              +1 (555) 123-4567
              <Badge>Primary</Badge>
            </InfoItem>
            <AddButton>
              <Plus size={16} />
              Add phone number
            </AddButton>
          </ProfileSection>

          <ProfileSection>
            <SectionTitle>Connected accounts</SectionTitle>
            <InfoItem>
              <Mail size={16} />
              example@gmail.com
            </InfoItem>
            <AddButton>
              <Plus size={16} />
              Connect account
            </AddButton>
          </ProfileSection>
        </>
      );
    }

    return (
      <>
        <ProfileSection>
          <SectionTitle>Security settings</SectionTitle>
          <SecurityItem>
            <h3>
              <Key size={16} />
              Password
            </h3>
            <p>Last changed 3 months ago</p>
            <EditButton style={{ marginTop: '12px' }}>
              Change password
            </EditButton>
          </SecurityItem>

          <SecurityItem>
            <h3>
              <Smartphone size={16} />
              Two-factor authentication
            </h3>
            <p>Add a second layer of security to your account</p>
            <EditButton style={{ marginTop: '12px' }}>
              Enable 2FA
            </EditButton>
          </SecurityItem>

          <SecurityItem>
            <h3>
              <History size={16} />
              Recent activity
            </h3>
            <p>Monitor and review your recent sign-in activity</p>
            <LastLogin>
              <History size={14} />
              Last login: Today at 2:30 PM • San Francisco, CA
            </LastLogin>
          </SecurityItem>
        </ProfileSection>
      </>
    );
  };

  return (
    <Container>
      <Layout>
        <Sidebar>
          <Title>Account</Title>
          <Subtitle>Manage your account info</Subtitle>
          <MenuItem active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>
            <User size={18} />
            Profile
          </MenuItem>
          <MenuItem active={activeTab === 'security'} onClick={() => setActiveTab('security')}>
            <Shield size={18} />
            Security
          </MenuItem>
        </Sidebar>

        <MainContent>
          {renderContent()}
        </MainContent>
      </Layout>
    </Container>
  );
};

export default UserProfile;