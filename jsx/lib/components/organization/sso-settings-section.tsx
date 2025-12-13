"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import useSWR from "swr";
import { Shield, Trash, Copy, Check, Plus, ExternalLink } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useDeployment } from "@/hooks";
import { Spinner } from "../utility/spinner";
import { ConfirmationPopover } from "../utility/confirmation-popover";
import { useScreenContext } from "./context";
import { Button } from "../utility";
import { Input } from "../utility/input";
import { FormGroup, Label } from "../utility/form";
import type { EnterpriseConnection, CreateEnterpriseConnectionPayload } from "@/types";

const HeaderCTAContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
`;

const Card = styled.div`
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 500;
  color: var(--color-foreground);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Badge = styled.span`
  background: var(--color-primary-background);
  color: var(--color-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  text-transform: uppercase;
`;

const CardDetail = styled.div`
  font-size: 13px;
  color: var(--color-muted);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconButton = styled.button`
  background: none;
  border: 1px solid var(--color-border);
  padding: 6px;
  cursor: pointer;
  color: var(--color-muted);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--color-input-background);
    color: var(--color-foreground);
  }
`;

const InfoBox = styled.div`
  padding: 12px 16px;
  background: var(--color-background-alt);
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-secondary-text);
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  background: var(--color-input-background);
  color: var(--color-foreground);
  min-height: 100px;
  resize: vertical;
  font-family: monospace;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;



// IdP Templates
interface IdPTemplate {
    id: string;
    name: string;
    logo: string;
    protocol: "saml" | "oidc";
    description: string;
    docUrl: string;
    placeholders: {
        issuerUrl?: string;
        ssoUrl?: string;
        entityId?: string;
        scopes?: string;
    };
    // Default attribute mappings for this IdP (common attribute names)
    attributeMapping?: {
        first_name?: string;
        last_name?: string;
        email?: string;
    };
}

const IDP_TEMPLATES: IdPTemplate[] = [
    {
        id: "okta",
        name: "Okta",
        logo: "https://www.okta.com/sites/default/files/Okta_Logo_BrightBlue_Medium.png",
        protocol: "saml",
        description: "SAML",
        docUrl: "https://help.okta.com/en-us/content/topics/apps/apps_app_integration_wizard_saml.htm",
        placeholders: {
            entityId: "http://www.okta.com/{yourOktaDomain}",
            ssoUrl: "https://{yourOktaDomain}.okta.com/app/{appId}/sso/saml",
        },
        attributeMapping: {
            first_name: "firstName",
            last_name: "lastName",
            email: "email",
        },
    },
    {
        id: "okta-oidc",
        name: "Okta",
        logo: "https://www.okta.com/sites/default/files/Okta_Logo_BrightBlue_Medium.png",
        protocol: "oidc",
        description: "OIDC",
        docUrl: "https://developer.okta.com/docs/guides/implement-oauth-for-okta/main/",
        placeholders: {
            issuerUrl: "https://{yourOktaDomain}.okta.com",
            scopes: "openid profile email",
        },
        attributeMapping: {
            first_name: "given_name",
            last_name: "family_name",
            email: "email",
        },
    },
    {
        id: "azure",
        name: "Azure AD",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Microsoft_Azure.svg/150px-Microsoft_Azure.svg.png",
        protocol: "saml",
        description: "SAML",
        docUrl: "https://learn.microsoft.com/en-us/azure/active-directory/manage-apps/add-application-portal-setup-sso",
        placeholders: {
            entityId: "https://sts.windows.net/{tenantId}/",
            ssoUrl: "https://login.microsoftonline.com/{tenantId}/saml2",
        },
        attributeMapping: {
            first_name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
            last_name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
            email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
        },
    },
    {
        id: "azure-oidc",
        name: "Azure AD",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Microsoft_Azure.svg/150px-Microsoft_Azure.svg.png",
        protocol: "oidc",
        description: "OIDC",
        docUrl: "https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc",
        placeholders: {
            issuerUrl: "https://login.microsoftonline.com/{tenantId}/v2.0",
            scopes: "openid profile email",
        },
        attributeMapping: {
            first_name: "given_name",
            last_name: "family_name",
            email: "email",
        },
    },
    {
        id: "google",
        name: "Google",
        logo: "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png",
        protocol: "saml",
        description: "SAML",
        docUrl: "https://support.google.com/a/answer/6087519",
        placeholders: {
            entityId: "https://accounts.google.com/o/saml2?idpid={idpId}",
            ssoUrl: "https://accounts.google.com/o/saml2/idp?idpid={idpId}",
        },
        attributeMapping: {
            first_name: "FirstName",
            last_name: "LastName",
            email: "email",
        },
    },
    {
        id: "google-oidc",
        name: "Google",
        logo: "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png",
        protocol: "oidc",
        description: "OIDC",
        docUrl: "https://developers.google.com/identity/openid-connect/openid-connect",
        placeholders: {
            issuerUrl: "https://accounts.google.com",
            scopes: "openid profile email",
        },
        attributeMapping: {
            first_name: "given_name",
            last_name: "family_name",
            email: "email",
        },
    },
    {
        id: "auth0",
        name: "Auth0",
        logo: "https://cdn.auth0.com/styleguide/latest/lib/logos/img/badge.png",
        protocol: "oidc",
        description: "OIDC",
        docUrl: "https://auth0.com/docs/authenticate/protocols/openid-connect-protocol",
        placeholders: {
            issuerUrl: "https://{yourDomain}.auth0.com/",
            scopes: "openid profile email",
        },
        attributeMapping: {
            first_name: "given_name",
            last_name: "family_name",
            email: "email",
        },
    },
    {
        id: "onelogin",
        name: "OneLogin",
        logo: "",
        protocol: "saml",
        description: "SAML",
        docUrl: "https://onelogin.service-now.com/support?id=kb_article&sys_id=912bb23adbdc1cd0ca1c400e0b96197d",
        placeholders: {
            entityId: "https://app.onelogin.com/saml/metadata/{appId}",
            ssoUrl: "https://{subdomain}.onelogin.com/trust/saml2/http-post/sso/{appId}",
        },
    },
    {
        id: "ping",
        name: "PingOne",
        logo: "",
        protocol: "saml",
        description: "SAML",
        docUrl: "https://docs.pingidentity.com/pingone/latest/connector/configure-saml.html",
        placeholders: {
            entityId: "https://auth.pingone.com/{envId}",
            ssoUrl: "https://auth.pingone.com/{envId}/saml20/idp/sso",
        },
    },
    {
        id: "jumpcloud",
        name: "JumpCloud",
        logo: "",
        protocol: "saml",
        description: "SAML",
        docUrl: "https://support.jumpcloud.com/support/s/article/single-sign-on-sso-with-saml",
        placeholders: {
            entityId: "https://sso.jumpcloud.com/saml2/{appId}",
            ssoUrl: "https://sso.jumpcloud.com/saml2/{appId}",
        },
    },
    {
        id: "duo",
        name: "Duo",
        logo: "",
        protocol: "saml",
        description: "SAML",
        docUrl: "https://duo.com/docs/sso",
        placeholders: {
            entityId: "https://sso.duosecurity.com/saml2/sp/{appId}",
            ssoUrl: "https://sso.duosecurity.com/saml2/idp/{appId}/sso",
        },
    },
    {
        id: "keycloak",
        name: "Keycloak",
        logo: "https://www.keycloak.org/resources/images/icon.svg",
        protocol: "oidc",
        description: "OIDC",
        docUrl: "https://www.keycloak.org/docs/latest/securing_apps/",
        placeholders: {
            issuerUrl: "https://{host}/realms/{realm}",
            scopes: "openid profile email",
        },
    },
    {
        id: "adfs",
        name: "ADFS",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/100px-Microsoft_logo.svg.png",
        protocol: "saml",
        description: "SAML",
        docUrl: "https://learn.microsoft.com/en-us/windows-server/identity/ad-fs/operations/create-a-relying-party-trust",
        placeholders: {
            entityId: "http://{adfsServer}/adfs/services/trust",
            ssoUrl: "https://{adfsServer}/adfs/ls/",
        },
    },
    {
        id: "custom-saml",
        name: "Custom",
        logo: "",
        protocol: "saml",
        description: "SAML",
        docUrl: "",
        placeholders: {},
    },
    {
        id: "custom-oidc",
        name: "Custom",
        logo: "",
        protocol: "oidc",
        description: "OIDC",
        docUrl: "",
        placeholders: {},
    },
];

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
`;

const TemplateCard = styled.button<{ $selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border-radius: 6px;
  border: 1.5px solid ${props => props.$selected ? 'var(--color-primary)' : 'var(--color-border)'};
  background: ${props => props.$selected ? 'var(--color-primary-background)' : 'var(--color-background)'};
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-background);
  }
`;

const TemplateLogo = styled.img`
  height: 24px;
  width: 24px;
  object-fit: contain;
  background: white;
  border-radius: 4px;
  padding: 3px;
`;

const TemplateName = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: var(--color-foreground);
  text-align: center;
`;



const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  background: var(--color-input-background);
  color: var(--color-foreground);
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

export const SSOSettingsSection = () => {
    const { deployment } = useDeployment();
    const {
        activeOrganization,
        loading,
        getEnterpriseConnections,
        createEnterpriseConnection,
        deleteEnterpriseConnection,
        testEnterpriseConnection,
        generateSCIMToken,
        getSCIMToken,
        revokeSCIMToken,
    } = useActiveOrganization();
    const { toast } = useScreenContext();
    const [isCreating, setIsCreating] = useState(false);
    const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null);

    const {
        data: connections = [],
        isLoading,
        mutate,
    } = useSWR(
        activeOrganization?.id ? `wacht-org-sso:${activeOrganization.id}` : null,
        async () => await getEnterpriseConnections?.() || [],
        {
            refreshInterval: 30000,
            revalidateOnFocus: false,
        }
    );

    const handleDelete = async (connectionId: string) => {
        try {
            await deleteEnterpriseConnection?.(connectionId);
            mutate();
            toast("SSO connection deleted", "info");
        } catch (error: any) {
            toast(error.message || "Failed to delete connection", "error");
        }
        setConnectionToDelete(null);
    };

    if (loading || isLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <Spinner />
            </div>
        );
    }

    if (!deployment?.b2b_settings?.enterprise_sso_enabled) {
        return (
            <Card>
                <CardTitle>
                    <Shield size={18} />
                    Enterprise SSO
                </CardTitle>
                <CardDetail>
                    <span style={{ color: "var(--color-foreground-muted)" }}>
                        Enterprise SSO is not enabled for this deployment. Contact your administrator to enable this feature.
                    </span>
                </CardDetail>
            </Card>
        );
    }

    // Full-screen create view
    if (isCreating) {
        return (
            <CreateSSOScreen
                onClose={() => setIsCreating(false)}
                onCreate={async (payload) => {
                    try {
                        await createEnterpriseConnection?.(payload);
                        mutate();
                        setIsCreating(false);
                        toast("SSO connection created", "info");
                    } catch (error: any) {
                        toast(error.message || "Failed to create connection", "error");
                    }
                }}
            />
        );
    }

    return (
        <>
            {connections.length === 0 ? (
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "80px 24px",
                    textAlign: "center"
                }}>
                    <Shield size={56} strokeWidth={1} style={{ color: "var(--color-primary)", marginBottom: "20px", opacity: 0.7 }} />
                    <h3 style={{
                        margin: "0 0 8px 0",
                        fontSize: "18px",
                        fontWeight: 500,
                        color: "var(--color-foreground)"
                    }}>
                        Enterprise SSO
                    </h3>
                    <p style={{
                        margin: "0 0 24px 0",
                        fontSize: "14px",
                        color: "var(--color-muted)",
                        maxWidth: "360px",
                        lineHeight: "1.6"
                    }}>
                        Set up SAML or OIDC single sign-on to allow members to sign in with your identity provider.
                    </p>
                    <Button onClick={() => setIsCreating(true)} style={{ width: "auto" }}>
                        <Plus size={16} /> Configure SSO
                    </Button>
                </div>
            ) : (
                <>
                    <HeaderCTAContainer>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: "16px", color: "var(--color-foreground)" }}>
                                Enterprise SSO
                            </h3>
                            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--color-muted)" }}>
                                Configure SAML or OIDC SSO for your organization
                            </p>
                        </div>
                    </HeaderCTAContainer>
                    {connections.map((connection: EnterpriseConnection) => (
                        <ConnectionCard
                            key={connection.id}
                            connection={connection}
                            onDelete={(id) => setConnectionToDelete(id)}
                            connectionToDelete={connectionToDelete}
                            onConfirmDelete={handleDelete}
                            onCancelDelete={() => setConnectionToDelete(null)}
                            testConnection={testEnterpriseConnection || null}
                            generateSCIMToken={generateSCIMToken}
                            getSCIMToken={getSCIMToken}
                            revokeSCIMToken={revokeSCIMToken}
                            toast={toast}
                        />
                    ))}
                </>
            )}
        </>
    );
};

// ConnectionCard component with SCIM provisioning
interface ConnectionCardProps {
    connection: EnterpriseConnection;
    onDelete: (id: string) => void;
    connectionToDelete: string | null;
    onConfirmDelete: (id: string) => Promise<void>;
    onCancelDelete: () => void;
    testConnection: ((connectionId: string) => Promise<any>) | null;
    generateSCIMToken: ((connectionId: string) => Promise<any>) | null;
    getSCIMToken: ((connectionId: string) => Promise<any>) | null;
    revokeSCIMToken: ((connectionId: string) => Promise<void>) | null;
    toast: (message: string, type: "error" | "info") => void;
}

const SCIMSection = styled.div`
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
`;

const SCIMHeader = styled.div`
    font-size: 13px;
    font-weight: 500;
    color: var(--color-foreground);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
`;

const SCIMTokenDisplay = styled.div`
    background: var(--color-background-alt);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 12px;
    font-family: monospace;
    font-size: 12px;
    word-break: break-all;
    margin-bottom: 12px;
`;

const SCIMActions = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
`;

const ConnectionCard = ({
    connection,
    onDelete,
    connectionToDelete,
    onConfirmDelete,
    onCancelDelete,
    testConnection,
    generateSCIMToken,
    getSCIMToken,
    revokeSCIMToken,
    toast,
}: ConnectionCardProps) => {
    const [scimToken, setScimToken] = useState<any>(null);
    const [scimLoading, setScimLoading] = useState(false);
    const [showNewToken, setShowNewToken] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; checks: Record<string, boolean>; errors?: Record<string, string> } | null>(null);

    useEffect(() => {
        if (getSCIMToken && connection.id) {
            getSCIMToken(connection.id).then(setScimToken).catch(() => { });
        }
    }, [connection.id, getSCIMToken]);

    const handleTestConnection = async () => {
        if (!testConnection) return;
        setTesting(true);
        setTestResult(null);
        try {
            const result = await testConnection(connection.id);
            setTestResult(result);
        } catch (error: any) {
            setTestResult({ success: false, checks: {}, errors: { general: error.message || "Test failed" } });
        } finally {
            setTesting(false);
        }
    };

    const handleGenerateToken = async () => {
        if (!generateSCIMToken) return;
        setScimLoading(true);
        try {
            const result = await generateSCIMToken(connection.id);
            setShowNewToken(result.token);
            setScimToken({ exists: true, token: result, scim_base_url: result.scim_base_url });
            toast("SCIM token generated. Copy it now - it won't be shown again!", "info");
        } catch (error: any) {
            toast(error.message || "Failed to generate token", "error");
        } finally {
            setScimLoading(false);
        }
    };

    const handleRevokeToken = async () => {
        if (!revokeSCIMToken) return;
        setScimLoading(true);
        try {
            await revokeSCIMToken(connection.id);
            setScimToken({ exists: false, scim_base_url: scimToken?.scim_base_url });
            setShowNewToken(null);
            toast("SCIM token revoked", "info");
        } catch (error: any) {
            toast(error.message || "Failed to revoke token", "error");
        } finally {
            setScimLoading(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <Shield size={18} />
                    {connection.protocol === "oidc" ? "OIDC SSO" : "SAML SSO"}
                    <Badge>{connection.protocol.toUpperCase()}</Badge>
                </CardTitle>
                <div style={{ position: "relative" }}>
                    <IconButton
                        onClick={() => onDelete(connection.id)}
                        style={{ color: "var(--color-error)" }}
                    >
                        <Trash size={16} />
                    </IconButton>
                    {connectionToDelete === connection.id && (
                        <ConfirmationPopover
                            title="Delete this SSO connection?"
                            onConfirm={() => onConfirmDelete(connection.id)}
                            onCancel={onCancelDelete}
                        />
                    )}
                </div>
            </CardHeader>
            {connection.protocol === "saml" ? (
                <>
                    <CardDetail>
                        <strong>Entity ID:</strong> {connection.idp_entity_id}
                    </CardDetail>
                    <CardDetail>
                        <strong>SSO URL:</strong> {connection.idp_sso_url}
                    </CardDetail>
                </>
            ) : (
                <>
                    <CardDetail>
                        <strong>Issuer URL:</strong> {connection.oidc_issuer_url}
                    </CardDetail>
                    <CardDetail>
                        <strong>Client ID:</strong> {connection.oidc_client_id}
                    </CardDetail>
                    <CardDetail>
                        <strong>Scopes:</strong> {connection.oidc_scopes || "openid profile email"}
                    </CardDetail>
                </>
            )}
            <CardDetail>
                <strong>Created:</strong>{" "}
                {new Date(connection.created_at).toLocaleDateString()}
            </CardDetail>

            {/* Connection Test Section */}
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <Button
                        $outline
                        onClick={handleTestConnection}
                        disabled={testing}
                        style={{ width: "auto", fontSize: "12px", padding: "6px 12px" }}
                    >
                        {testing ? <Spinner size={12} /> : <Shield size={14} />}
                        {testing ? "Testing..." : "Test Connection"}
                    </Button>
                    {testResult && (
                        <span style={{
                            fontSize: "12px",
                            color: testResult.success ? "var(--color-success, #22c55e)" : "var(--color-error)",
                            fontWeight: 500
                        }}>
                            {testResult.success ? "✓ Connection valid" : "✗ Connection failed"}
                        </span>
                    )}
                </div>
                {testResult && !testResult.success && testResult.errors && (
                    <div style={{
                        marginTop: "8px",
                        padding: "8px 12px",
                        background: "var(--color-error-background, rgba(239, 68, 68, 0.1))",
                        borderRadius: "4px",
                        fontSize: "12px"
                    }}>
                        {Object.entries(testResult.errors).map(([key, value]) => (
                            <div key={key} style={{ color: "var(--color-error)", marginBottom: "4px" }}>
                                <strong>{key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SCIM Provisioning Section */}
            <SCIMSection>
                <SCIMHeader>
                    <Shield size={14} />
                    SCIM Provisioning
                </SCIMHeader>

                {scimToken?.scim_base_url && (
                    <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "12px", color: "var(--color-muted)", marginBottom: "4px" }}>
                            SCIM Base URL:
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <code style={{ fontSize: "11px", flex: 1, wordBreak: "break-all" }}>
                                {scimToken.scim_base_url}
                            </code>
                            <IconButton onClick={() => copyToClipboard(scimToken.scim_base_url, "scim-url")}>
                                {copiedField === "scim-url" ? <Check size={14} /> : <Copy size={14} />}
                            </IconButton>
                        </div>
                    </div>
                )}

                {showNewToken && (
                    <SCIMTokenDisplay>
                        <div style={{ fontSize: "11px", color: "var(--color-warning)", marginBottom: "8px" }}>
                            ⚠️ Copy this token now. It won&apos;t be shown again.
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                            <span style={{ flex: 1 }}>{showNewToken}</span>
                            <IconButton onClick={() => copyToClipboard(showNewToken, "scim-token")}>
                                {copiedField === "scim-token" ? <Check size={14} /> : <Copy size={14} />}
                            </IconButton>
                        </div>
                    </SCIMTokenDisplay>
                )}

                {scimToken?.exists && scimToken?.token?.enabled && !showNewToken && (
                    <div style={{ fontSize: "12px", color: "var(--color-muted)", marginBottom: "12px" }}>
                        Token: <code>{scimToken.token.token_prefix}...</code>
                        {scimToken.token.last_used_at && (
                            <span> · Last used: {new Date(scimToken.token.last_used_at).toLocaleDateString()}</span>
                        )}
                    </div>
                )}

                <SCIMActions>
                    {(!scimToken?.exists || !scimToken?.token?.enabled) ? (
                        <Button
                            onClick={handleGenerateToken}
                            disabled={scimLoading}
                            style={{ width: "auto", fontSize: "12px", padding: "6px 12px" }}
                        >
                            {scimLoading ? <Spinner size={12} /> : <Plus size={14} />}
                            Generate SCIM Token
                        </Button>
                    ) : (
                        <>
                            <Button
                                $outline
                                onClick={handleGenerateToken}
                                disabled={scimLoading}
                                style={{ width: "auto", fontSize: "12px", padding: "6px 12px" }}
                            >
                                Rotate Token
                            </Button>
                            <Button
                                $outline
                                onClick={handleRevokeToken}
                                disabled={scimLoading}
                                style={{ width: "auto", fontSize: "12px", padding: "6px 12px", color: "var(--color-error)" }}
                            >
                                Revoke Token
                            </Button>
                        </>
                    )}
                </SCIMActions>
            </SCIMSection>
        </Card>
    );
};

// Full-screen SSO setup component
interface CreateSSOScreenProps {
    onClose: () => void;
    onCreate: (payload: CreateEnterpriseConnectionPayload) => Promise<void>;
}



const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-foreground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CreateSSOScreen = ({ onCreate }: CreateSSOScreenProps) => {
    const { getDomains, testEnterpriseConnectionConfig } = useActiveOrganization();
    const { deployment } = useDeployment();
    const [loading, setLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<IdPTemplate | null>(null);
    const [protocol, setProtocol] = useState<"saml" | "oidc">("saml");
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [formData, setFormData] = useState({
        domain_id: "",
        idp_entity_id: "",
        idp_sso_url: "",
        idp_certificate: "",
        oidc_issuer_url: "",
        oidc_client_id: "",
        oidc_client_secret: "",
        oidc_scopes: "openid profile email",
        jit_enabled: true,
        attr_first_name: "",
        attr_last_name: "",
        attr_email: "",
    });
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; checks: Record<string, boolean>; errors?: Record<string, string> } | null>(null);

    const {
        data: domains = [],
        isLoading: domainsLoading,
    } = useSWR(
        "wacht-org-verified-domains-for-sso-screen",
        async () => {
            const allDomains = await getDomains?.() || [];
            return allDomains.filter(d => d.verified);
        },
        { revalidateOnFocus: false }
    );

    const selectTemplate = (template: IdPTemplate) => {
        setSelectedTemplate(template);
        setProtocol(template.protocol);
        if (template.protocol === "saml") {
            setFormData(prev => ({
                ...prev,
                idp_entity_id: template.placeholders.entityId || "",
                idp_sso_url: template.placeholders.ssoUrl || "",
                // Prefill attribute mappings from template
                attr_first_name: template.attributeMapping?.first_name || "",
                attr_last_name: template.attributeMapping?.last_name || "",
                attr_email: template.attributeMapping?.email || "",
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                oidc_issuer_url: template.placeholders.issuerUrl || "",
                oidc_scopes: template.placeholders.scopes || "openid profile email",
                // Prefill attribute mappings from template
                attr_first_name: template.attributeMapping?.first_name || "",
                attr_last_name: template.attributeMapping?.last_name || "",
                attr_email: template.attributeMapping?.email || "",
            }));
        }
    };

    const oidcCallbackUrl = deployment?.backend_host
        ? `${deployment.backend_host.startsWith("https://") ? "" : "https://"}${deployment.backend_host}/auth/sso/oidc/callback`
        : "";

    const spMetadataUrl = deployment?.backend_host
        ? `https://${deployment.backend_host}/auth/sso/metadata`
        : "";
    const spAcsUrl = deployment?.backend_host
        ? `https://${deployment.backend_host}/auth/sso/callback`
        : "";

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Build attribute mapping from form fields (only include non-empty values)
            const attributeMapping: Record<string, string> = {};
            if (formData.attr_first_name) attributeMapping.first_name = formData.attr_first_name;
            if (formData.attr_last_name) attributeMapping.last_name = formData.attr_last_name;
            if (formData.attr_email) attributeMapping.email = formData.attr_email;

            const hasAttributeMapping = Object.keys(attributeMapping).length > 0;

            if (protocol === "saml") {
                await onCreate({
                    protocol: "saml",
                    domain_id: formData.domain_id || undefined,
                    idp_entity_id: formData.idp_entity_id,
                    idp_sso_url: formData.idp_sso_url,
                    idp_certificate: formData.idp_certificate,
                    jit_enabled: formData.jit_enabled,
                    ...(hasAttributeMapping && { attribute_mapping: attributeMapping }),
                });
            } else {
                await onCreate({
                    protocol: "oidc",
                    domain_id: formData.domain_id || undefined,
                    oidc_issuer_url: formData.oidc_issuer_url,
                    oidc_client_id: formData.oidc_client_id,
                    oidc_client_secret: formData.oidc_client_secret,
                    oidc_scopes: formData.oidc_scopes,
                    jit_enabled: formData.jit_enabled,
                    ...(hasAttributeMapping && { attribute_mapping: attributeMapping }),
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);

        // Client-side validation for placeholder characters
        const hasPlaceholder = (value: string) => value.includes("{") || value.includes("}");
        const errors: Record<string, string> = {};
        const checks: Record<string, boolean> = {};

        if (protocol === "saml") {
            if (!formData.idp_entity_id) {
                checks["entity_id_valid"] = false;
                errors["entity_id_valid"] = "IdP Entity ID is required";
            } else if (hasPlaceholder(formData.idp_entity_id)) {
                checks["entity_id_valid"] = false;
                errors["entity_id_valid"] = "IdP Entity ID contains placeholder values - please replace with actual values";
            } else {
                checks["entity_id_valid"] = true;
            }

            if (!formData.idp_sso_url) {
                checks["sso_url_valid"] = false;
                errors["sso_url_valid"] = "IdP SSO URL is required";
            } else if (hasPlaceholder(formData.idp_sso_url)) {
                checks["sso_url_valid"] = false;
                errors["sso_url_valid"] = "IdP SSO URL contains placeholder values - please replace with actual values";
            } else {
                checks["sso_url_valid"] = true;
            }

            if (!formData.idp_certificate) {
                checks["certificate_provided"] = false;
                errors["certificate_provided"] = "X.509 Certificate is required";
            } else {
                checks["certificate_provided"] = true;
            }
        } else {
            if (!formData.oidc_issuer_url) {
                checks["issuer_url_valid"] = false;
                errors["issuer_url_valid"] = "Issuer URL is required";
            } else if (hasPlaceholder(formData.oidc_issuer_url)) {
                checks["issuer_url_valid"] = false;
                errors["issuer_url_valid"] = "Issuer URL contains placeholder values - please replace with actual values";
            } else {
                checks["issuer_url_valid"] = true;
            }

            if (!formData.oidc_client_id) {
                checks["client_id_valid"] = false;
                errors["client_id_valid"] = "Client ID is required";
            } else if (hasPlaceholder(formData.oidc_client_id)) {
                checks["client_id_valid"] = false;
                errors["client_id_valid"] = "Client ID contains placeholder values - please replace with actual values";
            } else {
                checks["client_id_valid"] = true;
            }
        }

        // If any client-side validation failed, show those results without calling API
        if (Object.keys(errors).length > 0) {
            setTestResult({ success: false, checks, errors });
            setTesting(false);
            return;
        }

        try {
            const testData = protocol === "saml"
                ? {
                    protocol: "saml" as const,
                    idp_entity_id: formData.idp_entity_id,
                    idp_sso_url: formData.idp_sso_url,
                    idp_certificate: formData.idp_certificate,
                }
                : {
                    protocol: "oidc" as const,
                    oidc_issuer_url: formData.oidc_issuer_url,
                    oidc_client_id: formData.oidc_client_id,
                    oidc_client_secret: formData.oidc_client_secret,
                };

            const result = await testEnterpriseConnectionConfig?.(testData);
            if (result) {
                setTestResult(result);
            }
        } catch (err) {
            setTestResult({ success: false, checks: {}, errors: { general: "Test failed: " + (err as Error).message } });
        } finally {
            setTesting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Template Selection - Accordion behavior */}
            {selectedTemplate ? (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    background: "var(--color-primary-background)",
                    borderRadius: "8px",
                    border: "1px solid var(--color-primary)",
                    marginBottom: "16px"
                }}>
                    {selectedTemplate.logo ? (
                        <TemplateLogo src={selectedTemplate.logo} alt={selectedTemplate.name} />
                    ) : (
                        <div style={{ height: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center", background: "white", borderRadius: "4px", padding: "3px" }}><Shield size={18} color="#666" /></div>
                    )}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: "14px", color: "var(--color-foreground)" }}>
                            {selectedTemplate.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--color-muted)", textTransform: "uppercase" }}>
                            {selectedTemplate.protocol}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSelectedTemplate(null)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-primary)",
                            cursor: "pointer",
                            fontSize: "12px",
                            padding: "4px 8px"
                        }}
                    >
                        Change
                    </button>
                </div>
            ) : (
                <>
                    <SectionTitle>SAML Providers</SectionTitle>
                    <TemplateGrid>
                        {IDP_TEMPLATES.filter(t => t.protocol === "saml").map((template) => (
                            <TemplateCard
                                key={template.id}
                                type="button"
                                $selected={false}
                                onClick={() => selectTemplate(template)}
                            >
                                {template.logo ? (
                                    <TemplateLogo src={template.logo} alt={template.name} />
                                ) : (
                                    <div style={{ height: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center", background: "white", borderRadius: "4px", padding: "3px" }}><Shield size={18} color="#666" /></div>
                                )}
                                <TemplateName>{template.name}</TemplateName>
                            </TemplateCard>
                        ))}
                    </TemplateGrid>

                    <SectionTitle style={{ marginTop: "20px" }}>OIDC Providers</SectionTitle>
                    <TemplateGrid>
                        {IDP_TEMPLATES.filter(t => t.protocol === "oidc").map((template) => (
                            <TemplateCard
                                key={template.id}
                                type="button"
                                $selected={false}
                                onClick={() => selectTemplate(template)}
                            >
                                {template.logo ? (
                                    <TemplateLogo src={template.logo} alt={template.name} />
                                ) : (
                                    <div style={{ height: "24px", width: "24px", display: "flex", alignItems: "center", justifyContent: "center", background: "white", borderRadius: "4px", padding: "3px" }}><Shield size={18} color="#666" /></div>
                                )}
                                <TemplateName>{template.name}</TemplateName>
                            </TemplateCard>
                        ))}
                    </TemplateGrid>
                </>
            )}

            {/* Only show SP Details and Configuration when a template is selected */}
            {selectedTemplate && (
                <>
                    {/* Service Provider Details */}
                    <InfoBox style={{ marginTop: "16px" }}>
                        <div style={{ marginBottom: "12px", fontWeight: 500 }}>
                            Service Provider Details
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {protocol === "saml" ? (
                                <>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ minWidth: "80px", fontSize: "12px" }}>ACS URL:</span>
                                        <code style={{ flex: 1, fontSize: "11px" }}>{spAcsUrl}</code>
                                        <IconButton onClick={() => copyToClipboard(spAcsUrl, "acs")}>
                                            {copiedField === "acs" ? <Check size={12} /> : <Copy size={12} />}
                                        </IconButton>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ minWidth: "80px", fontSize: "12px" }}>Metadata:</span>
                                        <code style={{ flex: 1, fontSize: "11px" }}>{spMetadataUrl}</code>
                                        <IconButton onClick={() => copyToClipboard(spMetadataUrl, "metadata")}>
                                            {copiedField === "metadata" ? <Check size={12} /> : <Copy size={12} />}
                                        </IconButton>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ minWidth: "80px", fontSize: "12px" }}>Callback:</span>
                                    <code style={{ flex: 1, fontSize: "11px" }}>{oidcCallbackUrl}</code>
                                    <IconButton onClick={() => copyToClipboard(oidcCallbackUrl, "callback")}>
                                        {copiedField === "callback" ? <Check size={12} /> : <Copy size={12} />}
                                    </IconButton>
                                </div>
                            )}
                        </div>
                    </InfoBox>

                    {/* Configuration Form */}
                    <div style={{ marginTop: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <SectionTitle style={{ margin: 0 }}>
                                {selectedTemplate ? `${selectedTemplate.name} Configuration` : "Configuration"}
                            </SectionTitle>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                {selectedTemplate && selectedTemplate.docUrl && (
                                    <a href={selectedTemplate.docUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "var(--color-primary)", textDecoration: "none", display: "flex", gap: "2px", alignItems: "center" }}>
                                        <ExternalLink size={12} /> Docs
                                    </a>
                                )}
                                <Button type="button" onClick={testConnection} disabled={testing || !selectedTemplate} style={{ width: "auto", padding: "8px 16px", background: "transparent", border: "1px solid var(--color-border)" }}>
                                    {testing ? <Spinner size={16} /> : "Test Connection"}
                                </Button>
                                <Button type="submit" disabled={loading || domains.length === 0 || !selectedTemplate} style={{ width: "auto", padding: "8px 16px" }}>
                                    {loading ? <Spinner size={16} /> : "Create Connection"}
                                </Button>
                            </div>
                        </div>

                        {/* Test Result Display */}
                        {testResult && (() => {
                            const labelMap: Record<string, string> = {
                                // Client-side checks
                                entity_id_valid: "IdP Entity ID",
                                sso_url_valid: "IdP SSO URL",
                                certificate_provided: "X.509 Certificate",
                                issuer_url_valid: "Issuer URL",
                                client_id_valid: "Client ID",
                                // Server-side checks
                                certificate_valid: "Certificate Valid",
                                sso_url_reachable: "SSO URL Reachable",
                                discovery_reachable: "Discovery Endpoint",
                                discovery_valid: "Discovery Valid",
                                authorization_endpoint: "Authorization Endpoint",
                                token_endpoint: "Token Endpoint",
                                issuer_valid: "Issuer URL Valid",
                            };
                            return (
                                <div style={{
                                    padding: "16px",
                                    marginBottom: "16px",
                                    borderRadius: "8px",
                                    background: testResult.success ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                    border: `1px solid ${testResult.success ? "#10b981" : "#ef4444"}`
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: "12px", fontSize: "14px", color: testResult.success ? "#10b981" : "#ef4444" }}>
                                        {testResult.success ? "✓ All checks passed" : "✗ Some checks failed"}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {Object.entries(testResult.checks).map(([key, value]) => (
                                            <div key={key} style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: "8px",
                                                padding: "8px 12px",
                                                background: "var(--color-background)",
                                                borderRadius: "6px",
                                                border: "1px solid var(--color-border)"
                                            }}>
                                                <span style={{
                                                    color: value ? "#10b981" : "#ef4444",
                                                    fontWeight: 600,
                                                    fontSize: "14px",
                                                    minWidth: "16px"
                                                }}>
                                                    {value ? "✓" : "✗"}
                                                </span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 500, color: "var(--color-foreground)", fontSize: "13px" }}>
                                                        {labelMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                                    </div>
                                                    {testResult.errors?.[key] && (
                                                        <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                                                            {testResult.errors[key]}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Two-column grid for form fields */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            {/* Only show Protocol dropdown when no template selected */}
                            {!selectedTemplate && (
                                <FormGroup>
                                    <Label>Protocol *</Label>
                                    <Select
                                        value={protocol}
                                        onChange={(e) => setProtocol(e.target.value as "saml" | "oidc")}
                                    >
                                        <option value="saml">SAML</option>
                                        <option value="oidc">OpenID Connect (OIDC)</option>
                                    </Select>
                                </FormGroup>
                            )}

                            <FormGroup style={{ gridColumn: "1 / -1" }}>
                                <Label>Domain *</Label>
                                {domainsLoading ? (
                                    <div style={{ padding: "10px", color: "var(--color-muted)" }}>
                                        Loading domains...
                                    </div>
                                ) : domains.length === 0 ? (
                                    <InfoBox style={{ marginBottom: 0 }}>
                                        No verified domains found. Please add and verify a domain first.
                                    </InfoBox>
                                ) : (
                                    <Select
                                        value={formData.domain_id}
                                        onChange={(e) => setFormData({ ...formData, domain_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a verified domain</option>
                                        {domains.map(domain => (
                                            <option key={domain.id} value={domain.id}>{domain.fqdn}</option>
                                        ))}
                                    </Select>
                                )}
                            </FormGroup>

                            {protocol === "saml" ? (
                                <>
                                    <FormGroup>
                                        <Label>IdP Entity ID *</Label>
                                        <Input
                                            type="text"
                                            value={formData.idp_entity_id}
                                            onChange={(e) => setFormData({ ...formData, idp_entity_id: e.target.value })}
                                            placeholder="https://idp.example.com/entity"
                                            required
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>IdP SSO URL *</Label>
                                        <Input
                                            type="url"
                                            value={formData.idp_sso_url}
                                            onChange={(e) => setFormData({ ...formData, idp_sso_url: e.target.value })}
                                            placeholder="https://idp.example.com/sso"
                                            required
                                        />
                                    </FormGroup>
                                    <FormGroup style={{ gridColumn: "1 / -1" }}>
                                        <Label>X.509 Certificate *</Label>
                                        <Textarea
                                            value={formData.idp_certificate}
                                            onChange={(e) => setFormData({ ...formData, idp_certificate: e.target.value })}
                                            placeholder="-----BEGIN CERTIFICATE-----..."
                                            required
                                        />
                                    </FormGroup>
                                </>
                            ) : (
                                <>
                                    <FormGroup>
                                        <Label>Issuer URL *</Label>
                                        <Input
                                            type="url"
                                            value={formData.oidc_issuer_url}
                                            onChange={(e) => setFormData({ ...formData, oidc_issuer_url: e.target.value })}
                                            placeholder="https://login.example.com"
                                            required
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Client ID *</Label>
                                        <Input
                                            type="text"
                                            value={formData.oidc_client_id}
                                            onChange={(e) => setFormData({ ...formData, oidc_client_id: e.target.value })}
                                            placeholder="your-client-id"
                                            required
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Client Secret *</Label>
                                        <Input
                                            type="password"
                                            value={formData.oidc_client_secret}
                                            onChange={(e) => setFormData({ ...formData, oidc_client_secret: e.target.value })}
                                            placeholder="your-client-secret"
                                            required
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Scopes</Label>
                                        <Input
                                            type="text"
                                            value={formData.oidc_scopes}
                                            onChange={(e) => setFormData({ ...formData, oidc_scopes: e.target.value })}
                                            placeholder="openid profile email"
                                        />
                                    </FormGroup>
                                </>
                            )}

                            {/* JIT Provisioning Toggle */}
                            <FormGroup style={{ gridColumn: "1 / -1" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.jit_enabled}
                                        onChange={(e) => setFormData({ ...formData, jit_enabled: e.target.checked })}
                                        style={{ width: "16px", height: "16px" }}
                                    />
                                    <span style={{ fontWeight: 500, color: "var(--color-foreground)" }}>Enable JIT Provisioning</span>
                                </label>
                                <div style={{ fontSize: "12px", color: "var(--color-muted)", marginTop: "4px", marginLeft: "24px" }}>
                                    When enabled, new users are automatically created on their first SSO login. When disabled, only pre-existing users can sign in via SSO.
                                </div>
                            </FormGroup>

                            {/* Advanced Options - Attribute Mapping */}
                            <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                                <div
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        cursor: "pointer",
                                        color: "var(--color-primary)",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        marginBottom: showAdvanced ? "16px" : "0"
                                    }}
                                >
                                    <span style={{ fontSize: "10px" }}>{showAdvanced ? "▼" : "▶"}</span>
                                    Advanced Options (Attribute Mapping)
                                </div>

                                {showAdvanced && (
                                    <div style={{
                                        padding: "16px",
                                        background: "var(--color-background-alt)",
                                        borderRadius: "8px",
                                        border: "1px solid var(--color-border)"
                                    }}>
                                        <div style={{ fontSize: "12px", color: "var(--color-muted)", marginBottom: "12px" }}>
                                            Map IdP attribute names to Wacht user fields. Leave empty to use default attribute names.
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                            <FormGroup>
                                                <Label>First Name Attribute</Label>
                                                <Input
                                                    type="text"
                                                    value={formData.attr_first_name}
                                                    onChange={(e) => setFormData({ ...formData, attr_first_name: e.target.value })}
                                                    placeholder={protocol === "saml" ? "givenName" : "given_name"}
                                                />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Last Name Attribute</Label>
                                                <Input
                                                    type="text"
                                                    value={formData.attr_last_name}
                                                    onChange={(e) => setFormData({ ...formData, attr_last_name: e.target.value })}
                                                    placeholder={protocol === "saml" ? "surname" : "family_name"}
                                                />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Email Attribute</Label>
                                                <Input
                                                    type="text"
                                                    value={formData.attr_email}
                                                    onChange={(e) => setFormData({ ...formData, attr_email: e.target.value })}
                                                    placeholder="email"
                                                />
                                            </FormGroup>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </form>
    );
};
