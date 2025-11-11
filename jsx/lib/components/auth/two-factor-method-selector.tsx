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
  gap: var(--space-sm);
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-weight: 500;
  font-size: var(--font-sm);
  color: var(--color-foreground);
  transition: color 0.2s;

  &:hover:not(:disabled) {
    color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: var(--color-primary);
  }
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
              type="button"
            >
              {method.icon}
              <span>{method.name}</span>
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