import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { LogOut, Settings, Plus } from 'lucide-react';

const ButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  border: none;
  background: transparent;
  position: relative;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 600px) {
    width: 28px;
    height: 28px;
  }
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 600px) {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
`;

const DropdownWrapper = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 12px;
  min-width: 350px; 
  min-height: auto;
  padding: 8px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: ${(props) => (props.$isOpen ? 'block' : 'none')};
  z-index: 50;
  overflow: hidden; /* Prevent any scrollbars */
  font-family: system-ui, -apple-system, sans-serif;

  @media (max-width: 600px) {
    min-width: 80vw;
  }
`;


const AccountItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: ${(props) => (props.$active ? '#f8fafc' : 'none')};
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
  }
`;

const AccountInfo = styled.div`
  flex: 1;
`;

const AccountName = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 2px;

  @media (max-width: 600px) {
    font-size: 12px;
  }
`;

const AccountEmail = styled.div`
  font-size: 13px;
  color: #64748b;

  @media (max-width: 600px) {
    font-size: 11px;
  }
`;

const ActionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  gap: 8px;
`;

const StyledButton = styled.button<{ $destructive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  background: #f8fafc;
  cursor: pointer;
  font-size: 14px;
  color: ${props => props.$destructive ? '#ef4444' : '#1e293b'};
  border-radius: 6px;
  transition: all 0.2s ease;
  font-family: inherit;
  flex: 1;

  &:hover {
    background: #f1f5f9;
  }

  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.$destructive ? '#ef4444' : '#64748b'};
  }

  @media (max-width: 600px) {
    font-size: 12px;
    padding: 6px 12px;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: #e2e8f0;
  margin: 8px 0;
`;

interface Account {
  name: string;
  email: string;
  imageUrl?: string;
}

interface UserButtonProps {
  accounts: Account[];
  activeAccount: number;
  onAccountSwitch: (index: number) => void;
  onSignOut: () => void;
  onSignOutAll: () => void;
  onManageAccount: () => void;
  onAddAccount: () => void;
}

export const UserButton: React.FC<UserButtonProps> = ({
  accounts,
  activeAccount,
  onAccountSwitch,
  onSignOut,
  onSignOutAll,
  onManageAccount,
  onAddAccount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  const orderedAccounts = [...accounts];
  const [activeAccountData] = orderedAccounts.splice(activeAccount, 1);
  orderedAccounts.unshift(activeAccountData);

  return (
    <ButtonWrapper onClick={toggleDropdown} ref={buttonRef} aria-haspopup="true" aria-expanded={isOpen}>
      <Avatar>
        {accounts[activeAccount].imageUrl ? (
          <img src={accounts[activeAccount].imageUrl} alt={accounts[activeAccount].name} />
        ) : (
          getInitials(accounts[activeAccount].name)
        )}
      </Avatar>

      <DropdownWrapper $isOpen={isOpen} ref={dropdownRef}>
        {orderedAccounts.map((account, index) => (
          <div key={account.email}>
            <AccountItem
              $active={account.email === accounts[activeAccount].email}
              onClick={() => {
                const originalIndex = accounts.findIndex(a => a.email === account.email);
                onAccountSwitch(originalIndex);
                setIsOpen(false);
              }}
            >
              <Avatar>
                {account.imageUrl ? (
                  <img src={account.imageUrl} alt={account.name} />
                ) : (
                  getInitials(account.name)
                )}
              </Avatar>
              <AccountInfo>
                <AccountName>{account.name}</AccountName>
                <AccountEmail>{account.email}</AccountEmail>
              </AccountInfo>
            </AccountItem>
            {account.email === accounts[activeAccount].email && (
              <ActionContainer>
                <StyledButton onClick={() => { onManageAccount(); setIsOpen(false); }}>
                  <Settings size={16} />
                  Manage
                </StyledButton>
                <StyledButton onClick={() => { onSignOut(); setIsOpen(false); }} $destructive>
                  <LogOut size={16} />
                  Sign Out
                </StyledButton>
              </ActionContainer>
            )}
          </div>
        ))}
        <Divider />
        <AccountItem onClick={() => { onAddAccount(); setIsOpen(false); }}>
          <Avatar>
            <Plus size={20} />
          </Avatar>
          <AccountInfo>
            <AccountName>Add account</AccountName>
          </AccountInfo>
        </AccountItem>
        <Divider />
        <ActionContainer>
          <StyledButton onClick={() => { onSignOutAll(); setIsOpen(false); }} $destructive>
            <LogOut size={16} />
            Sign out all
          </StyledButton>
        </ActionContainer>
      </DropdownWrapper>
    </ButtonWrapper>
  );
};