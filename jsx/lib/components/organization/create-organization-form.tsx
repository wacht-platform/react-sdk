import { DefaultStylesProvider } from "../utility";
import { CreateFlow } from "./create-flow";

interface CreateOrganizationFormProps {
    onSuccess?: (organization?: any) => void;
    onCancel?: () => void;
}

export const CreateOrganizationForm: React.FC<CreateOrganizationFormProps> = ({
    onSuccess,
    onCancel,
}) => (
    <DefaultStylesProvider>
        <div className="w-flex w-justify-center w-full">
            <CreateFlow mode="org" onSuccess={onSuccess} onCancel={onCancel} />
        </div>
    </DefaultStylesProvider>
);

export default CreateOrganizationForm;
