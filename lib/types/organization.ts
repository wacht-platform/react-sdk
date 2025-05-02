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

export interface OrganizationMembership {
  id: string;
  organization: Organization;
  user_id: string;
  role: OrganizationRole[];
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
