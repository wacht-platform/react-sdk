import type { User } from "./user";

export interface SignIn {
	id: number;
	userId: number;
	user: User;
}

export interface SignInAttempt {
	id: number;
	signInId: number;
	signIn: SignIn;
	createdAt: string;
}

export interface Session {
	id: number;
	activeSignIn: SignIn | null;
	signIns: SignIn[];
	sign_in_attempts?: SignInAttempt[];
}
