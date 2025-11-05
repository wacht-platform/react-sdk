import React, { useState } from "react";
import { DefaultStylesProvider } from "../utility/root";
import { CreateWorkspaceForm } from "./create-workspace-form";
import { Dialog } from "../utility/dialog";
import { CreateOrganizationForm } from "../organization/create-organization-form";
import { useOrganizationMemberships } from "@/hooks/use-organization";

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCreated?: () => void;
  organizationId: string;
}

export const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({
  isOpen,
  onClose,
  onCreated,
  organizationId,
}) => {
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(organizationId);
  const { refetch: refetchOrganizations, organizationMemberships } =
    useOrganizationMemberships();

  const handleSuccess = () => {
    onCreated?.();
    onClose?.();
  };

  const handleCreateOrganization = () => {
    setShowCreateOrg(true);
  };

  const handleOrganizationCreated = async () => {
    await refetchOrganizations();
    // Select the newly created organization
    setTimeout(() => {
      if (organizationMemberships && organizationMemberships.length > 0) {
        const newestOrg =
          organizationMemberships[organizationMemberships.length - 1];
        setSelectedOrgId(newestOrg.organization.id);
      }
      setShowCreateOrg(false);
    }, 500);
  };

  return (
    <DefaultStylesProvider>
      <Dialog isOpen={isOpen} onClose={onClose}>
        <Dialog.Overlay>
          <Dialog.Content style={{ width: "900px", maxWidth: "90vw" }}>
            <Dialog.Body style={{ padding: 0 }}>
              {!showCreateOrg ? (
                <CreateWorkspaceForm
                  organizationId={selectedOrgId || organizationId}
                  onSuccess={handleSuccess}
                  onCancel={onClose}
                  onCreateOrganization={handleCreateOrganization}
                />
              ) : (
                <CreateOrganizationForm
                  onSuccess={handleOrganizationCreated}
                  onCancel={() => setShowCreateOrg(false)}
                />
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </DefaultStylesProvider>
  );
};
