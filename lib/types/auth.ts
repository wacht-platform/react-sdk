export enum SSOProvider {
    GitHub = "github_oauth",
    Google = "google_oauth",
    Microsoft = "microsoft_oauth",
}

export interface SignUpParams {
    firstName?: string;
    lastName?: string;
    username?: string;
    phoneNumber?: string;
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