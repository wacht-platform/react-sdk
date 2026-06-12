"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { Shield, Copy, Check, Plus, ArrowSquareOut } from "@phosphor-icons/react";
import { useOrganizationList } from "@/hooks/use-organization";
import { useDeployment } from "@/hooks";
import { Spinner } from "../utility/spinner";
import { ConfirmationPopover } from "../utility/confirmation-popover";
import { useScreenContext } from "./context";
import { Button, Switch } from "../utility";
import { Input } from "../utility/input";
import { FormGroup, Label } from "../utility/form";
import type {
    EnterpriseConnection,
    CreateEnterpriseConnectionPayload,
    Organization,
} from "@/types";

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
            first_name:
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
            last_name:
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
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

// Provider logo with a graceful fallback: many brand logo URLs (Azure, ADFS…)
// 404 or are hotlink-blocked, which renders a broken image — show the Shield
// placeholder instead.
const TemplateLogo = ({ template }: { template: IdPTemplate }) => {
    const [failed, setFailed] = useState(false);
    if (!template.logo || failed) {
        return (
            <span className="w-avatar w-avatar--square w-avatar--md w-sso-logo--ph">
                <Shield size={18} className="w-text-muted" />
            </span>
        );
    }
    return (
        <img
            className="w-avatar w-avatar--square w-avatar--md w-sso-logo"
            src={template.logo}
            alt={template.name}
            onError={() => setFailed(true)}
        />
    );
};

export const SSOSettingsSection = ({
    organization,
}: {
    organization: Organization;
}) => {
    const {
        getEnterpriseConnections,
        createEnterpriseConnection,
        deleteEnterpriseConnection,
        testEnterpriseConnection,
        generateSCIMToken,
        getSCIMToken,
        revokeSCIMToken,
    } = useOrganizationList();
    const { toast } = useScreenContext();
    const [isCreating, setIsCreating] = useState(false);
    const [connectionToDelete, setConnectionToDelete] = useState<string | null>(
        null,
    );

    const {
        data: connections = [],
        isLoading,
        mutate,
    } = useSWR(
        organization?.id ? `wacht-org-sso:${organization.id}` : null,
        async () => (await getEnterpriseConnections?.(organization)) || [],
        {
            refreshInterval: 30000,
            revalidateOnFocus: false,
        },
    );

    const handleDelete = async (connectionId: string) => {
        try {
            await deleteEnterpriseConnection?.(organization, connectionId);
            mutate();
            toast("SSO connection deleted", "info");
        } catch (error: any) {
            toast(error.message || "Failed to delete connection", "error");
        }
        setConnectionToDelete(null);
    };

    if (isLoading) {
        return (
            <div className="w-loading">
                <Spinner />
            </div>
        );
    }

    // Full-screen create view
    if (isCreating) {
        return (
            <CreateSSOScreen
                organization={organization}
                onClose={() => setIsCreating(false)}
                onCreate={async (payload) => {
                    try {
                        await createEnterpriseConnection?.(
                            organization,
                            payload,
                        );
                        mutate();
                        setIsCreating(false);
                        toast("SSO connection created", "info");
                    } catch (error: any) {
                        toast(
                            error.message || "Failed to create connection",
                            "error",
                        );
                    }
                }}
            />
        );
    }

    return (
        <>
            {connections.length === 0 ? (
                <div className="w-empty w-empty--fill">
                    <div className="w-empty-ic">
                        <Shield size={20} />
                    </div>
                    <div className="w-empty-text">
                        <h4>Enterprise SSO</h4>
                        <p>Let members sign in with your identity provider.</p>
                    </div>
                    <div className="w-empty-action">
                        <Button onClick={() => setIsCreating(true)}>
                            <Plus size={16} /> Configure SSO
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="w-flex w-items-center w-justify-between w-gap-4 w-sechead">
                        <div className="w-grow w-flex-col w-gap-1">
                            <h3 className="w-title">Enterprise SSO</h3>
                            <p className="w-sub">
                                Configure SAML or OIDC SSO for your organization
                            </p>
                        </div>
                    </div>
                    {connections.map((connection: EnterpriseConnection) => (
                        <ConnectionCard
                            key={connection.id}
                            connection={connection}
                            onDelete={(id) => setConnectionToDelete(id)}
                            connectionToDelete={connectionToDelete}
                            onConfirmDelete={handleDelete}
                            onCancelDelete={() => setConnectionToDelete(null)}
                            testConnection={(id) =>
                                testEnterpriseConnection!(organization, id)
                            }
                            generateSCIMToken={(id) =>
                                generateSCIMToken!(organization, id)
                            }
                            getSCIMToken={(id) =>
                                getSCIMToken!(organization, id)
                            }
                            revokeSCIMToken={(id) =>
                                revokeSCIMToken!(organization, id)
                            }
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
    const [testResult, setTestResult] = useState<{
        success: boolean;
        checks: Record<string, boolean>;
        errors?: Record<string, string>;
    } | null>(null);

    useEffect(() => {
        if (getSCIMToken && connection.id) {
            getSCIMToken(connection.id)
                .then(setScimToken)
                .catch(() => {});
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
            setTestResult({
                success: false,
                checks: {},
                errors: { general: error.message || "Test failed" },
            });
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
            // Note: scim_base_url is inside the token object
            setScimToken({ exists: true, token: result });
            toast(
                "SCIM token generated. Copy it now - it won't be shown again!",
                "info",
            );
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
            setScimToken({
                exists: false,
                scim_base_url: scimToken?.scim_base_url,
            });
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
        <div className="w-flex-col w-gap-4 w-sso-conn">
            <div className="w-flex w-justify-between w-items-start">
                <h3 className="w-sec w-inline w-gap-2">
                    <Shield size={16} />
                    {connection.protocol === "oidc" ? "OIDC SSO" : "SAML SSO"}
                    <span className="w-pill w-pill--current">{connection.protocol.toUpperCase()}</span>
                </h3>
                <div className="w-flex w-items-center w-gap-2">
                    <Button
                        $size="sm"
                        onClick={handleTestConnection}
                        disabled={testing}
                    >
                        {testing ? <Spinner size={14} /> : "Test"}
                    </Button>
                    <div className="w-relative">
                        <Button
                            $size="sm"
                            $outline
                            onClick={() => onDelete(connection.id)}
                            className="w-text-error"
                        >
                            Remove
                        </Button>
                        {connectionToDelete === connection.id && (
                            <ConfirmationPopover
                                title="Delete this SSO connection?"
                                onConfirm={() => onConfirmDelete(connection.id)}
                                onCancel={onCancelDelete}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Test Result */}
            {testResult && (
                <div className={`w-banner ${testResult.success ? "w-banner--success" : "w-banner--error"}`}>
                    <span className={`w-banner-txt w-flex-col w-gap-1 ${testResult.success ? "w-text-success" : "w-text-error"}`}>
                        <span>
                            {testResult.success
                                ? "✓ Connection is valid"
                                : "✗ Connection failed"}
                        </span>
                        {testResult.errors &&
                            Object.entries(testResult.errors).map(
                                ([key, value]) => (
                                    <div key={key}>
                                        {key.replace(/_/g, " ")}: {value}
                                    </div>
                                ),
                            )}
                    </span>
                </div>
            )}

            {/* Connection Details - Compact Grid */}
            <div className="w-sso-detail">
                {connection.protocol === "saml" ? (
                    <>
                        <span className="w-secsub">Entity ID</span>
                        <span className="w-sec w-break-all">
                            {connection.idp_entity_id}
                        </span>
                        <span className="w-secsub">SSO URL</span>
                        <span className="w-sec w-break-all">
                            {connection.idp_sso_url}
                        </span>
                    </>
                ) : (
                    <>
                        <span className="w-secsub">Issuer URL</span>
                        <span className="w-sec w-break-all">
                            {connection.oidc_issuer_url}
                        </span>
                        <span className="w-secsub">Client ID</span>
                        <span className="w-sec">{connection.oidc_client_id}</span>
                        <span className="w-secsub">Scopes</span>
                        <span className="w-sec">
                            {connection.oidc_scopes || "openid profile email"}
                        </span>
                    </>
                )}
                <span className="w-secsub">Created</span>
                <span className="w-sec">
                    {new Date(connection.created_at).toLocaleDateString()}
                </span>
            </div>

            {/* SCIM Provisioning Section */}
            <div className="w-flex-col w-gap-3 w-sso-scim">
                <div className="w-flex w-justify-between w-items-center">
                    <div className="w-sec w-inline w-gap-2">
                        <Shield size={14} />
                        SCIM Provisioning
                    </div>
                    <div className="w-flex w-wrap w-gap-2">
                        {!scimToken?.exists || !scimToken?.token?.enabled ? (
                            <Button
                                $size="sm"
                                onClick={handleGenerateToken}
                                disabled={scimLoading}
                            >
                                {scimLoading ? (
                                    <Spinner size={14} />
                                ) : (
                                    "Generate Token"
                                )}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    $size="sm"
                                    onClick={handleGenerateToken}
                                    disabled={scimLoading}
                                >
                                    {scimLoading ? (
                                        <Spinner size={14} />
                                    ) : (
                                        "Rotate"
                                    )}
                                </Button>
                                <Button
                                    $size="sm"
                                    $outline
                                    onClick={handleRevokeToken}
                                    disabled={scimLoading}
                                    className="w-text-error"
                                >
                                    Revoke
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {(scimToken?.token?.scim_base_url || showNewToken) && (
                    <div className="w-token">
                        <span className="w-secsub w-none">Base URL:</span>
                        <code>
                            {scimToken?.token?.scim_base_url || "Loading..."}
                        </code>
                        {scimToken?.token?.scim_base_url && (
                            <button
                                className="w-btn w-btn--icon"
                                onClick={() =>
                                    copyToClipboard(
                                        scimToken.token.scim_base_url,
                                        "scim-url",
                                    )
                                }
                            >
                                {copiedField === "scim-url" ? (
                                    <Check size={12} />
                                ) : (
                                    <Copy size={12} />
                                )}
                            </button>
                        )}
                    </div>
                )}

                {showNewToken && (
                    <div className="w-flex-col w-gap-2">
                        <div className="w-token">
                            <span className="w-secsub w-none">Token:</span>
                            <code>{showNewToken}</code>
                            <button
                                className="w-btn w-btn--icon"
                                onClick={() =>
                                    copyToClipboard(showNewToken, "scim-token")
                                }
                            >
                                {copiedField === "scim-token" ? (
                                    <Check size={12} />
                                ) : (
                                    <Copy size={12} />
                                )}
                            </button>
                        </div>
                        <div className="w-mono-faint w-text-warning">
                            ⚠️ Copy this token now. It won&apos;t be shown again.
                        </div>
                    </div>
                )}

                {scimToken?.exists &&
                    scimToken?.token?.enabled &&
                    !showNewToken && (
                        <div className="w-secsub">
                            Token:{" "}
                            <code className="w-mono-sm w-token-chip">
                                {scimToken.token.token_prefix}...
                            </code>
                            {scimToken.token.last_used_at && (
                                <span>
                                    {" "}
                                    · Last used:{" "}
                                    {new Date(
                                        scimToken.token.last_used_at,
                                    ).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    )}
            </div>
        </div>
    );
};

// Full-screen SSO setup component
interface CreateSSOScreenProps {
    onClose: () => void;
    onCreate: (payload: CreateEnterpriseConnectionPayload) => Promise<void>;
}

const CreateSSOScreen = ({
    onCreate,
    organization,
}: CreateSSOScreenProps & { organization: Organization }) => {
    const {
        getOrganizationDomains: getDomains,
        testEnterpriseConnectionConfig,
    } = useOrganizationList();
    const { deployment } = useDeployment();
    const { toast } = useScreenContext();
    const [loading, setLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] =
        useState<IdPTemplate | null>(null);
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
    const [testResult, setTestResult] = useState<{
        success: boolean;
        checks: Record<string, boolean>;
        errors?: Record<string, string>;
    } | null>(null);

    const { data: domains = [], isLoading: domainsLoading } = useSWR(
        "wacht-org-verified-domains-for-sso-screen",
        async () => {
            const allDomains = (await getDomains?.(organization)) || [];
            return allDomains.filter((d) => d.verified);
        },
        { revalidateOnFocus: false },
    );

    const selectTemplate = (template: IdPTemplate) => {
        setSelectedTemplate(template);
        setProtocol(template.protocol);
        if (template.protocol === "saml") {
            setFormData((prev) => ({
                ...prev,
                idp_entity_id: template.placeholders.entityId || "",
                idp_sso_url: template.placeholders.ssoUrl || "",
                // Prefill attribute mappings from template
                attr_first_name: template.attributeMapping?.first_name || "",
                attr_last_name: template.attributeMapping?.last_name || "",
                attr_email: template.attributeMapping?.email || "",
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                oidc_issuer_url: template.placeholders.issuerUrl || "",
                oidc_scopes:
                    template.placeholders.scopes || "openid profile email",
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

        // Validation - check for placeholder values
        const hasPlaceholder = (value: string) =>
            value.includes("{") || value.includes("}");

        if (protocol === "saml") {
            if (
                !formData.idp_entity_id ||
                hasPlaceholder(formData.idp_entity_id)
            ) {
                toast(
                    "Please enter a valid IdP Entity ID (no placeholders)",
                    "error",
                );
                return;
            }
            if (!formData.idp_sso_url || hasPlaceholder(formData.idp_sso_url)) {
                toast(
                    "Please enter a valid IdP SSO URL (no placeholders)",
                    "error",
                );
                return;
            }
            if (!formData.idp_certificate) {
                toast("Please provide the X.509 Certificate", "error");
                return;
            }
        } else {
            if (
                !formData.oidc_issuer_url ||
                hasPlaceholder(formData.oidc_issuer_url)
            ) {
                toast(
                    "Please enter a valid Issuer URL (no placeholders)",
                    "error",
                );
                return;
            }
            if (
                !formData.oidc_client_id ||
                hasPlaceholder(formData.oidc_client_id)
            ) {
                toast(
                    "Please enter a valid Client ID (no placeholders)",
                    "error",
                );
                return;
            }
            if (!formData.oidc_client_secret) {
                toast("Please enter the Client Secret", "error");
                return;
            }
        }

        setLoading(true);
        try {
            // Build attribute mapping from form fields (only include non-empty values)
            const attributeMapping: Record<string, string> = {};
            if (formData.attr_first_name)
                attributeMapping.first_name = formData.attr_first_name;
            if (formData.attr_last_name)
                attributeMapping.last_name = formData.attr_last_name;
            if (formData.attr_email)
                attributeMapping.email = formData.attr_email;

            const hasAttributeMapping =
                Object.keys(attributeMapping).length > 0;

            if (protocol === "saml") {
                await onCreate({
                    protocol: "saml",
                    domain_id: formData.domain_id || undefined,
                    idp_entity_id: formData.idp_entity_id,
                    idp_sso_url: formData.idp_sso_url,
                    idp_certificate: formData.idp_certificate,
                    jit_enabled: formData.jit_enabled,
                    ...(hasAttributeMapping && {
                        attribute_mapping: attributeMapping,
                    }),
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
                    ...(hasAttributeMapping && {
                        attribute_mapping: attributeMapping,
                    }),
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
        const hasPlaceholder = (value: string) =>
            value.includes("{") || value.includes("}");
        const errors: Record<string, string> = {};
        const checks: Record<string, boolean> = {};

        if (protocol === "saml") {
            if (!formData.idp_entity_id) {
                checks["entity_id_valid"] = false;
                errors["entity_id_valid"] = "IdP Entity ID is required";
            } else if (hasPlaceholder(formData.idp_entity_id)) {
                checks["entity_id_valid"] = false;
                errors["entity_id_valid"] =
                    "IdP Entity ID contains placeholder values - please replace with actual values";
            } else {
                checks["entity_id_valid"] = true;
            }

            if (!formData.idp_sso_url) {
                checks["sso_url_valid"] = false;
                errors["sso_url_valid"] = "IdP SSO URL is required";
            } else if (hasPlaceholder(formData.idp_sso_url)) {
                checks["sso_url_valid"] = false;
                errors["sso_url_valid"] =
                    "IdP SSO URL contains placeholder values - please replace with actual values";
            } else {
                checks["sso_url_valid"] = true;
            }

            if (!formData.idp_certificate) {
                checks["certificate_provided"] = false;
                errors["certificate_provided"] =
                    "X.509 Certificate is required";
            } else {
                checks["certificate_provided"] = true;
            }
        } else {
            if (!formData.oidc_issuer_url) {
                checks["issuer_url_valid"] = false;
                errors["issuer_url_valid"] = "Issuer URL is required";
            } else if (hasPlaceholder(formData.oidc_issuer_url)) {
                checks["issuer_url_valid"] = false;
                errors["issuer_url_valid"] =
                    "Issuer URL contains placeholder values - please replace with actual values";
            } else {
                checks["issuer_url_valid"] = true;
            }

            if (!formData.oidc_client_id) {
                checks["client_id_valid"] = false;
                errors["client_id_valid"] = "Client ID is required";
            } else if (hasPlaceholder(formData.oidc_client_id)) {
                checks["client_id_valid"] = false;
                errors["client_id_valid"] =
                    "Client ID contains placeholder values - please replace with actual values";
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
            const testData =
                protocol === "saml"
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

            const result = await testEnterpriseConnectionConfig?.(
                organization,
                testData,
            );
            if (result) {
                setTestResult(result);
            }
        } catch (err) {
            setTestResult({
                success: false,
                checks: {},
                errors: { general: "Test failed: " + (err as Error).message },
            });
        } finally {
            setTesting(false);
        }
    };

    const renderTemplateLogo = (template: IdPTemplate) => (
        <TemplateLogo template={template} />
    );

    return (
        <form onSubmit={handleSubmit} autoComplete="off" className="w-flex-col w-gap-4">
            {/* Template Selection - Accordion behavior */}
            {selectedTemplate ? (
                <div className="w-flex w-items-center w-gap-4 w-sso-template">
                    {renderTemplateLogo(selectedTemplate)}
                    <div className="w-grow">
                        <div className="w-sec">{selectedTemplate.name}</div>
                        <div className="w-eyebrow">
                            {selectedTemplate.protocol}
                        </div>
                    </div>
                    <Button
                        type="button"
                        $size="sm"
                        $outline
                        onClick={() => setSelectedTemplate(null)}
                    >
                        Change
                    </Button>
                </div>
            ) : (
                <div className="w-flex-col w-gap-5">
                    <div className="w-flex-col w-gap-3">
                        <div className="w-eyebrow">SAML Providers</div>
                        <div className="w-grid-4">
                            {IDP_TEMPLATES.filter((t) => t.protocol === "saml").map(
                                (template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        className="w-sso-tile"
                                        onClick={() => selectTemplate(template)}
                                    >
                                        {renderTemplateLogo(template)}
                                        <span className="w-secsub">{template.name}</span>
                                    </button>
                                ),
                            )}
                        </div>
                    </div>

                    <div className="w-flex-col w-gap-3">
                        <div className="w-eyebrow">OIDC Providers</div>
                        <div className="w-grid-4">
                            {IDP_TEMPLATES.filter((t) => t.protocol === "oidc").map(
                                (template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        className="w-sso-tile"
                                        onClick={() => selectTemplate(template)}
                                    >
                                        {renderTemplateLogo(template)}
                                        <span className="w-secsub">{template.name}</span>
                                    </button>
                                ),
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Only show SP Details and Configuration when a template is selected */}
            {selectedTemplate && (
                <>
                    {/* Service Provider Details */}
                    <div className="w-tile w-flex-col w-gap-3">
                        <div className="w-sec">Service Provider Details</div>
                        <div className="w-flex-col w-gap-2 w-full">
                            {protocol === "saml" ? (
                                <>
                                    <div className="w-token">
                                        <span className="w-secsub w-none">ACS URL:</span>
                                        <code>{spAcsUrl}</code>
                                        <button
                                            type="button"
                                            className="w-btn w-btn--icon"
                                            onClick={() =>
                                                copyToClipboard(spAcsUrl, "acs")
                                            }
                                        >
                                            {copiedField === "acs" ? (
                                                <Check size={12} />
                                            ) : (
                                                <Copy size={12} />
                                            )}
                                        </button>
                                    </div>
                                    <div className="w-token">
                                        <span className="w-secsub w-none">Metadata:</span>
                                        <code>{spMetadataUrl}</code>
                                        <button
                                            type="button"
                                            className="w-btn w-btn--icon"
                                            onClick={() =>
                                                copyToClipboard(
                                                    spMetadataUrl,
                                                    "metadata",
                                                )
                                            }
                                        >
                                            {copiedField === "metadata" ? (
                                                <Check size={12} />
                                            ) : (
                                                <Copy size={12} />
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="w-token">
                                    <span className="w-secsub w-none">Callback:</span>
                                    <code>{oidcCallbackUrl}</code>
                                    <button
                                        type="button"
                                        className="w-btn w-btn--icon"
                                        onClick={() =>
                                            copyToClipboard(
                                                oidcCallbackUrl,
                                                "callback",
                                            )
                                        }
                                    >
                                        {copiedField === "callback" ? (
                                            <Check size={12} />
                                        ) : (
                                            <Copy size={12} />
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Configuration Form */}
                    <div className="w-flex-col w-gap-3">
                        <div className="w-flex w-justify-between w-items-center w-gap-3">
                            <div className="w-eyebrow">
                                {selectedTemplate
                                    ? `${selectedTemplate.name} Configuration`
                                    : "Configuration"}
                            </div>
                            <div className="w-flex w-items-center w-gap-3">
                                {selectedTemplate &&
                                    selectedTemplate.docUrl && (
                                        <a
                                            href={selectedTemplate.docUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-link w-link--sm w-text-primary w-inline w-gap-1"
                                        >
                                            <ArrowSquareOut size={12} /> Docs
                                        </a>
                                    )}
                                <Button
                                    type="button"
                                    $size="sm"
                                    $outline
                                    onClick={testConnection}
                                    disabled={testing || !selectedTemplate}
                                >
                                    {testing ? (
                                        <Spinner size={16} />
                                    ) : (
                                        "Test Connection"
                                    )}
                                </Button>
                                <Button
                                    $size="sm"
                                    type="submit"
                                    disabled={
                                        loading ||
                                        domains.length === 0 ||
                                        !selectedTemplate
                                    }
                                >
                                    {loading ? (
                                        <Spinner size={16} />
                                    ) : (
                                        "Create Connection"
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Test Result Display */}
                        {testResult &&
                            (() => {
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
                                    authorization_endpoint:
                                        "Authorization Endpoint",
                                    token_endpoint: "Token Endpoint",
                                    issuer_valid: "Issuer URL Valid",
                                };
                                return (
                                    <div
                                        className={`w-banner ${testResult.success ? "w-banner--success" : "w-banner--error"} w-flex-col w-gap-3`}
                                    >
                                        <div className={`w-sec ${testResult.success ? "w-text-success" : "w-text-error"}`}>
                                            {testResult.success
                                                ? "✓ All checks passed"
                                                : "✗ Some checks failed"}
                                        </div>
                                        <div className="w-flex-col w-gap-2 w-full">
                                            {Object.entries(
                                                testResult.checks,
                                            ).map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="w-flex w-items-start w-gap-2 w-sso-check"
                                                >
                                                    <span className={`w-sso-check-mark ${value ? "w-text-success" : "w-text-error"}`}>
                                                        {value ? "✓" : "✗"}
                                                    </span>
                                                    <div className="w-grow w-flex-col w-gap-1">
                                                        <div className="w-sec">
                                                            {labelMap[key] ||
                                                                key
                                                                    .replace(
                                                                        /_/g,
                                                                        " ",
                                                                    )
                                                                    .replace(
                                                                        /\b\w/g,
                                                                        (l) =>
                                                                            l.toUpperCase(),
                                                                    )}
                                                        </div>
                                                        {testResult.errors?.[
                                                            key
                                                        ] && (
                                                            <div className="w-secsub w-text-error">
                                                                {
                                                                    testResult
                                                                        .errors[
                                                                        key
                                                                    ]
                                                                }
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
                        <div className="w-grid-2">

                            {/* Only show Protocol dropdown when no template selected */}
                            {!selectedTemplate && (
                                <FormGroup>
                                    <Label>Protocol *</Label>
                                    <select
                                        className="w-input"
                                        value={protocol}
                                        onChange={(e) =>
                                            setProtocol(
                                                e.target.value as
                                                    | "saml"
                                                    | "oidc",
                                            )
                                        }
                                    >
                                        <option value="saml">SAML</option>
                                        <option value="oidc">
                                            OpenID Connect (OIDC)
                                        </option>
                                    </select>
                                </FormGroup>
                            )}

                            <FormGroup className="w-col-full">
                                <Label>Domain *</Label>
                                {domainsLoading ? (
                                    <div className="w-secsub">
                                        Loading domains...
                                    </div>
                                ) : domains.length === 0 ? (
                                    <div className="w-banner w-banner--warn">
                                        <span className="w-banner-txt">
                                            No verified domains found. Please add
                                            and verify a domain first.
                                        </span>
                                    </div>
                                ) : (
                                    <select
                                        className="w-input"
                                        value={formData.domain_id}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                domain_id: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select a verified domain
                                        </option>
                                        {domains.map((domain) => (
                                            <option
                                                key={domain.id}
                                                value={domain.id}
                                            >
                                                {domain.fqdn}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </FormGroup>

                            {protocol === "saml" ? (
                                <>
                                    <FormGroup>
                                        <Label>IdP Entity ID *</Label>
                                        <Input
                                            type="text"
                                            value={formData.idp_entity_id}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    idp_entity_id:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="https://idp.example.com/entity"
                                            required
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>IdP SSO URL *</Label>
                                        <Input
                                            type="url"
                                            value={formData.idp_sso_url}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    idp_sso_url: e.target.value,
                                                })
                                            }
                                            placeholder="https://idp.example.com/sso"
                                            required
                                        />
                                    </FormGroup>
                                    <FormGroup className="w-col-full">
                                        <Label>X.509 Certificate *</Label>
                                        <Input
                                            as="textarea"
                                            value={formData.idp_certificate}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    idp_certificate:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="-----BEGIN CERTIFICATE-----..."
                                            required
                                            className="w-input--area w-input--mono"
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
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    oidc_issuer_url:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="https://login.example.com"
                                            required
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Client ID *</Label>
                                        <Input
                                            type="text"
                                            value={formData.oidc_client_id}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    oidc_client_id:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="your-client-id"
                                            required
                                            autoComplete="off"
                                            data-lpignore="true"
                                            data-form-type="other"
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Client Secret *</Label>
                                        <Input
                                            type="password"
                                            value={formData.oidc_client_secret}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    oidc_client_secret:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="your-client-secret"
                                            required
                                            autoComplete="new-password"
                                            data-lpignore="true"
                                            data-form-type="other"
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Scopes</Label>
                                        <Input
                                            type="text"
                                            value={formData.oidc_scopes}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    oidc_scopes: e.target.value,
                                                })
                                            }
                                            placeholder="openid profile email"
                                        />
                                    </FormGroup>
                                </>
                            )}

                            {/* JIT Provisioning Toggle */}
                            <FormGroup className="w-col-full">
                                <div className="w-flex w-items-center w-justify-between w-gap-4">
                                    <div className="w-flex-col w-gap-1">
                                        <span className="w-sec">
                                            Enable JIT Provisioning
                                        </span>
                                        <div className="w-secsub">
                                            When enabled, new users are
                                            automatically created on their first
                                            SSO login. When disabled, only
                                            pre-existing users can sign in via
                                            SSO.
                                        </div>
                                    </div>
                                    <Switch
                                        checked={formData.jit_enabled}
                                        onChange={() =>
                                            setFormData({
                                                ...formData,
                                                jit_enabled:
                                                    !formData.jit_enabled,
                                            })
                                        }
                                    />
                                </div>
                            </FormGroup>

                            {/* Advanced Options - Attribute Mapping */}
                            <div className="w-col-full w-flex-col w-gap-4">
                                <div
                                    className="w-inline w-gap-2 w-text-primary w-disclosure"
                                    onClick={() =>
                                        setShowAdvanced(!showAdvanced)
                                    }
                                >
                                    <span className="w-disclosure-caret">
                                        {showAdvanced ? "▼" : "▶"}
                                    </span>
                                    Advanced Options (Attribute Mapping)
                                </div>

                                {showAdvanced && (
                                    <div className="w-tile w-flex-col w-gap-3">
                                        <div className="w-secsub">
                                            Map IdP attribute names to Wacht
                                            user fields. Leave empty to use
                                            default attribute names.
                                        </div>
                                        <div className="w-grid-3">
                                            <FormGroup>
                                                <Label>
                                                    First Name Attribute
                                                </Label>
                                                <Input
                                                    type="text"
                                                    value={
                                                        formData.attr_first_name
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            attr_first_name:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder={
                                                        protocol === "saml"
                                                            ? "givenName"
                                                            : "given_name"
                                                    }
                                                />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>
                                                    Last Name Attribute
                                                </Label>
                                                <Input
                                                    type="text"
                                                    value={
                                                        formData.attr_last_name
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            attr_last_name:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder={
                                                        protocol === "saml"
                                                            ? "surname"
                                                            : "family_name"
                                                    }
                                                />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label>Email Attribute</Label>
                                                <Input
                                                    type="text"
                                                    value={formData.attr_email}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            attr_email:
                                                                e.target.value,
                                                        })
                                                    }
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
