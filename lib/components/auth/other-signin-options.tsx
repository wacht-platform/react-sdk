import { ArrowLeft } from "lucide-react";
import styled from "styled-components";
import { TypographyProvider } from "@/components/utility/typography";
import { OtherAuthOptions } from "@/components/auth/other-auth-options";

const Container = styled.div`
  max-width: 400px;
  width: 400px;
  padding: 32px 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 32px;
  position: relative;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 400;
  color: #111827;
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 14px;
`;

const BackButton = styled.button`
  position: absolute;
  top: 6px;
  left: 0px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 24px;
  color: #64748b;
  background: none;
  border: none;

  &:hover {
    color: #1e293b;
  }
`;

interface OtherSignInOptionsProps {
  onBack: () => void;
}

export function OtherSignInOptions({ onBack }: OtherSignInOptionsProps) {
  return (
    <TypographyProvider>
      <Container>
        <Header>
          <BackButton onClick={onBack}>
            <ArrowLeft size={16} />
          </BackButton>
          <Title>Supported Sign in Options</Title>
          <Subtitle>
            Sign in with one of the following options to continue
          </Subtitle>
        </Header>
        <OtherAuthOptions />
      </Container>
    </TypographyProvider>
  );
}
