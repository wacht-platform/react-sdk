import type { User } from "./user";

export interface SignIn {
	id: number;
	userId: number;
	user: User;
}

type SignInMethod = "plain" | "sso" | "passkey";

type SSOProvider =
	| "x_oauth"
	| "github_oauth"
	| "gitlab_oauth"
	| "google_oauth"
	| "facebook_oauth"
	| "microsoft_oauth"
	| "linkedin_oauth"
	| "discord_oauth";

type CurrentSessionStep =
	| "verify_password"
	| "verify_email"
	| "verify_email_otp"
	| "verify_phone"
	| "verify_phone_otp"
	| "verify_authenticator"
	| "add_second_factor";

export interface SignInAttempt {
	id: number;
	email: string;
	session_id: number;
	method: SignInMethod;
	sso_provider: SSOProvider;
	expires_at: string;
	first_method_authenticated: boolean;
	second_method_authenticated: boolean;
	second_method_authentication_required: boolean;
	user_id: number;
	last_active_org_id: number;
	current_step: CurrentSessionStep;
	completed: boolean;
}

export interface Session {
	id: number;
	activeSignIn: SignIn | null;
	signIns: SignIn[];
	sign_in_attempts?: SignInAttempt[];
}
