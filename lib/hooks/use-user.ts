import { useState } from 'react';

interface Email {
    address: string;
    isPrimary?: boolean;
}

interface Phone {
    number: string;
    isPrimary?: boolean;
}

interface ConnectedAccount {
    provider: string;
    email: string;
}

interface User {
    name: string;
    imageUrl?: string;
    emails: Email[];
    phones: Phone[];
    connectedAccounts: ConnectedAccount[];
}

interface UserSession {
    id: string;
    browser: string;
    ipAddress: string;
    timestamp: string;
    location: string;
}

export function useUser() {
    // Static mock data
    const [user] = useState<User>({
        name: 'John Doe',
        imageUrl: 'https://i.pravatar.cc/300',
        emails: [
            { address: 'john.doe@example.com', isPrimary: true },
            { address: 'john.work@example.com' }
        ],
        phones: [
            { number: '+1 (555) 123-4567', isPrimary: true }
        ],
        connectedAccounts: [
            { provider: 'Google', email: 'john.doe@gmail.com' },
            { provider: 'GitHub', email: 'johndoe@github.com' }
        ]
    });

    const editProfile = () => {
        // Mock implementation
        console.log('Edit profile');
    };

    const addEmail = () => {
        // Mock implementation
        console.log('Add email');
    };

    const addPhone = () => {
        // Mock implementation
        console.log('Add phone');
    };

    const connectAccount = () => {
        // Mock implementation
        console.log('Connect account');
    };

    // Mock session data
    const sessions: UserSession[] = [
        {
            id: '1',
            browser: 'Chrome on MacOS',
            ipAddress: '192.168.1.1',
            timestamp: 'Last active 2 hours ago',
            location: 'San Francisco, US'
        },
        {
            id: '2',
            browser: 'Safari on iOS',
            ipAddress: '192.168.1.2',
            timestamp: 'Last active 5 minutes ago',
            location: 'New York, US'
        }
    ];

    return {
        user: {
            ...user,
            sessions
        },
        editProfile,
        addEmail,
        addPhone,
        connectAccount
    };
}