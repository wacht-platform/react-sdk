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
  gap: var(--space-sm);
`;

const MethodButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
  min-height: 48px;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const MethodIcon = styled.div`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const MethodContent = styled.div`
  flex: 1;
`;

const MethodName = styled.div`
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: var(--space-2xs);
  font-size: var(--font-sm);
`;

const MethodDescription = styled.div`
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
  line-height: 1.4;
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
          <Title>Two-factor authentication</Title>
          <Subtitle>
            Choose how you'd like to verify your identity
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