import styled from "styled-components";
import { DefaultStylesProvider } from "@/components/utility/root";
import { OtherAuthOptions } from "@/components/auth/other-auth-options";
import { AuthFormImage } from "./auth-image";
import { standaloneAuthShell } from "./auth-shell";
import { useDeployment } from "@/hooks/use-deployment";

const Container = styled.div`
    ${standaloneAuthShell}
`;

const Header = styled.div`
    margin-bottom: var(--space-8u);
    text-align: center;
`;

const Title = styled.h1`
    font-size: var(--font-size-xl);
    font-weight: 400;
    color: var(--color-card-foreground);
    margin: 0 0 var(--space-2u) 0;
    line-height: 1.3;
`;

const Subtitle = styled.p`
    font-size: var(--font-size-md);
    color: var(--color-secondary-text);
    margin: 0;
    line-height: 1.5;
`;

const Footer = styled.div`
    margin-top: var(--space-8u);
    padding-top: var(--space-6u);
    border-top: var(--border-width-thin) solid var(--color-border);
    text-align: center;
    font-size: var(--font-size-sm);
    color: var(--color-secondary-text);
`;

const BackLink = styled.button`
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: 400;
    color: var(--color-card-foreground);
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: color 0.15s ease;

    &:hover {
        color: var(--color-primary);
    }
`;

interface OtherSignInOptionsProps {
    onBack: () => void;
}

export function OtherSignInOptions({ onBack }: OtherSignInOptionsProps) {
    const { deployment } = useDeployment();
    const appName = deployment?.ui_settings?.app_name;

    return (
        <DefaultStylesProvider>
            <Container>
                <AuthFormImage />

                <Header>
                    <Title>All sign-in methods</Title>
                    <Subtitle>
                        Choose another way to sign in to{" "}
                        {appName || "your account"}
                    </Subtitle>
                </Header>

                <OtherAuthOptions />

                <Footer>
                    <BackLink type="button" onClick={onBack}>
                        Back to sign in
                    </BackLink>
                </Footer>
            </Container>
        </DefaultStylesProvider>
    );
}
