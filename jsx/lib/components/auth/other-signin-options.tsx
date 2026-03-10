import styled from "styled-components";
import { DefaultStylesProvider } from "@/components/utility/root";
import { OtherAuthOptions } from "@/components/auth/other-auth-options";
import { AuthFormImage } from "./auth-image";
import { standaloneAuthShell } from "./auth-shell";

const Container = styled.div`
  ${standaloneAuthShell}
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-8u);
  position: relative;
`;

const Title = styled.h1`
  font-size: var(--font-size-2xl);
  font-weight: 400;
  color: var(--color-card-foreground);
  margin-bottom: var(--space-2u);
  margin-top: 0;
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-size-md);
  margin: 0;
`;

const Footer = styled.div`
  text-align: center;
  margin-top: var(--space-8u);
`;

const FooterText = styled.p`
  font-size: var(--font-size-md);
  color: var(--color-muted);
`;

const Link = styled.a`
  color: var(--color-primary);
  text-decoration: none;
`;

const BackFooterText = styled(FooterText)`
  margin-top: var(--space-4u);
`;

const ClickableLink = styled(Link)`
  cursor: pointer;
`;

interface OtherSignInOptionsProps {
  onBack: () => void;
}

export function OtherSignInOptions({ onBack }: OtherSignInOptionsProps) {
  return (
    <DefaultStylesProvider>
      <Container>
        <AuthFormImage />
        <Header>
          <Title>Supported Options</Title>
          <Subtitle>Choose one of the following options to continue</Subtitle>
        </Header>
        <OtherAuthOptions />
        <Footer>
          <FooterText>
            Don't have an account? <Link href="/signup">Sign up</Link>
          </FooterText>
          <BackFooterText>
            <ClickableLink onClick={onBack}>
              Back to login
            </ClickableLink>
          </BackFooterText>
        </Footer>
      </Container>
    </DefaultStylesProvider>
  );
}
