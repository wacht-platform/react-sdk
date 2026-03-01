"use client";

import styled from "styled-components";
import {
  useActiveOrganization,
  useSession,
  useDeployment,
  useOrganizationMemberships,
} from "@/hooks";
import { useActiveWorkspace, useWorkspaceList } from "@/hooks/use-workspace";
import { OrganizationSelectorMenu } from "../organization/organization-selector-menu";
import { Dialog } from "../utility/dialog";
import { DefaultStylesProvider } from "../utility/root";

interface RequireActiveTenancyProps {
  children: React.ReactNode;
}

const StyledDialogContent = styled(Dialog.Content)`
  padding: 0;
  width: 90vw;
  max-width: 1000px;

  @media (max-width: 768px) {
    max-width: 95vw;
    width: 95vw;
  }
`;

export const RequireActiveTenancy = ({
  children,
}: RequireActiveTenancyProps) => {
  const { loading: sessionLoading, session } = useSession();
  const { activeOrganization } = useActiveOrganization();
  const { activeWorkspace, loading: workspaceLoading } = useActiveWorkspace();
  const { workspaces } = useWorkspaceList();
  const { deployment } = useDeployment();
  const { organizationMemberships } = useOrganizationMemberships();

  const workspacesEnabled =
    deployment?.b2b_settings.workspaces_enabled ?? false;

  // Check if user has restrictions on current memberships
  const activeOrgMembership = organizationMemberships?.find(
    (m) => m.organization.id === activeOrganization?.id,
  );
  const activeWorkspaceMembership = workspaces?.find(
    (w) => w.id === session?.active_signin?.active_workspace_membership_id,
  );

  const hasOrgRestriction =
    activeOrgMembership?.eligibility_restriction?.type !== "none" &&
    activeOrgMembership?.eligibility_restriction?.type !== undefined;

  const hasWorkspaceRestriction =
    activeWorkspaceMembership?.eligibility_restriction?.type !== "none" &&
    activeWorkspaceMembership?.eligibility_restriction?.type !== undefined;

  // Wait for initial data to load
  if (sessionLoading || (workspacesEnabled && workspaceLoading)) {
    return null;
  }

  // Check if user has valid active tenancy
  const hasValidTenancy = () => {
    // If user has restrictions, they need to switch
    if (hasOrgRestriction || hasWorkspaceRestriction) {
      return false;
    }

    // Must have an active organization
    if (!activeOrganization) {
      return false;
    }

    // If workspaces are disabled, org is enough
    if (!workspacesEnabled) {
      return true;
    }

    // If workspaces enabled, must have active workspace
    if (!activeWorkspace) {
      return false;
    }

    // Workspace must belong to the active org
    const workspaceBelongsToOrg = workspaces?.some(
      (w) =>
        w.id === activeWorkspace.id &&
        w.organization.id === activeOrganization.id,
    );

    return workspaceBelongsToOrg;
  };

  // If valid tenancy, render the app
  if (hasValidTenancy()) {
    return <>{children}</>;
  }

  // Otherwise, show the organization selector menu
  // It handles all the org/workspace creation and selection logic
  return (
    <DefaultStylesProvider>
      <Dialog isOpen={true}>
        <Dialog.Overlay>
          <StyledDialogContent>
            <OrganizationSelectorMenu />
          </StyledDialogContent>
        </Dialog.Overlay>
      </Dialog>
    </DefaultStylesProvider>
  );
};
