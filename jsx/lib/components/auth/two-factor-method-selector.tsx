import styled from "styled-components";
import { AuthFormImage } from "./auth-image";
import { DefaultStylesProvider } from "../utility/root";

const Container = styled.div`
  max-width: 380px;
  width: 380px;
  padding: var(--space-3xl);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px var(--color-shadow);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-lg);
  position: relative;
`;

const Title = styled.h1`
  font-size: var(--font-lg);
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: var(--space-xs);
  margin-top: 0;
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
`;

const MethodList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`;

const MethodButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: var(--color-background);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

    &::before {
      opacity: 0.04;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    border-color: var(--color-border);
  }
`;

const MethodIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;

  svg {
    width: 22px;
    height: 22px;
    color: white;
  }
`;

const MethodContent = styled.div`
  flex: 1;
  position: relative;
  z-index: 1;
`;

const MethodName = styled.div`
  font-weight: 600;
  color: var(--color-foreground);
  margin-bottom: var(--space-xs);
  font-size: var(--font-md);
`;

const MethodDescription = styled.div`
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
  line-height: 1.5;
`;

const Footer = styled.div`
  margin-top: var(--space-lg);
  text-align: center;
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
`;

const Link = styled.span`
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  cursor: pointer;

  &:hover {
    color: var(--color-primary-hover);
  }
`;

export interface TwoFactorMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  phoneNumber?: string;
}

interface TwoFactorMethodSelectorProps {
  methods: TwoFactorMethod[];
  onSelectMethod: (methodId: string) => void;
  onBack?: () => void;
}

export function TwoFactorMethodSelector({ methods, onSelectMethod, onBack }: TwoFactorMethodSelectorProps) {
  const handleMethodClick = (methodId: string) => {
    onSelectMethod(methodId);
  };

  return (
    <DefaultStylesProvider>
      <Container>
        <AuthFormImage />

        <Header>
          <Title>Verify your identity</Title>
          <Subtitle>
            Choose a verification method to continue
          </Subtitle>
        </Header>

        <MethodList>
          {methods.map((method) => (
            <MethodButton
              key={method.id}
              onClick={() => handleMethodClick(method.id)}
              disabled={!method.available}
            >
              <MethodIcon>{method.icon}</MethodIcon>
              <MethodContent>
                <MethodName>{method.name}</MethodName>
                <MethodDescription>
                  {method.description}
                  {method.phoneNumber && ` ${method.phoneNumber}`}
                </MethodDescription>
              </MethodContent>
            </MethodButton>
          ))}
        </MethodList>

        {onBack && (
          <Footer>
            <Link onClick={onBack} style={{ cursor: "pointer" }}>
              Back to login
            </Link>
          </Footer>
        )}
      </Container>
    </DefaultStylesProvider>
  );
}