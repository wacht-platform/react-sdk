import { useState, useRef, useEffect, useCallback, ChangeEvent } from "react";
import { User, Download, AlertTriangle } from "lucide-react";
import { useDeployment } from "@/hooks/use-deployment";
import { useSession } from "@/hooks/use-session";
import { useUser } from "@/hooks/use-user";
import { useScreenContext } from "../context";
import { Button, Spinner } from "@/components/utility";
import { FormGroup, Label } from "@/components/utility/form";
import { Input } from "@/components/utility/input";
import {
    ProfileSectionLayout,
    ProfileImageContainer,
    FormRow,
} from "./shared";

export const ProfileDetailsManagementSection = () => {
    const { deployment } = useDeployment();
    const { refetch: refetchSession } = useSession();
    const { user, updateProfile, updateProfilePicture, deleteAccount } =
        useUser();
    const { toast } = useScreenContext();

    // State for profile management
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [hasInitialized, setHasInitialized] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmName, setConfirmName] = useState("");

    const [previewUrl, setPreviewUrl] = useState<string | null>(
        user?.profile_picture_url || null,
    );

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize form values only once when user data is available
    useEffect(() => {
        if (user && !hasInitialized) {
            setFirstName(user.first_name || "");
            setLastName(user.last_name || "");
            setUsername(user.username || "");
            setPreviewUrl(user.profile_picture_url || null);
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

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            const file = event.target.files[0];
            setPreviewUrl(URL.createObjectURL(file));
            // Auto-save image immediately
            setTimeout(async () => {
                try {
                    await updateProfilePicture(file);
                    user.refetch();
                    toast("Profile picture updated successfully", "info");
                } catch (error: any) {
                    toast(error.message || "Failed to update profile picture", "error");
                    // Reset preview on error
                    setPreviewUrl(user?.profile_picture_url || null);
                }
            }, 100);
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    if (!user) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "40px 0",
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
                    gap: "var(--space-2xl)",
                }}
            >
                {/* Profile Picture Section - Two Column Layout */}
                <ProfileSectionLayout>
                    {/* Left Column - Profile Picture Preview */}
                    <ProfileImageContainer>
                        <div
                            style={{
                                width: "120px",
                                height: "120px",
                                borderRadius: "50%",
                                border: "2px dashed var(--color-border)",
                                background: previewUrl
                                    ? "transparent"
                                    : "var(--color-input-background)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                transition: "all 0.2s ease",
                                margin: "0 auto", // Center on mobile
                            }}
                            onClick={triggerFileInput}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "var(--color-primary)";
                                e.currentTarget.style.transform = "scale(1.02)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "var(--color-border)";
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        >
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Profile Picture"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: "50%",
                                    }}
                                />
                            ) : (
                                <User size={32} color="var(--color-muted)" />
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: "none" }}
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>
                    </ProfileImageContainer>

                    {/* Right Column - Content and Controls */}
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: "var(--space-lg)" }}>
                            <h3
                                style={{
                                    fontSize: "var(--font-sm)",
                                    color: "var(--color-foreground)",
                                    margin: "0 0 var(--space-2xs) 0",
                                }}
                            >
                                Profile Picture
                            </h3>
                            <p
                                style={{
                                    fontSize: "var(--font-xs)",
                                    color: "var(--color-secondary-text)",
                                    margin: 0,
                                }}
                            >
                                Upload an image to represent your profile
                            </p>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "var(--space-sm)",
                                marginBottom: "var(--space-sm)",
                                flexWrap: "wrap",
                            }}
                        >
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    padding: "var(--space-xs) var(--space-md)",
                                    fontSize: "var(--font-xs)",
                                    height: "32px",
                                    width: "100px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <Download size={14} />
                                {previewUrl ? "Change" : "Upload"}
                            </Button>
                            <Button
                                onClick={async () => {
                                    setPreviewUrl(null);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = "";
                                    }
                                    // Save the removal to backend
                                    try {
                                        await updateProfile({
                                            remove_profile_picture: true,
                                        });
                                        await user.refetch();
                                        toast("Profile picture removed successfully", "info");
                                    } catch (error: any) {
                                        toast(
                                            error.message || "Failed to remove profile picture",
                                            "error",
                                        );
                                        // Reset preview on error
                                        setPreviewUrl(user?.profile_picture_url || null);
                                    }
                                }}
                                style={{
                                    background: "transparent",
                                    color: "var(--color-muted)",
                                    border: "1px solid var(--color-border)",
                                    padding: "var(--space-xs) var(--space-md)",
                                    fontSize: "var(--font-xs)",
                                    height: "32px",
                                    width: "100px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <AlertTriangle size={14} />
                                Remove
                            </Button>
                        </div>
                    </div>
                </ProfileSectionLayout>

                {/* Divider */}
                <div
                    style={{
                        position: "relative",
                        height: "1px",
                        background: "var(--color-divider)",
                        margin: "0",
                    }}
                />

                {/* Profile Details */}
                <div>
                    <div style={{ marginBottom: "var(--space-md)" }}>
                        <h3
                            style={{
                                fontSize: "var(--font-sm)",
                                color: "var(--color-foreground)",
                                margin: "0 0 var(--space-2xs) 0",
                            }}
                        >
                            Profile Details
                        </h3>
                        <p
                            style={{
                                fontSize: "var(--font-xs)",
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
                            gap: "var(--space-lg)",
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
                        height: "1px",
                        background: "var(--color-divider)",
                        margin: "0",
                    }}
                />

                {/* Danger Zone */}
                <div>
                    <div style={{ marginBottom: "16px" }}>
                        <h3
                            style={{
                                fontSize: "16px",
                                color: "var(--color-foreground)",
                                margin: "0 0 4px 0",
                            }}
                        >
                            Danger Zone
                        </h3>
                        <p
                            style={{
                                fontSize: "14px",
                                color: "var(--color-muted)",
                                margin: 0,
                            }}
                        >
                            Irreversible and destructive actions
                        </p>
                    </div>

                    <div
                        style={{
                            padding: "20px",
                            border: "1px solid var(--color-error)",
                            borderRadius: "8px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: showDeleteConfirm ? "20px" : "0",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: "14px",
                                        color: "var(--color-foreground)",
                                        marginBottom: "4px",
                                        fontWeight: "500",
                                    }}
                                >
                                    Delete Account
                                </div>
                                <div
                                    style={{
                                        fontSize: "13px",
                                        color: "var(--color-muted)",
                                    }}
                                >
                                    Once you delete your account, there is no going back. Please
                                    be certain.
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
                                    color: "white",
                                    border: "none",
                                    padding: "6px 12px",
                                    fontSize: "13px",
                                    height: "32px",
                                    width: "auto",
                                }}
                            >
                                {showDeleteConfirm ? "Cancel" : "Delete"}
                            </Button>
                        </div>

                        {showDeleteConfirm && (
                            <div style={{ width: "100%", marginTop: "16px" }}>
                                <FormGroup>
                                    <Label htmlFor="confirm_username">
                                        Type "delete this account" to confirm
                                    </Label>
                                    <Input
                                        id="confirm_username"
                                        type="text"
                                        value={confirmName}
                                        onChange={(e) => setConfirmName(e.target.value)}
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
                                            confirmName === "delete this account"
                                                ? "var(--color-error)"
                                                : "transparent",
                                        color:
                                            confirmName === "delete this account"
                                                ? "white"
                                                : "var(--color-muted)",
                                        border: "1px solid var(--color-border)",
                                        padding: "8px 16px",
                                        fontSize: "14px",
                                        height: "36px",
                                        cursor:
                                            confirmName === "delete this account"
                                                ? "pointer"
                                                : "not-allowed",
                                        opacity: confirmName === "delete this account" ? 1 : 0.6,
                                        marginTop: "12px",
                                        width: "100%",
                                    }}
                                >
                                    {isDeleting ? <Spinner size={12} /> : "Delete Forever"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
