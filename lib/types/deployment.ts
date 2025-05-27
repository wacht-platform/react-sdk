export interface B2BSettings {
	id: number;
	created_at: string;
	updated_at: string;
	deleted_at: null;
	deployment_id: number;
	organizations_enabled: boolean;
	workspaces_enabled: boolean;
	ip_allowlist_per_org_enabled: boolean;
	allow_users_to_create_orgs: boolean;
	max_orgs_per_user: number;
	max_allowed_org_members: number;
	max_allowed_workspace_members: number;
	allow_org_deletion: boolean;
	allow_workspace_deletion: boolean;
	custom_org_role_enabled: boolean;
	limit_org_creation_per_user: boolean;
	limit_workspace_creation_per_org: boolean;
	org_creation_per_user_count: number;
	workspaces_per_org_count: number;
	custom_workspace_role_enabled: boolean;
	default_workspace_creator_role_id: number;
	default_workspace_member_role_id: number;
	default_org_creator_role_id: number;
	default_org_member_role_id: number;
	workspace_permissions: string[];
	organization_permissions: string[];
}

export interface AuthFactorsEnabled {
	email_password: boolean;
	username_password: boolean;
	email_magic_link: boolean;
	email_otp: boolean;
	phone_otp: boolean;
	web3_wallet: boolean;
	backup_code: boolean;
	authenticator: boolean;
}

export interface VerificationPolicy {
	phone_number: boolean;
	email: boolean;
}

export interface AuthField {
	enabled: boolean;
	required: boolean;
}

export type SecondFactor =
	| "none"
	| "phone_otp"
	| "backup_code"
	| "authenticator";
export type FirstFactor =
	| "email_password"
	| "username_password"
	| "email_otp"
	| "email_magic_link"
	| "phone_otp";

export type SecondFactorPolicy = "none" | "optional" | "enforced";

export interface AuthSettings {
	id: number;
	created_at: string;
	updated_at: string;
	deleted_at: null;
	email_address: AuthField;
	phone_number: AuthField;
	username: AuthField;
	first_name: AuthField;
	last_name: AuthField;
	password: AuthField;
	backup_code: AuthField;
	web3_wallet: AuthField;
	password_policy: AuthField;
	auth_factors_enabled: AuthFactorsEnabled;
	verification_policy: VerificationPolicy;
	second_factor_policy: SecondFactorPolicy;
	first_factor: FirstFactor;
	second_factor: SecondFactor | null;
	alternate_first_factors: FirstFactor[] | null;
	alternate_second_factors: SecondFactor[] | null;
	deployment_id: number;
}

export interface DeploymentSocialConnection {
	id: number;
	created_at: string;
	updated_at: string;
	deleted_at: null;
	deployment_id: number;
	provider: string;
	enabled: boolean;
	user_defined_scopes: null;
	custom_credentials_set: boolean;
}

export interface CountryRestriction {
	enabled: boolean;
	country_codes: string[];
}

export type SignUpMode = "public" | "restricted" | "waitlist";

export interface DeploymentRestrictions {
	id: number;
	created_at: string;
	updated_at: string;
	deleted_at: null;
	deployment_id: number;
	allowlist_enabled: boolean;
	blocklist_enabled: boolean;
	block_subaddresses: boolean;
	block_disposable_emails: boolean;
	block_voip_numbers: boolean;
	country_restrictions: CountryRestriction;
	banned_keywords: string[];
	allowlisted_resources: string[];
	blocklisted_resources: string[];
	sign_up_mode: SignUpMode;
}

export interface LightModeSettings {
	primary_color: string;
	background_color: string;
	text_color: string;
}

export interface DarkModeSettings {
	primary_color: string;
	background_color: string;
	text_color: string;
}

export interface DeploymentUISettings {
	deployment_id: number;
	app_name: string;
	privacy_policy_url: string;
	tos_page_url: string;
	sign_in_page_url: string;
	sign_up_page_url: string;
	waitlist_page_url: string;
	after_logo_click_url: string;
	user_profile_url: string;
	organization_profile_url: string;
	create_organization_url: string;
	after_sign_out_one_page_url: string;
	after_sign_out_all_page_url: string;
	after_signup_redirect_url: string;
	after_signin_redirect_url: string;
	after_create_organization_redirect_url: string;
	favicon_image_url: string;
	default_user_profile_image_url: string;
	default_organization_profile_image_url: string;
	default_workspace_profile_image_url: string;
	use_initials_for_user_profile_image: boolean;
	use_initials_for_organization_profile_image: boolean;
	logo_image_url: string;
	signup_terms_statement: string;
	signup_terms_statement_shown: boolean;
	light_mode_settings: LightModeSettings;
	dark_mode_settings: DarkModeSettings;
}

export interface Deployment {
	id: number;
	created_at: string;
	updated_at: string;
	deleted_at: null;
	maintenance_mode: boolean;
	host: string;
	publishable_key: string;
	b2b_settings: B2BSettings;
	auth_settings: AuthSettings;
	restrictions: DeploymentRestrictions;
	social_connections: DeploymentSocialConnection[];
	ui_settings: DeploymentUISettings;
	project_id: number;
	mode: "production" | "staging";
}

export interface DeploymentContextType {
	loading: boolean;
	deployment: Deployment | null;
}
