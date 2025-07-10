import React from "react";
import { DefaultStylesProvider } from "../utility/root";
import CreateOrganizationForm from "./create-organization-form";
import { Dialog } from "../utility/dialog";

interface CreateOrganizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateOrganizationDialog: React.FC<
  CreateOrganizationDialogProps
> = ({ isOpen, onClose, onCreated }) => {
  const handleSuccess = () => {
    onCreated?.();
    onClose();
  };

  return (
    <DefaultStylesProvider>
      <Dialog isOpen={isOpen} onClose={onClose}>
        <Dialog.Overlay>
          <Dialog.Content style={{ width: "800px", maxWidth: "90vw" }}>
            <Dialog.Body style={{ padding: 0 }}>
              <CreateOrganizationForm
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

export default CreateOrganizationDialog;
