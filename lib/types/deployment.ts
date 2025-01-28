interface OrgSettings {
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

interface AuthFactorsEnabled {
  email_password: boolean;
  username_password: boolean;
  email_otp: boolean;
  phone_otp: boolean;
  web3_wallet: boolean;
  backup_code: boolean;
  authenticator: boolean;
}

interface VerificationPolicy {
  phone_number: boolean;
  email: boolean;
}

interface AuthField {
  enabled: boolean;
  required: boolean;
}

interface AuthSettings {
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
  second_factor_policy: string;
  first_factor: string;
  second_factor: string;
  alternate_first_factors: null;
  alternate_second_factors: null;
  deployment_id: number;
}

interface DeploymentSocialConnection {
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

interface Deployment {
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
  project_id: number;
  mode: "production" | "staging";
}
