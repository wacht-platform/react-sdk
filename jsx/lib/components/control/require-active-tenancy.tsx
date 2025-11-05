"use client";

import { useEffect, useState } from "react";
import {
  useActiveOrganization,
  useOrganizationList,
  useSession,
  useDeployment,
  useOrganizationMemberships,
} from "@/hooks";
import { useActiveWorkspace, useWorkspaceList } from "@/hooks/use-workspace";
import { CreateOrganizationForm } from "../organization/create-organization-form";
import { CreateWorkspaceForm } from "../workspace/create-workspace-form";
import { OrganizationSelectorMenu } from "../organization/organization-selector-menu";
import { Dialog } from "../utility/dialog";
import { DefaultStylesProvider } from "../utility/root";

interface RequireActiveTenancyProps {
  children: React.ReactNode;
}

type DialogMode = "select" | "createOrg" | "createWorkspace" | null;

export const RequireActiveTenancy = ({
  children,
}: RequireActiveTenancyProps) => {
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedOrgForWorkspace, setSelectedOrgForWorkspace] = useState<
    string | null
  >(null);

  const { loading: sessionLoading } = useSession();
  const { organizations, loading: organizationsLoading } =
    useOrganizationList();
  const { activeOrganization } = useActiveOrganization();
  const { activeWorkspace, loading: workspaceLoading } = useActiveWorkspace();
  const { workspaces, loading: workspaceListLoading } = useWorkspaceList();
  const { deployment } = useDeployment();
  const { refetch: refetchOrganizations, organizationMemberships } =
    useOrganizationMemberships();

  const workspacesEnabled = deployment?.b2b_settings.workspaces_enabled;

  useEffect(() => {
    if (sessionLoading || organizationsLoading) return;
    if (workspacesEnabled && workspaceLoading) return;

    if (organizations?.length === 0) {
      setDialogMode("createOrg");
      return;
    }

    if (!activeOrganization && organizations && organizations.length > 0) {
      setDialogMode("select");
      return;
    }

    if (workspacesEnabled && activeOrganization && !activeWorkspace) {
      const orgWorkspaces = workspaces?.filter(
        (w) => w.organization.id === activeOrganization.id,
      );

      if (!orgWorkspaces || orgWorkspaces.length === 0) {
        setDialogMode("createWorkspace");
      } else {
        setDialogMode("select");
      }
      return;
    }

    setDialogMode(null);
  }, [
    sessionLoading,
    organizationsLoading,
    workspaceLoading,
    organizations,
    activeOrganization,
    activeWorkspace,
    workspaces,
    workspacesEnabled,
  ]);

  if (organizationsLoading || sessionLoading) {
    return null;
  }

  if (workspacesEnabled && (workspaceLoading || workspaceListLoading)) {
    return null;
  }

  if (!dialogMode) {
    return <>{children}</>;
  }

  const handleOrganizationCreated = async () => {
    await refetchOrganizations();
    setTimeout(() => {
      if (organizationMemberships && organizationMemberships.length > 0) {
        const newestOrg =
          organizationMemberships[organizationMemberships.length - 1];
        setSelectedOrgForWorkspace(newestOrg.organization.id);
      }
      setDialogMode("createWorkspace");
    }, 500);
  };

  return (
    <DefaultStylesProvider>
      <Dialog isOpen={true}>
        <Dialog.Overlay>
          <Dialog.Content
            style={{
              width: dialogMode === "select" ? "400px" : "900px",
              maxWidth: "90vw",
              padding: 0,
            }}
          >
            {dialogMode === "select" ? (
              <OrganizationSelectorMenu
                onSelect={() => {
                  setDialogMode(null);
                }}
                onCreateOrganization={() => {
                  setDialogMode("createOrg");
                }}
                onCreateWorkspace={(orgId) => {
                  setSelectedOrgForWorkspace(orgId);
                  setDialogMode("createWorkspace");
                }}
              />
            ) : (
              <Dialog.Body style={{ padding: 0 }}>
                {dialogMode === "createOrg" && (
                  <CreateOrganizationForm
                    onSuccess={handleOrganizationCreated}
                    onCancel={() => setDialogMode("select")}
                  />
                )}

                {dialogMode === "createWorkspace" &&
                  (selectedOrgForWorkspace || activeOrganization) && (
                    <CreateWorkspaceForm
                      organizationId={
                        selectedOrgForWorkspace || activeOrganization!.id
                      }
                      onSuccess={() => {
                        setSelectedOrgForWorkspace(null);
                        setDialogMode(null);
                      }}
                      onCancel={() => {
                        setSelectedOrgForWorkspace(null);
                        setDialogMode("select");
                      }}
                      onCreateOrganization={() => {
                        setDialogMode("createOrg");
                      }}
                    />
                  )}
              </Dialog.Body>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </DefaultStylesProvider>
  );
};
