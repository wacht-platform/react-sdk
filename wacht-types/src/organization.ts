import type { PublicUserData } from "./user";
import type { Segment } from "./segment";

// Eligibility restriction types for organization and workspace memberships
export type EligibilityRestrictionType =
  | "none"
  | "ip_not_allowed"
  | "mfa_required"
  | "ip_and_mfa_required";

export interface EligibilityRestriction {
  type: EligibilityRestrictionType;
  message: string;
}

export interface Organization {
  id: string;
  name: string;
  image_url: string;
  description: string;
  member_count: number;
  public_metadata: Record<string, unknown>;
  private_metadata: Record<string, unknown>;
  enforce_mfa: boolean;
  enable_ip_restriction: boolean;
  whitelisted_ips: string[];
  auto_assigned_workspace_id: string;
  created_at: string;
  updated_at: string;
  segments: Segment[];
}

export interface OrganizationRole {
  id: string;
  organization_id: string;
  name: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembershipWithOrganization {
  id: string;
  organization: Organization;
  user_id: string;
  roles: OrganizationRole[];
  public_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  eligibility_restriction?: EligibilityRestriction;
}

export interface OrganizationMembership {
  id: string;
  organization: Organization;
  user: PublicUserData;
  roles: OrganizationRole[];
  public_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationInvitation {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  email: string;
  initial_organization_role: OrganizationRole;
  inviter: OrganizationMembership;
  workspace: Workspace;
  initial_workspace_role: WorkspaceRole;
  expired: boolean;
}

export interface OrganizationDomain {
  id: string;
  organization_id: string;
  fqdn: string;
  verified: boolean;
  verification_dns_record_type: string;
  verification_dns_record_name: string;
  verification_dns_record_data: string;
  verification_attempts: number;
  created_at: string;
  updated_at: string;
}

export interface EnterpriseConnection {
  id: string;
  organization_id: string;
  deployment_id: string;
  domain_id?: string;
  domain?: OrganizationDomain;
  protocol: "saml" | "oidc";
  idp_entity_id?: string;
  idp_sso_url?: string;
  idp_certificate?: string;
  oidc_client_id?: string;
  oidc_issuer_url?: string;
  oidc_scopes?: string;
  jit_enabled: boolean;
  attribute_mapping?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface CreateEnterpriseConnectionPayload {
  domain_id?: string;
  protocol: "saml" | "oidc";
  idp_entity_id?: string;
  idp_sso_url?: string;
  idp_certificate?: string;
  oidc_client_id?: string;
  oidc_client_secret?: string;
  oidc_issuer_url?: string;
  oidc_scopes?: string;
  jit_enabled?: boolean;
  attribute_mapping?: Record<string, string>;
}

export interface UpdateEnterpriseConnectionPayload {
  domain_id?: string;
  idp_entity_id?: string;
  idp_sso_url?: string;
  idp_certificate?: string;
  oidc_client_id?: string;
  oidc_client_secret?: string;
  oidc_issuer_url?: string;
  oidc_scopes?: string;
  jit_enabled?: boolean;
  attribute_mapping?: Record<string, string>;
}

export interface SCIMTokenInfo {
  exists: boolean;
  scim_base_url: string;
  token?: {
    token?: string;
    token_prefix: string;
    enabled: boolean;
    created_at: string;
    last_used_at?: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  image_url: string;
  description: string;
  member_count: number;
  public_metadata: Record<string, unknown>;
  private_metadata: Record<string, unknown>;
  enforce_2fa: boolean;
  enable_ip_restriction: boolean;
  whitelisted_ips: string[];
  created_at: string;
  updated_at: string;
  segments: Segment[];
}

export interface WorkspaceWithOrganization extends Workspace {
  organization: Organization;
  eligibility_restriction?: EligibilityRestriction;
}

export interface WorkspaceRole {
  id: string;
  name: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMembership {
  id: string;
  workspace: Workspace;
  organization_id: string;
  user_id: string;
  roles: WorkspaceRole[];
  organization: Organization;
  public_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  eligibility_restriction?: EligibilityRestriction;
}

export interface OrganizationUpdate {
  image?: File;
  name?: string;
  description?: string;
  whitelisted_ips?: string[];
  auto_assigned_workspace_id?: string;
  enable_ip_restriction?: boolean;
  enforce_mfa?: boolean;
}

export interface RoleCreate {
  name: string;
  permissions?: string[];
}

export type RoleUpdate = Partial<RoleCreate>;

export interface NewOrgnization {
  name: string;
  description?: string;
  image?: File;
}

export interface NewDomain {
  fqdn: string;
}

export interface OrganizationInvitationPayload {
  email: string;
  organizationRole: OrganizationRole;
  workspace?: Workspace;
  workspaceRole?: WorkspaceRole;
}
