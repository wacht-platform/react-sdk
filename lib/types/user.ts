interface SocialConnection {
    id: number;
    provider: string;
    emailAddress: string;
}

interface UserEmailAddress {
    id: number;
    email: string;
    isPrimary: boolean;
    socialConnection?: SocialConnection;
}

interface User {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    phoneNumber: string;
    primaryEmailAddress: string;
    userEmailAddresses: UserEmailAddress[];
} 