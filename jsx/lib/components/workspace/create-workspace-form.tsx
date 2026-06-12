import { DefaultStylesProvider } from "../utility";
import { CreateFlow } from "../organization/create-flow";

interface CreateWorkspaceFormProps {
    organizationId?: string;
    onSuccess?: (workspace?: any) => void;
    onCancel?: () => void;
    onCreateOrganization?: () => void;
}

export const CreateWorkspaceForm: React.FC<CreateWorkspaceFormProps> = ({
    organizationId,
    onSuccess,
    onCancel,
    onCreateOrganization,
}) => (
    <DefaultStylesProvider>
        <div className="w-flex w-justify-center w-full">
            <CreateFlow
                mode="ws"
                organizationId={organizationId}
                onSuccess={onSuccess}
                onCancel={onCancel}
                onCreateOrganization={onCreateOrganization}
            />
        </div>
    </DefaultStylesProvider>
);

export default CreateWorkspaceForm;
