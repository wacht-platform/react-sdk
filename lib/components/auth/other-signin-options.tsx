import { ArrowLeft } from "lucide-react";
import styled from "styled-components";
import { DefaultStylesProvider } from "@/components/utility/root";
import { OtherAuthOptions } from "@/components/auth/other-auth-options";

const Container = styled.div`
  max-width: 400px;
  width: 400px;
  padding: var(--space-xl) var(--space-2xl);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 24px var(--color-shadow);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-xl);
  position: relative;
`;

const Title = styled.h1`
  font-size: var(--font-md);
  font-weight: 400;
  color: var(--color-foreground);
  margin-bottom: var(--space-2xs);
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
`;

const BackButton = styled.button`
  position: absolute;
  top: var(--space-2xs);
  left: 0px;
  cursor: pointer;
  font-size: var(--font-xs);
  margin-bottom: var(--space-lg);
  color: var(--color-muted);
  background: none;
  border: none;

  &:hover {
    color: var(--color-foreground);
  }
`;

const Footer = styled.div`
  text-align: center;
  margin-top: var(--space-md);
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
					<BackButton onClick={onBack}>
						<ArrowLeft size={16} />
					</BackButton>
					<Title>Supported Options</Title>
					<Subtitle>Choose one of the following options to continue</Subtitle>
				</Header>
				<OtherAuthOptions />
				<Footer>
					<FooterText>
						Don't have an account? <Link href="/signup">Sign up</Link>
					</FooterText>
				</Footer>
			</Container>
		</DefaultStylesProvider>
	);
}
