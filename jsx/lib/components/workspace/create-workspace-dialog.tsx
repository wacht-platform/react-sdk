import React, { useState } from "react";
import { DefaultStylesProvider } from "../utility/root";
import { CreateWorkspaceForm } from "./create-workspace-form";
import { Dialog } from "../utility/dialog";
import { CreateOrganizationForm } from "../organization/create-organization-form";

interface CreateWorkspaceDialogProps {
    isOpen: boolean;
    onClose?: () => void;
    onCreated?: () => void;
    organizationId?: string;
}

export const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({
    isOpen,
    onClose,
    onCreated,
    organizationId,
}) => {
    const [showCreateOrg, setShowCreateOrg] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState(organizationId);

    const handleSuccess = () => {
        onCreated?.();
        onClose?.();
    };

    const handleCreateOrganization = () => {
        setShowCreateOrg(true);
    };

    // CreateFlow passes the created org object to onSuccess; select it directly
    // instead of re-reading a stale memberships closure.
    const handleOrganizationCreated = (created?: any) => {
        const newOrgId =
            created?.data?.organization?.id ??
            created?.organization?.id ??
            created?.id;
        if (newOrgId) setSelectedOrgId(newOrgId);
        setShowCreateOrg(false);
    };

    return (
        <DefaultStylesProvider>
            <Dialog isOpen={isOpen} onClose={onClose}>
                <Dialog.Overlay>
                    <Dialog.Content className="w-dialog--create">
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
                    </Dialog.Content>
                </Dialog.Overlay>
            </Dialog>
        </DefaultStylesProvider>
    );
};
