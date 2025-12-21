import type { SocialConnectionProvider } from "./auth";
import type { SecondFactorPolicy } from "./deployment";
import type { Segment } from "./segment";

export type VerificationStrategy =
  | "otp"
  | "oath_google"
  | "oath_github"
  | "oauth_microsoft"
  | "oauth_facebook"
  | "oauth_linkedin"
  | "oauth_discord"
  | "oauth_apple";

export interface SocialConnection {
  id: number;
  provider: SocialConnectionProvider;
  email_address: string;
  first_name: string;
  last_name: string;
}

export interface UserEmailAddress {
  id: string;
  email: string;
  is_primary: boolean;
  verified: boolean;
  verified_at: string;
  verification_strategy: VerificationStrategy;
}

export interface UserPhoneNumber {
  id: string;
  phone_number: string;
  country_code: string;
  verified: boolean;
  verified_at: string;
}

export interface UserAuthenticator {
  id: string;
  created_at: string;
  totp_secret?: string;
  otp_url?: string;
}

export interface CurrentUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  availability: "available" | "busy" | "away";
  has_profile_picture: string;
  profile_picture_url: string;
  primary_email_address_id: string;
  primary_phone_number_id: string;
  primary_email_address: UserEmailAddress;
  primary_phone_number?: UserPhoneNumber;
  second_factor_policy: SecondFactorPolicy;
  user_email_addresses: UserEmailAddress[];
  user_phone_numbers: UserPhoneNumber[];
  email_addresses?: UserEmailAddress[];
  phone_numbers?: UserPhoneNumber[];
  social_connections: SocialConnection[];
  user_authenticator?: UserAuthenticator;
  authenticators?: UserAuthenticator[];
  backup_codes_generated?: boolean;
  backup_codes?: string[];
  has_password: boolean;
  has_passkeys: boolean;
  public_metadata: Record<string, unknown>;
  segments: Segment[];
}

export interface PublicUserData {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  availability: "available" | "busy" | "away";
  has_profile_picture: string;
  profile_picture_url: string;
  primary_phone_number: UserPhoneNumber;
  primary_email_address: UserEmailAddress;
}

export interface UserPasskey {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  device_type: string;
  backed_up: boolean;
}
