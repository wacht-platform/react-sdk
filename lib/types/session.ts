interface SignIn {
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

interface SigninAttempt {
	id: string;
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

type SignupAttemptStep =
	| "verify_email"
	| "verify_phone"
	| "verify_authenticator";

interface SignupAttempt {
	id: string;
	session_id: number;
	first_name: string;
	last_name: string;
	email: string;
	username: string;
	phone_number: string;
	password: string;
	required_fields: string[];
	missing_fields: string[];
	current_step: SignupAttemptStep;
	remaining_steps: SignupAttemptStep[];
	completed: boolean;
}

interface Session {
	id: number;
	active_signin: SignIn | null;
	signins: SignIn[];
	signin_attempts?: SigninAttempt[];
	signup_attempts?: SignupAttempt[];
}
