export interface SignUpParams {
  first_name?: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  email?: string;
  password?: string;
  challenge_token?: string;
}

export interface SSOResponse {
  oauth_url: string;
  session: unknown;
}

export interface SignInParams {
  email?: string;
  username?: string;
  password?: string;
  phone?: string;
  strategy?: string;
  token?: string;
  challenge_token?: string;
}

export interface ChallengeParams {
  challenge_token?: string;
}

export interface SignInResponse {
  session: unknown;
}

export interface SocialCallbackResponse {
  session: unknown;
}

export type SocialConnectionProvider =
  | "x_oauth"
  | "github_oauth"
  | "gitlab_oauth"
  | "google_oauth"
  | "facebook_oauth"
  | "microsoft_oauth"
  | "linkedin_oauth"
  | "discord_oauth"
  | "apple_oauth"