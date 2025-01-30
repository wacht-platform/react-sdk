export enum SocialAuthProvider {
  GitHub = "github_oauth",
  Google = "google_oauth",
  Microsoft = "microsoft_oauth",
}

export interface SignUpParams {
  first_name?: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  email?: string;
  password?: string;
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
}

export interface SignInResponse {
  session: unknown;
}

export interface SSOCallbackResponse {
  session: unknown;
}
