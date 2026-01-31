import type { FC, ReactNode } from "react";
import { Dialog } from "../utility/dialog";
import { ManageOrganization } from "./manage-organization";

interface ManageOrganizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  showHeader?: boolean;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  customContent?: ReactNode;
  children?: ReactNode;
  showCloseButton?: boolean;
}

export const ManageOrganizationDialog: FC<ManageOrganizationDialogProps> = ({
  isOpen,
  onClose,
  title,
  showHeader,
  headerContent,
  footerContent,
  customContent,
  children,
  showCloseButton,
}) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <Dialog.Overlay>
        <Dialog.Content style={{ width: "900px", maxWidth: "90vw" }}>
          {showHeader && (
            <Dialog.Header showCloseButton={showCloseButton}>
              {headerContent || title}
            </Dialog.Header>
          )}
          {customContent || children || <ManageOrganization />}
          {footerContent && <Dialog.Footer>{footerContent}</Dialog.Footer>}
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog>
  );
};
