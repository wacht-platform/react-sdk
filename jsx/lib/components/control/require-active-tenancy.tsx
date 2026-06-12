"use client";

import {
    useActiveOrganization,
    useDeployment,
    useActiveTenancy,
} from "@/hooks";
import { useActiveWorkspace } from "@/hooks/use-workspace";
import { OrganizationSelectorMenu } from "../organization/organization-selector-menu";
import { Dialog } from "../utility/dialog";
import { DefaultStylesProvider } from "../utility/root";

interface RequireActiveTenancyProps {
    children: React.ReactNode;
}

export const RequireActiveTenancy = ({
    children,
}: RequireActiveTenancyProps) => {
    const { activeOrganization } = useActiveOrganization();
    const { activeWorkspace } = useActiveWorkspace();
    const { deployment } = useDeployment();
    const {
        loading: activeTenancyLoading,
        orgMembership: activeOrgMembership,
        workspaceMembership: activeWorkspaceMembership,
    } = useActiveTenancy();

    const workspacesEnabled =
        (deployment?.b2b_settings.organizations_enabled ?? false) &&
        (deployment?.b2b_settings.workspaces_enabled ?? false);

    const hasOrgRestriction =
        activeOrgMembership?.eligibility_restriction?.type !== "none" &&
        activeOrgMembership?.eligibility_restriction?.type !== undefined;

    const hasWorkspaceRestriction =
        activeWorkspaceMembership?.eligibility_restriction?.type !== "none" &&
        activeWorkspaceMembership?.eligibility_restriction?.type !== undefined;

    // Wait for initial data to load
    if (activeTenancyLoading) {
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
        return (
            activeWorkspaceMembership?.workspace.id === activeWorkspace.id &&
            activeWorkspaceMembership.organization_id === activeOrganization.id
        );
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
                    <Dialog.Content
                        className="w-flex w-justify-center"
                        style={{ padding: 0, width: 900, maxWidth: "90vw" }}
                    >
                        <OrganizationSelectorMenu />
                    </Dialog.Content>
                </Dialog.Overlay>
            </Dialog>
        </DefaultStylesProvider>
    );
};
