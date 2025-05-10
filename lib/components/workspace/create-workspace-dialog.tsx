import React from "react";
import { DefaultStylesProvider } from "../utility/root";
import { CreateWorkspaceForm } from "./create-workspace-form";
import { Dialog } from "../utility/dialog";

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  organizationId: string;
  organizationName?: string;
}

export const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({
  isOpen,
  onClose,
  onCreated,
  organizationId,
  organizationName,
}) => {
  const handleSuccess = () => {
    onCreated?.();
    onClose();
  };

  return (
    <DefaultStylesProvider>
      <Dialog isOpen={isOpen} onClose={onClose}>
        <Dialog.Overlay>
          <Dialog.Content>
            <Dialog.Header>
              Create workspace {organizationName && `in ${organizationName}`}
            </Dialog.Header>
            <Dialog.Body>
              <CreateWorkspaceForm
                organizationId={organizationId}
                onSuccess={handleSuccess}
                onCancel={onClose}
              />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    </DefaultStylesProvider>
  );
};

export default CreateWorkspaceDialog;
