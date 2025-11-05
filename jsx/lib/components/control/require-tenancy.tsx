"use client";

import { useEffect, useState } from "react";
import { useSession, useDeployment } from "@/hooks";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useActiveWorkspace } from "@/hooks/use-workspace";
import CreateOrganizationDialog from "../organization/create-organization-dialog";
import CreateWorkspaceDialog from "../workspace/create-workspace-dialog";

interface RequireTenancyProps {
  children: React.ReactNode;
}

/**
 * RequireTenancy Component
 *
 * This component ensures users have the required tenancy (organization/workspace) before accessing content.
 *
 * Behavior:
 * - When workspaces are ENABLED: Prioritizes workspace creation (requires both org + workspace)
 * - When workspaces are DISABLED: Only requires organization creation
 * - If organizations are disabled, renders children immediately
 */
export const RequireTenancy = ({ children }: RequireTenancyProps) => {
  const { session, loading: sessionLoading } = useSession();
  const { deployment, loading: deploymentLoading } = useDeployment();
  const { activeOrganization, loading: orgLoading } = useActiveOrganization();
  const { activeWorkspace, loading: workspaceLoading } = useActiveWorkspace();

  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);

  const loading = sessionLoading || deploymentLoading || orgLoading || workspaceLoading;

  const organizationsEnabled = deployment?.b2b_settings?.organizations_enabled;
  const workspacesEnabled = deployment?.b2b_settings?.workspaces_enabled;

  useEffect(() => {
    if (loading || !deployment) return;

    // If organizations are not enabled, no tenancy is required
    if (!organizationsEnabled) {
      return;
    }

    // Check if user is signed in
    if (!session?.active_signin) {
      return;
    }

    // Check organization requirement
    const hasOrganization = !!activeOrganization;

    if (!hasOrganization) {
      // User needs to create an organization
      setShowCreateOrg(true);
      setShowCreateWorkspace(false);
      return;
    }

    // If workspaces are enabled, check workspace requirement
    if (workspacesEnabled) {
      const hasWorkspace = !!activeWorkspace;

      if (!hasWorkspace) {
        // User has org but needs workspace
        setShowCreateOrg(false);
        setShowCreateWorkspace(true);
        return;
      }
    }

    // All requirements met
    setShowCreateOrg(false);
    setShowCreateWorkspace(false);
  }, [
    loading,
    deployment,
    organizationsEnabled,
    workspacesEnabled,
    session,
    activeOrganization,
    activeWorkspace,
  ]);

  const handleOrganizationCreated = () => {
    setShowCreateOrg(false);

    // After org creation, check if we need workspace
    if (workspacesEnabled) {
      // Wait a bit for the organization to be set as active
      setTimeout(() => {
        if (activeOrganization) {
          setShowCreateWorkspace(true);
        }
      }, 500);
    }
  };

  const handleWorkspaceCreated = () => {
    setShowCreateWorkspace(false);
  };

  // Show loading state
  if (loading) {
    return null;
  }

  // If organizations not enabled, render children
  if (!organizationsEnabled) {
    return <>{children}</>;
  }

  // If not signed in, render children (let SignedIn component handle auth)
  if (!session?.active_signin) {
    return <>{children}</>;
  }

  // Render children if all requirements are met
  const hasOrganization = !!activeOrganization;
  const hasWorkspace = workspacesEnabled ? !!activeWorkspace : true;

  if (hasOrganization && hasWorkspace) {
    return <>{children}</>;
  }

  // Render dialogs
  return (
    <>
      {showCreateOrg && (
        <CreateOrganizationDialog
          isOpen={showCreateOrg}
          onClose={() => {
            // Don't allow closing if organization is required
          }}
          onCreated={handleOrganizationCreated}
        />
      )}

      {showCreateWorkspace && activeOrganization && (
        <CreateWorkspaceDialog
          isOpen={showCreateWorkspace}
          onClose={() => {
            // Don't allow closing if workspace is required
          }}
          onCreated={handleWorkspaceCreated}
          organizationId={activeOrganization.id}
        />
      )}

      {/* Don't render children until requirements are met */}
      {null}
    </>
  );
};
