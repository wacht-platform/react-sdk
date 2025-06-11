import styled from "styled-components";
import { DefaultStylesProvider } from "@/components/utility/root";
import { OtherAuthOptions } from "@/components/auth/other-auth-options";

const Container = styled.div`
  max-width: 360px;
  width: 360px;
  padding: var(--space-xl);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 24px var(--color-shadow);
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
  margin: 0;
`;



const Footer = styled.div`
  text-align: center;
  margin-top: var(--space-lg);
`;

const FooterText = styled.p`
  font-size: var(--font-xs);
  color: var(--color-muted);
`;

const Link = styled.a`
  color: var(--color-primary);
  text-decoration: none;
`;

interface OtherSignInOptionsProps {
  onBack: () => void;
}

export function OtherSignInOptions({ onBack }: OtherSignInOptionsProps) {
  return (
    <DefaultStylesProvider>
      <Container>
        <Header>
          <Title>Supported Options</Title>
          <Subtitle>Choose one of the following options to continue</Subtitle>
        </Header>
        <OtherAuthOptions />
        <Footer>
          <FooterText>
            Don't have an account? <Link href="/signup">Sign up</Link>
          </FooterText>
          <FooterText style={{ marginTop: 'var(--space-sm)' }}>
            <Link onClick={onBack} style={{ cursor: 'pointer' }}>Use other method</Link>
          </FooterText>
        </Footer>
      </Container>
    </DefaultStylesProvider>
  );
}
