import styled from "styled-components";

// Clean, modern 2FA card design
export const TwoFactorCard = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 20px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  &:hover {
    background: var(--color-background-hover);
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--color-shadow);
    
    &::before {
      transform: translateX(0);
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`;

export const TwoFactorIcon = styled.div<{ $active?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, var(--color-success), var(--color-success-hover))' 
    : 'linear-gradient(135deg, var(--color-background-hover), var(--color-background))'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  box-shadow: ${props => props.$active 
    ? '0 2px 8px var(--color-success-shadow)' 
    : '0 2px 4px var(--color-shadow-light)'};
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => props.$active ? 'white' : 'var(--color-foreground)'};
  }
`;

export const TwoFactorContent = styled.div`
  flex: 1;
`;

export const TwoFactorTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-foreground);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const TwoFactorDescription = styled.div`
  font-size: 14px;
  color: var(--color-secondary-text);
  line-height: 1.5;
`;

export const TwoFactorStatus = styled.span<{ $active?: boolean }>`
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  background: ${props => props.$active 
    ? 'var(--color-success-background)' 
    : 'var(--color-background-hover)'};
  color: ${props => props.$active 
    ? 'var(--color-success)' 
    : 'var(--color-secondary-text)'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// Clean QR code display
export const QRCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 32px 0;
`;

export const QRCodeWrapper = styled.div`
  background: var(--color-background);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 16px var(--color-shadow);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 16px;
    padding: 2px;
    background: linear-gradient(45deg, var(--color-primary), var(--color-primary-hover));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
`;

// Modern backup codes grid
export const BackupCodesContainer = styled.div`
  background: linear-gradient(135deg, var(--color-background-hover), var(--color-background));
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, var(--color-primary) 0%, transparent 70%);
    opacity: 0.03;
    pointer-events: none;
  }
`;

export const BackupCodesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export const BackupCodesTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0;
`;

export const BackupCodesActions = styled.div`
  display: flex;
  gap: 8px;
`;

export const BackupCodeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
`;

// Alias for compatibility
export const BackupCodesGrid = BackupCodeGrid;

export const BackupCodeItem = styled.button<{ $used?: boolean }>`
  background: ${props => props.$used 
    ? 'var(--color-background-hover)' 
    : 'var(--color-background)'};
  border: 1px solid ${props => props.$used 
    ? 'var(--color-border)' 
    : 'var(--color-border)'};
  border-radius: 8px;
  padding: 12px 16px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$used 
    ? 'var(--color-secondary-text)' 
    : 'var(--color-foreground)'};
  cursor: ${props => props.$used ? 'default' : 'pointer'};
  transition: all 0.2s ease;
  position: relative;
  text-decoration: ${props => props.$used ? 'line-through' : 'none'};
  opacity: ${props => props.$used ? 0.6 : 1};
  
  &:hover:not(:disabled) {
    ${props => !props.$used && `
      border-color: var(--color-primary);
      background: var(--color-primary-background);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px var(--color-shadow-light);
    `}
  }
  
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

// Clean message component
export const Message = styled.div<{ $type?: 'success' | 'error' | 'info' }>`
  background: ${props => {
    switch(props.$type) {
      case 'success': return 'var(--color-success-background)';
      case 'error': return 'var(--color-error-background)';
      default: return 'var(--color-background-hover)';
    }
  }};
  border: 1px solid ${props => {
    switch(props.$type) {
      case 'success': return 'var(--color-success-border)';
      case 'error': return 'var(--color-error-border)';
      default: return 'var(--color-border)';
    }
  }};
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 14px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  
  svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${props => {
      switch(props.$type) {
        case 'success': return 'var(--color-success)';
        case 'error': return 'var(--color-error)';
        default: return 'var(--color-foreground)';
      }
    }};
  }
`;

// Empty state
export const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
`;

export const EmptyStateIcon = styled.div`
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, var(--color-background-hover), var(--color-background));
  border: 2px solid var(--color-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    border: 1px dashed var(--color-border);
    opacity: 0.5;
  }
  
  svg {
    width: 36px;
    height: 36px;
    color: var(--color-secondary-text);
  }
`;

export const EmptyStateTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 8px 0;
`;

export const EmptyStateDescription = styled.p`
  font-size: 14px;
  color: var(--color-secondary-text);
  margin: 0 0 24px 0;
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
`;

// Setup flow
export const SetupContainer = styled.div`
  max-width: 480px;
  margin: 0 auto;
`;

export const SetupStep = styled.div`
  text-align: center;
  padding: 24px;
`;

export const SetupStepTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 8px 0;
`;

export const SetupStepDescription = styled.p`
  font-size: 14px;
  color: var(--color-secondary-text);
  margin: 0 0 32px 0;
`;

export const CodeInputContainer = styled.div`
  max-width: 300px;
  margin: 0 auto;
`;

export const CodeInputLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-secondary-text);
  margin-bottom: 8px;
  text-align: left;
`;

export const CodeInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  font-size: 20px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  text-align: center;
  letter-spacing: 8px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-foreground);
  transition: all 0.15s ease;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-background);
  }
  
  &:disabled {
    background: var(--color-background-hover);
    cursor: not-allowed;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
`;

// Active authenticator display
export const ActiveAuthenticator = styled.div`
  background: linear-gradient(135deg, var(--color-success-background), var(--color-success-background-light));
  border: 1px solid var(--color-success-border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--color-success), var(--color-success-hover));
  }
`;

export const ActiveAuthenticatorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const ActiveAuthenticatorIcon = styled.div`
  width: 40px;
  height: 40px;
  background: var(--color-success);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    color: white;
  }
`;

export const ActiveAuthenticatorContent = styled.div``;

export const ActiveAuthenticatorTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: 2px;
`;

export const ActiveAuthenticatorDate = styled.div`
  font-size: 13px;
  color: var(--color-secondary-text);
`;

// Step indicators for setup flow
export const SetupSteps = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
  gap: 8px;
`;

export const SetupStepIndicator = styled.div<{ $active?: boolean; $completed?: boolean }>`
  width: ${props => props.$active ? '32px' : '8px'};
  height: 8px;
  border-radius: 4px;
  background: ${props => {
    if (props.$completed) return 'var(--color-success)';
    if (props.$active) return 'var(--color-primary)';
    return 'var(--color-border)';
  }};
  transition: all 0.3s ease;
`;

// Animated success state
export const SuccessAnimation = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px;
  
  svg {
    width: 64px;
    height: 64px;
    color: var(--color-success);
    animation: successPulse 0.6s ease;
  }
  
  @keyframes successPulse {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 1; }
  }
`;

export const SuccessTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 16px 0 8px 0;
`;

export const SuccessDescription = styled.p`
  font-size: 14px;
  color: var(--color-secondary-text);
  margin: 0;
  text-align: center;
`;

// Improved button styles
export const PrimaryButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: var(--color-button-ripple);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--color-shadow-medium);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    
    &::before {
      width: 300px;
      height: 300px;
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const SecondaryButton = styled.button`
  padding: 10px 20px;
  background: transparent;
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: var(--color-background-hover);
    border-color: var(--color-primary);
    transform: translateY(-1px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const DangerButton = styled.button`
  padding: 10px 20px;
  background: transparent;
  color: var(--color-error);
  border: 1px solid var(--color-error);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: var(--color-error-background);
    transform: translateY(-1px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: var(--color-primary);
          color: white;
          &:hover:not(:disabled) {
            background: var(--color-primary-hover);
          }
        `;
      case 'danger':
        return `
          background: var(--color-error);
          color: white;
          &:hover:not(:disabled) {
            background: var(--color-error-hover);
          }
        `;
      default:
        return `
          background: var(--color-background);
          color: var(--color-foreground);
          border: 1px solid var(--color-border);
          &:hover:not(:disabled) {
            background: var(--color-background-hover);
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;