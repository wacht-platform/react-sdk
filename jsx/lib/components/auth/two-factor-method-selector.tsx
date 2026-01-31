import styled from "styled-components";
import { AuthFormImage } from "./auth-image";
import { DefaultStylesProvider } from "../utility/root";

const Container = styled.div`
  max-width: 380px;
  width: 380px;
  padding: var(--space-2xl);
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
  font-size: var(--font-md);
  font-weight: 400;
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
  gap: 0;
`;

const MethodButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  width: 100%;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  position: relative;

  &:first-child {
    border-top-left-radius: var(--radius-md);
    border-top-right-radius: var(--radius-md);
  }

  &:last-child {
    border-bottom-left-radius: var(--radius-md);
    border-bottom-right-radius: var(--radius-md);
  }

  &:not(:first-child) {
    margin-top: -1px;
  }

  &:hover:not(:disabled) {
    background-color: var(--color-background-hover);
    border-color: var(--color-primary);
    z-index: 1;
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

const MethodContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
`;

const MethodName = styled.div`
  font-weight: 400;
  font-size: var(--font-sm);
  color: var(--color-foreground);
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
  font-weight: 400;
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

export function TwoFactorMethodSelector({
  methods,
  onSelectMethod,
  onBack,
}: TwoFactorMethodSelectorProps) {
  const handleMethodClick = (methodId: string) => {
    onSelectMethod(methodId);
  };

  return (
    <DefaultStylesProvider>
      <Container>
        <AuthFormImage />

        <Header>
          <Title>Two-factor authentication</Title>
          <Subtitle>Choose how you'd like to verify your identity</Subtitle>
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
