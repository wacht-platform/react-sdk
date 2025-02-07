enum SocialAuthProvider {
  GitHub = "github_oauth",
  Google = "google_oauth",
  Microsoft = "microsoft_oauth",
}

interface SignUpParams {
  first_name?: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  email?: string;
  password?: string;
}

interface SSOResponse {
  oauth_url: string;
  session: unknown;
}

interface SignInParams {
  email?: string;
  username?: string;
  password?: string;
  phone?: string;
}

interface SignInResponse {
  session: unknown;
}

interface SSOCallbackResponse {
  session: unknown;
}
