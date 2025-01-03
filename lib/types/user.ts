export interface SocialConnection {
    id: number;
    provider: string;
    emailAddress: string;
}

export interface UserEmailAddress {
    id: number;
    email: string;
    isPrimary: boolean;
    socialConnection?: SocialConnection;
}

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    phoneNumber: string;
    primaryEmailAddress: string;
    userEmailAddresses: UserEmailAddress[];
} 