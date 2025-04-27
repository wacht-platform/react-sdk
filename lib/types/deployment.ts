export interface OrgSettings {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  deployment_id: number;
  enabled: boolean;
  ip_allowlist_enabled: boolean;
  max_allowed_members: number;
  allow_deletion: boolean;
  custom_role_enabled: boolean;
  default_role: string;
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

export type SecondFactor = "none" | "phone_otp" | "backup_code" | "authenticator";
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

export interface DeploymentUISettings {
  sign_in_page_url: string;
  sign_up_page_url: string;
}

export interface Deployment {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  maintenance_mode: boolean;
  host: string;
  publishable_key: string;
  org_settings: OrgSettings;
  auth_settings: AuthSettings;
  social_connections: DeploymentSocialConnection[];
  ui_settings: DeploymentUISettings;
  project_id: number;
  mode: "production" | "staging";
}
