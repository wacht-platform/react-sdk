import type { OrganizationRole, WorkspaceRole } from "@wacht/types";

// Type for any object with roles - works with both Membership and MembershipWithOrganization
type WithOrgRoles = { roles?: OrganizationRole[] } | null | undefined;
type WithWsRoles = { roles?: WorkspaceRole[] } | null | undefined;

// Organization permission constants
export const ORG_ADMIN_PERMISSIONS = ["organization:admin"];
export const ORG_MANAGEMENT_PERMISSIONS = [
    "organization:admin",
    "organization:manage",
];

// Workspace permission constants
export const WORKSPACE_ADMIN_PERMISSIONS = ["workspace:admin"];
export const WORKSPACE_MANAGEMENT_PERMISSIONS = [
    "workspace:admin",
    "workspace:manage",
];

/**
 * Check if an organization membership has any of the specified permissions
 */
export function hasOrgPermission(
    membership: WithOrgRoles,
    requiredPermissions: string[],
): boolean {
    if (!membership?.roles) return false;

    return membership.roles.some((role) =>
        role.permissions?.some((permission) =>
            requiredPermissions.includes(permission),
        ),
    );
}

/**
 * Check if user can manage the organization (admin or manage permissions)
 */
export function canManageOrganization(membership: WithOrgRoles): boolean {
    return hasOrgPermission(membership, ORG_MANAGEMENT_PERMISSIONS);
}

/**
 * Check if user is an organization admin (only admin permission)
 */
export function isOrgAdmin(membership: WithOrgRoles): boolean {
    return hasOrgPermission(membership, ORG_ADMIN_PERMISSIONS);
}

/**
 * Check if a workspace membership has any of the specified permissions
 */
export function hasWorkspacePermission(
    membership: WithWsRoles,
    requiredPermissions: string[],
): boolean {
    if (!membership?.roles) return false;

    return membership.roles.some((role) =>
        role.permissions?.some((permission) =>
            requiredPermissions.includes(permission),
        ),
    );
}

/**
 * Check if user can manage the workspace (admin or manage permissions)
 */
export function canManageWorkspace(membership: WithWsRoles): boolean {
    return hasWorkspacePermission(membership, WORKSPACE_MANAGEMENT_PERMISSIONS);
}

/**
 * Check if user is a workspace admin (only admin permission)
 */
export function isWorkspaceAdmin(membership: WithWsRoles): boolean {
    return hasWorkspacePermission(membership, WORKSPACE_ADMIN_PERMISSIONS);
}
