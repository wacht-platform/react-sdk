import { PublicUserData } from "./user";

export interface Organization {
  id: string;
  name: string;
  image_url: string;
  description: string;
  member_count: number;
  public_metadata: Record<string, unknown>;
  private_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationRole {
  id: string;
  name: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembershipWithOrganization {
  id: string;
  organization: Organization;
  user_id: string;
  role: OrganizationRole[];
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembership {
  id: string;
  organization: Organization;
  user: PublicUserData;
  roles: OrganizationRole[];
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

export interface Workspace {
  id: string;
  name: string;
  image_url: string;
  description: string;
  member_count: number;
  public_metadata: Record<string, unknown>;
  private_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceWithOrganization extends Workspace {
  organization: Organization;
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
  role: WorkspaceRole[];
  organization: Organization;
  created_at: string;
  updated_at: string;
}

export interface OrganizationUpdate {
  image?: File;
  name?: string;
}
