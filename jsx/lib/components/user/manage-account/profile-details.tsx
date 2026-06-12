import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { useDeployment } from "@/hooks/use-deployment";
import { useSession } from "@/hooks/use-session";
import { useUser } from "@/hooks/use-user";
import { useScreenContext } from "../context";
import { Button, Spinner } from "@/components/utility";
import { FormGroup, Label } from "@/components/utility/form";
import { Input } from "@/components/utility/input";
import { FormRow } from "./shared";

export const ProfileDetailsManagementSection = () => {
    const { deployment } = useDeployment();
    const { refetch: refetchSession } = useSession();
    const { user, updateProfile, deleteAccount } = useUser();
    const { toast } = useScreenContext();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [hasInitialized, setHasInitialized] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmName, setConfirmName] = useState("");

    // Initialize form values only once when user data is available
    useEffect(() => {
        if (user && !hasInitialized) {
            setFirstName(user.first_name || "");
            setLastName(user.last_name || "");
            setUsername(user.username || "");
            setHasInitialized(true);
        }
    }, [user, hasInitialized]);

    const autoSave = useCallback(async () => {
        if (!user) return;

        try {
            const data: any = {};

            if (firstName !== user.first_name) {
                data.first_name = firstName;
            }
            if (lastName !== user.last_name) {
                data.last_name = lastName;
            }
            if (username !== user.username) {
                data.username = username;
            }

            // Only save if there are actual changes
            if (Object.keys(data).length > 0) {
                await updateProfile(data);
            }
        } catch (error: any) {
            toast(error.message || "Failed to save profile changes", "error");
        }
    }, [user, updateProfile, firstName, lastName, username, toast]);

    const handleFirstNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFirstName(e.target.value);
    };

    const handleLastNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setLastName(e.target.value);
    };

    const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    };

    const handleFirstNameBlur = () => {
        autoSave();
    };

    const handleLastNameBlur = () => {
        autoSave();
    };

    const handleUsernameBlur = () => {
        autoSave();
    };

    if (!user) {
        return (
            <div className="w-loading">
                <Spinner />
            </div>
        );
    }

    const handleDeleteAccount = async () => {
        if (!user || confirmName !== "delete this account") return;

        setIsDeleting(true);
        try {
            await deleteAccount("");
            toast("Account deleted successfully", "info");
            await refetchSession();
        } catch (error: any) {
            toast(error.message || "Failed to delete account", "error");
        } finally {
            setIsDeleting(false);
            setConfirmName("");
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="w-flex-col w-gap-6">
            {/* Profile Details */}
            <div className="w-flex-col w-gap-4">
                <p className="w-secsub">Basic information about your profile</p>

                <div className="w-flex-col w-gap-4">
                    {/* First Name and Last Name in same row */}
                    <FormRow>
                        <FormGroup className="w-grow">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={handleFirstNameChange}
                                onBlur={handleFirstNameBlur}
                                placeholder="Enter your first name"
                                required
                            />
                        </FormGroup>

                        <FormGroup className="w-grow">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={handleLastNameChange}
                                onBlur={handleLastNameBlur}
                                placeholder="Enter your last name"
                                required
                            />
                        </FormGroup>
                    </FormRow>

                    {deployment?.auth_settings?.username?.enabled && (
                        <FormGroup>
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={handleUsernameChange}
                                onBlur={handleUsernameBlur}
                                placeholder="Enter your username"
                                required
                            />
                        </FormGroup>
                    )}
                </div>
            </div>

            {/* Divider */}
            <div className="w-hr" />

            {/* Danger Zone */}
            <div className="w-flex-col w-gap-4">
                <div className="w-flex-col w-gap-1">
                    <h3 className="w-sec">Danger Zone</h3>
                    <p className="w-secsub">
                        Irreversible and destructive actions
                    </p>
                </div>

                <div className="w-danger w-flex-col w-items-start">
                    <div className="w-flex w-items-center w-justify-between w-gap-4 w-full">
                        <div className="w-flex-col w-gap-1">
                            <div className="w-sec">Delete Account</div>
                            <div className="w-secsub">
                                Once you delete your account, there is no going
                                back. Please be certain.
                            </div>
                        </div>
                        <Button
                            $destructive
                            $size="sm"
                            onClick={() => {
                                if (!showDeleteConfirm) {
                                    setShowDeleteConfirm(true);
                                } else {
                                    setShowDeleteConfirm(false);
                                    setConfirmName("");
                                }
                            }}
                        >
                            {showDeleteConfirm ? "Cancel" : "Delete"}
                        </Button>
                    </div>

                    {showDeleteConfirm && (
                        <div className="w-full w-flex-col w-gap-3">
                            <FormGroup>
                                <Label htmlFor="confirm_username">
                                    Type "delete this account" to confirm
                                </Label>
                                <Input
                                    id="confirm_username"
                                    type="text"
                                    value={confirmName}
                                    onChange={(e) =>
                                        setConfirmName(e.target.value)
                                    }
                                    placeholder="delete this account"
                                />
                            </FormGroup>

                            <Button
                                $destructive
                                $fullWidth
                                onClick={handleDeleteAccount}
                                disabled={
                                    confirmName !== "delete this account" ||
                                    isDeleting
                                }
                            >
                                {isDeleting ? (
                                    <Spinner size={12} />
                                ) : (
                                    "Delete Forever"
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
