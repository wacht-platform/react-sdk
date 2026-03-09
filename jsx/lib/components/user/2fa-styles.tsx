import styled from "styled-components";

// Clean, modern 2FA card design
export const TwoFactorCard = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--space-10u);
  background: var(--color-background);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-8u);
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
    height: var(--space-1u);
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  &:hover {
    background: var(--color-background-hover);
    border-color: var(--color-primary);
    transform: translateY(calc(var(--space-1u) * -1));
    box-shadow: var(--shadow-md);
    
    &::before {
      transform: translateX(0);
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`;

export const TwoFactorIcon = styled.div<{ $active?: boolean }>`
  width: var(--size-24u);
  height: var(--size-24u);
  border-radius: var(--radius-lg);
  background: ${props => props.$active
    ? 'linear-gradient(135deg, var(--color-success), var(--color-success))'
    : 'linear-gradient(135deg, var(--color-background-hover), var(--color-background))'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--space-8u);
  box-shadow: ${props => props.$active
    ? 'var(--shadow-success)'
    : 'var(--shadow-sm)'};
  
  svg {
    width: var(--size-12u);
    height: var(--size-12u);
    color: ${props => props.$active ? 'var(--color-foreground-inverse)' : 'var(--color-foreground)'};
  }
`;

export const TwoFactorContent = styled.div`
  flex: 1;
`;

export const TwoFactorTitle = styled.div`
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-foreground);
  margin-bottom: var(--space-2u);
  display: flex;
  align-items: center;
  gap: var(--space-4u);
`;

export const TwoFactorDescription = styled.div`
  font-size: var(--font-size-lg);
  color: var(--color-secondary-text);
  line-height: 1.5;
`;

export const TwoFactorStatus = styled.span<{ $active?: boolean }>`
  font-size: var(--font-size-sm);
  font-weight: 600;
  padding: var(--space-1u) var(--space-4u);
  border-radius: var(--radius-full);
  background: ${props => props.$active
    ? 'var(--color-success-background)'
    : 'var(--color-background-hover)'};
  color: ${props => props.$active
    ? 'var(--color-success)'
    : 'var(--color-secondary-text)'};
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-tight);
`;

// Clean QR code display
export const QRCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: var(--space-16u) 0;
`;

export const QRCodeWrapper = styled.div`
  background: var(--color-background);
  padding: var(--space-12u);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: var(--radius-xl);
    padding: var(--space-1u);
    background: linear-gradient(45deg, var(--color-primary), var(--color-primary-hover));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
`;

// Modern backup codes grid
export const BackupCodesContainer = styled.div`
  background: linear-gradient(135deg, var(--color-background-hover), var(--color-background));
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-12u);
  margin-top: var(--space-12u);
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
  margin-bottom: var(--space-8u);
`;

export const BackupCodesTitle = styled.h4`
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0;
`;

export const BackupCodesActions = styled.div`
  display: flex;
  gap: var(--space-4u);
`;

export const BackupCodeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--space-10u) * 6), 1fr));
  gap: var(--space-4u);
`;

// Alias for compatibility
export const BackupCodesGrid = BackupCodeGrid;

export const BackupCodeItem = styled.button<{ $used?: boolean }>`
  background: ${props => props.$used
    ? 'var(--color-background-hover)'
    : 'var(--color-background)'};
  border: var(--border-width-thin) solid ${props => props.$used
    ? 'var(--color-border)'
    : 'var(--color-border)'};
  border-radius: var(--radius-md);
  padding: var(--space-6u) var(--space-8u);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  font-size: var(--font-size-lg);
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
      transform: translateY(calc(var(--space-1u) * -0.5));
      box-shadow: var(--shadow-sm);
    `}
  }
  
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

// Clean message component
export const Message = styled.div<{ $type?: 'success' | 'error' | 'info' }>`
  background: ${props => {
    switch (props.$type) {
      case 'success': return 'var(--color-success-background)';
      case 'error': return 'var(--color-error-background)';
      default: return 'var(--color-background-hover)';
    }
  }};
  border: var(--border-width-thin) solid ${props => {
    switch (props.$type) {
      case 'success': return 'var(--color-success-border)';
      case 'error': return 'var(--color-error-border)';
      default: return 'var(--color-border)';
    }
  }};
  border-radius: var(--radius-xs);
  padding: var(--space-6u) var(--space-8u);
  margin-bottom: var(--space-8u);
  font-size: var(--font-size-lg);
  display: flex;
  align-items: flex-start;
  gap: var(--space-6u);
  
  svg {
    flex-shrink: 0;
    margin-top: var(--space-1u);
    color: ${props => {
    switch (props.$type) {
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
  padding: var(--space-24u) var(--space-12u);
`;

export const EmptyStateIcon = styled.div`
  width: var(--size-36u);
  height: var(--size-36u);
  margin: 0 auto var(--space-10u);
  background: linear-gradient(135deg, var(--color-background-hover), var(--color-background));
  border: var(--border-width-regular) solid var(--color-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    inset: calc(var(--space-4u) * -1);
    border-radius: 50%;
    border: var(--border-width-thin) dashed var(--color-border);
    opacity: 0.5;
  }
  
  svg {
    width: var(--size-18u);
    height: var(--size-18u);
    color: var(--color-secondary-text);
  }
`;

export const EmptyStateTitle = styled.h3`
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 var(--space-4u) 0;
`;

export const EmptyStateDescription = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-secondary-text);
  margin: 0 0 var(--space-12u) 0;
  max-width: calc(var(--size-50u) * 3 + var(--space-10u));
  margin-left: auto;
  margin-right: auto;
`;

// Setup flow
export const SetupContainer = styled.div`
  max-width: calc(var(--size-50u) * 4 + var(--space-10u) * 4);
  margin: 0 auto;
`;

export const SetupStep = styled.div`
  text-align: center;
  padding: var(--space-12u);
`;

export const SetupStepTitle = styled.h3`
  font-size: var(--font-size-3xl);
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 var(--space-4u) 0;
`;

export const SetupStepDescription = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-secondary-text);
  margin: 0 0 var(--space-16u) 0;
`;

export const CodeInputContainer = styled.div`
  max-width: calc(var(--size-50u) * 3);
  margin: 0 auto;
`;

export const CodeInputLabel = styled.label`
  display: block;
  font-size: var(--font-size-md);
  font-weight: 400;
  color: var(--color-secondary-text);
  margin-bottom: var(--space-4u);
  text-align: left;
`;

export const CodeInput = styled.input`
  width: 100%;
  padding: var(--space-6u) var(--space-8u);
  font-size: var(--font-size-3xl);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  text-align: center;
  letter-spacing: var(--space-4u);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-xs);
  background: var(--color-background);
  color: var(--color-foreground);
  transition: all 0.15s ease;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--ring-primary);
  }
  
  &:disabled {
    background: var(--color-background-hover);
    cursor: not-allowed;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: var(--space-6u);
  justify-content: center;
  margin-top: var(--space-12u);
`;

// Active authenticator display
export const ActiveAuthenticator = styled.div`
  background: linear-gradient(135deg, var(--color-success-background), var(--color-success-background-light));
  border: var(--border-width-thin) solid var(--color-success-border);
  border-radius: var(--radius-lg);
  padding: var(--space-10u);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-12u);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: var(--space-1u);
    background: linear-gradient(90deg, var(--color-success), var(--color-success));
  }
`;

export const ActiveAuthenticatorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-6u);
`;

export const ActiveAuthenticatorIcon = styled.div`
  width: var(--size-20u);
  height: var(--size-20u);
  background: var(--color-success);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    color: var(--color-foreground-inverse);
  }
`;

export const ActiveAuthenticatorContent = styled.div``;

export const ActiveAuthenticatorTitle = styled.div`
  font-size: var(--font-size-lg);
  font-weight: 400;
  color: var(--color-foreground);
  margin-bottom: var(--space-1u);
`;

export const ActiveAuthenticatorDate = styled.div`
  font-size: var(--font-size-md);
  color: var(--color-secondary-text);
`;

// Step indicators for setup flow
export const SetupSteps = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-16u);
  gap: var(--space-4u);
`;

export const SetupStepIndicator = styled.div<{ $active?: boolean; $completed?: boolean }>`
  width: ${props => props.$active ? 'var(--size-16u)' : 'var(--space-4u)'};
  height: var(--space-4u);
  border-radius: var(--radius-2xs);
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
  padding: var(--space-24u);
  
  svg {
    width: var(--size-32u);
    height: var(--size-32u);
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
  font-size: var(--font-size-3xl);
  font-weight: 600;
  color: var(--color-foreground);
  margin: var(--space-8u) 0 var(--space-4u) 0;
`;

export const SuccessDescription = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-secondary-text);
  margin: 0;
  text-align: center;
`;

// Improved button styles
export const PrimaryButton = styled.button`
  padding: var(--space-5u) var(--space-10u);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: var(--color-foreground-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-lg);
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
    transform: translateY(calc(var(--space-1u) * -0.5));
    box-shadow: var(--shadow-md);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    
    &::before {
      width: calc(var(--size-50u) * 3);
      height: calc(var(--size-50u) * 3);
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const SecondaryButton = styled.button`
  padding: var(--space-5u) var(--space-10u);
  background: transparent;
  color: var(--color-foreground);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: var(--color-background-hover);
    border-color: var(--color-primary);
    transform: translateY(calc(var(--space-1u) * -0.5));
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
  padding: var(--space-5u) var(--space-10u);
  background: transparent;
  color: var(--color-error);
  border: var(--border-width-thin) solid var(--color-error);
  border-radius: var(--radius-md);
  font-size: var(--font-size-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: var(--color-error-background);
    transform: translateY(calc(var(--space-1u) * -0.5));
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
  padding: var(--space-4u) var(--space-8u);
  border-radius: var(--radius-xs);
  font-size: var(--font-size-lg);
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: var(--color-primary);
          color: var(--color-foreground-inverse);
          &:hover:not(:disabled) {
            background: var(--color-primary-hover);
          }
        `;
      case 'danger':
        return `
          background: var(--color-error);
          color: var(--color-foreground-inverse);
          &:hover:not(:disabled) {
            background: var(--color-error);
          }
        `;
      default:
        return `
          background: var(--color-background);
          color: var(--color-foreground);
          border: var(--border-width-thin) solid var(--color-border);
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
