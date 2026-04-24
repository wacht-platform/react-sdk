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
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "var(--size-20u) 0",
                }}
            >
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
        <>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-12u)",
                }}
            >
                {/* Profile Details */}
                <div>
                    <div style={{ marginBottom: "var(--space-6u)" }}>
                        <h3
                            style={{
                                fontSize: "var(--font-size-lg)",
                                color: "var(--color-foreground)",
                                margin: "0 0 var(--space-1u) 0",
                            }}
                        >
                            Profile Details
                        </h3>
                        <p
                            style={{
                                fontSize: "var(--font-size-md)",
                                color: "var(--color-secondary-text)",
                                margin: 0,
                            }}
                        >
                            Basic information about your profile
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "var(--space-8u)",
                        }}
                    >
                        {/* First Name and Last Name in same row */}
                        <FormRow>
                            <FormGroup style={{ flex: 1 }}>
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

                            <FormGroup style={{ flex: 1 }}>
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
                <div
                    style={{
                        position: "relative",
                        height: "var(--border-width-thin)",
                        background: "var(--color-divider)",
                        margin: "0",
                    }}
                />

                {/* Danger Zone */}
                <div>
                    <div style={{ marginBottom: "var(--space-8u)" }}>
                        <h3
                            style={{
                                fontSize: "var(--font-size-xl)",
                                color: "var(--color-foreground)",
                                margin: "0 0 var(--space-2u) 0",
                            }}
                        >
                            Danger Zone
                        </h3>
                        <p
                            style={{
                                fontSize: "var(--font-size-lg)",
                                color: "var(--color-muted)",
                                margin: 0,
                            }}
                        >
                            Irreversible and destructive actions
                        </p>
                    </div>

                    <div
                        style={{
                            padding: "var(--space-10u)",
                            border: "var(--border-width-thin) solid var(--color-error)",
                            borderRadius: "var(--radius-md)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: showDeleteConfirm
                                    ? "var(--space-10u)"
                                    : "0",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: "var(--font-size-lg)",
                                        color: "var(--color-foreground)",
                                        marginBottom: "var(--space-2u)",
                                        fontWeight: "500",
                                    }}
                                >
                                    Delete Account
                                </div>
                                <div
                                    style={{
                                        fontSize: "var(--font-size-md)",
                                        color: "var(--color-muted)",
                                    }}
                                >
                                    Once you delete your account, there is no
                                    going back. Please be certain.
                                </div>
                            </div>
                            <Button
                                onClick={() => {
                                    if (!showDeleteConfirm) {
                                        setShowDeleteConfirm(true);
                                    } else {
                                        setShowDeleteConfirm(false);
                                        setConfirmName("");
                                    }
                                }}
                                style={{
                                    background: "var(--color-error)",
                                    color: "var(--color-foreground-inverse)",
                                    border: "none",
                                    padding: "var(--space-3u) var(--space-6u)",
                                    fontSize: "var(--font-size-md)",
                                    height: "calc(var(--size-8u) * 2)",
                                    width: "auto",
                                }}
                            >
                                {showDeleteConfirm ? "Cancel" : "Delete"}
                            </Button>
                        </div>

                        {showDeleteConfirm && (
                            <div
                                style={{
                                    width: "100%",
                                    marginTop: "var(--space-8u)",
                                }}
                            >
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
                                        style={{ width: "100%" }}
                                    />
                                </FormGroup>

                                <Button
                                    onClick={handleDeleteAccount}
                                    disabled={
                                        confirmName !== "delete this account" ||
                                        isDeleting
                                    }
                                    style={{
                                        background:
                                            confirmName ===
                                            "delete this account"
                                                ? "var(--color-error)"
                                                : "transparent",
                                        color:
                                            confirmName ===
                                            "delete this account"
                                                ? "var(--color-foreground-inverse)"
                                                : "var(--color-muted)",
                                        border: "var(--border-width-thin) solid var(--color-border)",
                                        padding:
                                            "var(--space-4u) var(--space-8u)",
                                        fontSize: "var(--font-size-lg)",
                                        height: "var(--size-18u)",
                                        cursor:
                                            confirmName ===
                                            "delete this account"
                                                ? "pointer"
                                                : "not-allowed",
                                        opacity:
                                            confirmName ===
                                            "delete this account"
                                                ? 1
                                                : 0.6,
                                        marginTop: "var(--space-6u)",
                                        width: "100%",
                                    }}
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
        </>
    );
};
