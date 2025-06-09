# @snipextt/wacht

A comprehensive React component library and hooks collection for the Wacht development toolkit. This package provides shared UI components and business logic for building enterprise-grade applications quickly and efficiently.

## 🚀 Overview

`@snipextt/wacht` is the frontend component library that powers the Wacht ecosystem. It includes pre-built React components, custom hooks, and utilities for authentication, organization management, workspace handling, and deployment operations.

## ✨ Features

- **Authentication Components**: Complete auth flow with signin, signup, SSO, and 2FA
- **Organization Management**: Multi-tenant organization components and hooks
- **Workspace Management**: Workspace creation, management, and switching
- **Deployment Components**: Application deployment status and controls
- **Custom Hooks**: Business logic hooks for API interactions
- **Utility Components**: Common UI patterns and helper components
- **TypeScript Support**: Full TypeScript definitions included
- **Styled Components**: Consistent theming and styling

## 📦 Installation

```bash
# Using npm
npm install @snipextt/wacht

# Using yarn
yarn add @snipextt/wacht

# Using pnpm
pnpm add @snipextt/wacht
```

### Peer Dependencies

Make sure you have React 19+ installed:

```bash
npm install react@^19.0.0
```

## 🛠 Tech Stack

- **React**: 19+ with hooks and modern patterns
- **TypeScript**: Full type safety and IntelliSense
- **Styled Components**: CSS-in-JS styling solution
- **SWR**: Data fetching and caching
- **Headless UI**: Accessible UI primitives
- **Lucide React**: Beautiful icon library
- **QR Code React**: QR code generation for 2FA
- **TS Pattern**: Pattern matching for TypeScript

## 🚀 Quick Start

### 1. Setup Providers

Wrap your app with the necessary providers:

```tsx
import {
  DeploymentProvider,
  DeploymentInitialized,
  DeploymentInitializing,
  SignedIn,
  SignedOut,
  LoadingFallback,
  NavigateToSignIn,
  QueryProvider
} from '@snipextt/wacht';

function App() {
  return (
    <DeploymentProvider publicKey="">
      <DeploymentInitialized>
        <SignedIn>
          <QueryProvider>
            <SignedInRoutes />
          </QueryProvider>
        </SignedIn>
        <SignedOut>
          <NavigateToSignIn />
        </SignedOut>
      </DeploymentInitialized>
      <DeploymentInitializing>
        <LoadingFallback
          variant="detailed"
          message="Initializing deployment"
        />
      </DeploymentInitializing>
    </DeploymentProvider>
  );
}
```

### 2. Core Components Explained

#### DeploymentProvider
The main provider that initializes your application with a deployment configuration:

```tsx
<DeploymentProvider publicKey="your-base64-encoded-deployment-key">
  {/* Your app content */}
</DeploymentProvider>
```

#### Authentication State Components
These components handle different authentication states:

```tsx
// Renders when deployment is fully initialized
<DeploymentInitialized>
  <SignedIn>
    {/* Content for authenticated users */}
    <QueryProvider>
      <YourMainApp />
    </QueryProvider>
  </SignedIn>
  <SignedOut>
    {/* Content for unauthenticated users */}
    <NavigateToSignIn />
  </SignedOut>
</DeploymentInitialized>

// Renders while deployment is initializing
<DeploymentInitializing>
  <LoadingFallback variant="detailed" message="Initializing deployment" />
</DeploymentInitializing>
```

### 3. Using Authentication Hooks

```tsx
import { useSignin, useSession } from '@snipextt/wacht';

function LoginForm() {
  const { signin, loading } = useSignin();
  const { session } = useSession();

  const handleLogin = async (email: string, password: string) => {
    await signin({ email, password });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      handleLogin(formData.get('email'), formData.get('password'));
    }}>
      <input name="email" type="email" placeholder="Email" />
      <input name="password" type="password" placeholder="Password" />
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

### 4. Organization Management

```tsx
import { useOrganization } from '@snipextt/wacht';

function OrganizationSelector() {
  const { organizations, currentOrg, switchOrganization } = useOrganization();

  return (
    <select
      value={currentOrg?.id}
      onChange={(e) => switchOrganization(e.target.value)}
    >
      {organizations.map(org => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  );
}
```

### 5. Workspace Management

```tsx
import { useWorkspace } from '@snipextt/wacht';

function WorkspaceList() {
  const { workspaces, createWorkspace, loading } = useWorkspace();

  return (
    <div>
      <h2>Workspaces</h2>
      {workspaces.map(workspace => (
        <div key={workspace.id}>
          <h3>{workspace.name}</h3>
          <p>{workspace.description}</p>
        </div>
      ))}
      <button
        onClick={() => createWorkspace({ name: 'New Workspace' })}
        disabled={loading}
      >
        Create Workspace
      </button>
    </div>
  );
}
```

### 6. Loading States

The `LoadingFallback` component supports different variants:

```tsx
import { LoadingFallback } from '@snipextt/wacht';

// Detailed loading with custom message
<LoadingFallback
  variant="detailed"
  message="Initializing deployment"
/>

// Simple loading spinner
<LoadingFallback variant="simple" />

// Default loading state
<LoadingFallback />
```

### 7. Pre-built Authentication Components

#### SignIn Form
Complete sign-in form with validation and error handling:

```tsx
import { SignInForm } from '@snipextt/wacht';

function LoginPage() {
  return (
    <div className="login-container">
      <h1>Welcome Back</h1>
      <SignInForm
        onSuccess={(user) => {
          console.log('User signed in:', user);
          // Handle successful sign in
        }}
        onError={(error) => {
          console.error('Sign in error:', error);
          // Handle sign in error
        }}
        showRememberMe={true}
        showForgotPassword={true}
        redirectTo="/dashboard"
      />
    </div>
  );
}
```

#### SignUp Form
User registration form with validation:

```tsx
import { SignUpForm } from '@snipextt/wacht';

function RegisterPage() {
  return (
    <div className="register-container">
      <h1>Create Account</h1>
      <SignUpForm
        onSuccess={(user) => {
          console.log('User registered:', user);
          // Handle successful registration
        }}
        onError={(error) => {
          console.error('Registration error:', error);
        }}
        requireEmailVerification={true}
        showTermsAcceptance={true}
        redirectTo="/welcome"
      />
    </div>
  );
}
```

### 8. User Interface Components

#### User Button/Avatar
Display user information with dropdown menu:

```tsx
import { UserButton, UserProfile } from '@snipextt/wacht';

function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1>My App</h1>
        <UserButton
          showName={true}
          showAvatar={true}
          menuItems={[
            { label: 'Profile', action: 'profile' },
            { label: 'Settings', action: 'settings' },
            { label: 'Sign Out', action: 'signout' }
          ]}
          onMenuAction={(action) => {
            switch(action) {
              case 'profile':
                // Navigate to profile
                break;
              case 'settings':
                // Navigate to settings
                break;
              case 'signout':
                // Handle sign out
                break;
            }
          }}
        />
      </div>
    </header>
  );
}
```

#### User Profile Component
Complete user profile management:

```tsx
import { UserProfile } from '@snipextt/wacht';

function ProfilePage() {
  return (
    <div className="profile-page">
      <UserProfile
        showAvatar={true}
        allowAvatarUpload={true}
        showPersonalInfo={true}
        showSecuritySettings={true}
        showNotificationSettings={true}
        onProfileUpdate={(updatedUser) => {
          console.log('Profile updated:', updatedUser);
        }}
      />
    </div>
  );
}
```

### 9. Organization & Workspace Components

#### Organization Switcher
Pre-built organization selector with search:

```tsx
import { OrganizationSwitcher } from '@snipextt/wacht';

function AppSidebar() {
  return (
    <aside className="sidebar">
      <OrganizationSwitcher
        showCreateButton={true}
        showSearch={true}
        onOrganizationChange={(org) => {
          console.log('Switched to organization:', org);
        }}
        onCreateOrganization={() => {
          // Handle create organization
        }}
      />
    </aside>
  );
}
```

#### Workspace Selector
Workspace management component:

```tsx
import { WorkspaceSwitcher, CreateWorkspaceButton } from '@snipextt/wacht';

function WorkspaceNavigation() {
  return (
    <div className="workspace-nav">
      <WorkspaceSwitcher
        showDescription={true}
        showMemberCount={true}
        onWorkspaceChange={(workspace) => {
          console.log('Switched to workspace:', workspace);
        }}
      />
      <CreateWorkspaceButton
        variant="primary"
        onSuccess={(newWorkspace) => {
          console.log('Created workspace:', newWorkspace);
        }}
      />
    </div>
  );
}
```

### 10. Authentication Flow Components

#### Two-Factor Authentication Setup
Complete 2FA setup with QR code:

```tsx
import { TwoFactorSetup, TwoFactorVerification } from '@snipextt/wacht';

function SecuritySettings() {
  const [showSetup, setShowSetup] = useState(false);

  return (
    <div className="security-settings">
      <h2>Two-Factor Authentication</h2>

      {!showSetup ? (
        <button onClick={() => setShowSetup(true)}>
          Enable 2FA
        </button>
      ) : (
        <TwoFactorSetup
          onSetupComplete={(backupCodes) => {
            console.log('2FA setup complete, backup codes:', backupCodes);
            setShowSetup(false);
          }}
          onCancel={() => setShowSetup(false)}
          showQRCode={true}
          showBackupCodes={true}
        />
      )}
    </div>
  );
}
```

#### Email Verification Component
Handle email verification flow:

```tsx
import { EmailVerification } from '@snipextt/wacht';

function VerifyEmailPage() {
  return (
    <div className="verify-email-page">
      <EmailVerification
        onVerificationSuccess={() => {
          console.log('Email verified successfully');
          // Redirect to dashboard
        }}
        onResendEmail={() => {
          console.log('Verification email resent');
        }}
        showResendButton={true}
        resendCooldown={60} // seconds
      />
    </div>
  );
}
```

### 11. Control & Utility Components

#### Sign Out Button
Pre-styled sign out button with confirmation:

```tsx
import { SignOutButton } from '@snipextt/wacht';

function UserMenu() {
  return (
    <div className="user-menu">
      <SignOutButton
        variant="danger"
        showConfirmation={true}
        confirmationMessage="Are you sure you want to sign out?"
        onSignOut={() => {
          console.log('User signed out');
          // Handle post-signout logic
        }}
      />
    </div>
  );
}
```

#### Protect Component
Conditionally render content based on authentication:

```tsx
import { Protect } from '@snipextt/wacht';

function AdminPanel() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Only show to authenticated users */}
      <Protect>
        <div className="user-content">
          <p>Welcome back!</p>
        </div>
      </Protect>

      {/* Only show to users with specific role */}
      <Protect role="admin">
        <div className="admin-content">
          <p>Admin-only content</p>
        </div>
      </Protect>

      {/* Custom fallback for unauthorized users */}
      <Protect
        fallback={<div>You need admin access to view this.</div>}
        role="admin"
      >
        <AdminSettings />
      </Protect>
    </div>
  );
}
```

#### Waitlist Component
Handle waitlist functionality:

```tsx
import { WaitlistForm, WaitlistStatus } from '@snipextt/wacht';

function WaitlistPage() {
  return (
    <div className="waitlist-page">
      <h1>Join Our Waitlist</h1>

      <WaitlistForm
        onJoinSuccess={(position) => {
          console.log('Joined waitlist at position:', position);
        }}
        showPosition={true}
        collectAdditionalInfo={true}
        fields={['name', 'email', 'company', 'useCase']}
      />

      {/* Show waitlist status for existing users */}
      <WaitlistStatus
        showPosition={true}
        showEstimatedWait={true}
        allowUpdates={true}
      />
    </div>
  );
}
```

### 12. Social Authentication

#### OAuth Buttons
Pre-built social login buttons:

```tsx
import {
  GoogleSignInButton,
  GitHubSignInButton,
  MicrosoftSignInButton,
  SocialSignInGroup
} from '@snipextt/wacht';

function SocialLoginSection() {
  return (
    <div className="social-login">
      <h3>Or continue with</h3>

      {/* Individual social buttons */}
      <GoogleSignInButton
        onSuccess={(user) => console.log('Google sign in:', user)}
        onError={(error) => console.error('Google error:', error)}
      />

      <GitHubSignInButton
        onSuccess={(user) => console.log('GitHub sign in:', user)}
        onError={(error) => console.error('GitHub error:', error)}
      />

      {/* Or use the grouped component */}
      <SocialSignInGroup
        providers={['google', 'github', 'microsoft']}
        onSuccess={(provider, user) => {
          console.log(`${provider} sign in:`, user);
        }}
        onError={(provider, error) => {
          console.error(`${provider} error:`, error);
        }}
      />
    </div>
  );
}
```

## 📚 Available Hooks

### Authentication Hooks
- `useSignin()` - Handle user signin
- `useSignup()` - Handle user registration
- `useSession()` - Manage user session
- `useVerification()` - Email/phone verification
- `useSSOCallback()` - OAuth callback handling

### Business Logic Hooks
- `useOrganization()` - Organization management
- `useWorkspace()` - Workspace operations
- `useDeployment()` - Deployment management
- `useUser()` - User profile management
- `useWaitlist()` - Waitlist functionality

### Utility Hooks
- `useClient()` - API client configuration

## 🎨 Available Components

### Core Provider Components
- `DeploymentProvider` - Main application provider with deployment configuration
- `QueryProvider` - Data fetching and caching provider
- `DeploymentInitialized` - Renders when deployment is ready
- `DeploymentInitializing` - Renders during deployment initialization

### Authentication State Components
- `SignedIn` - Renders content for authenticated users
- `SignedOut` - Renders content for unauthenticated users
- `NavigateToSignIn` - Redirects to signin page
- `LoadingFallback` - Configurable loading component with variants

### Authentication Form Components
- `SignInForm` - Complete signin form with validation and error handling
- `SignUpForm` - User registration form with email verification
- `EmailVerification` - Email verification flow with resend functionality
- `TwoFactorSetup` - 2FA setup with QR code and backup codes
- `TwoFactorVerification` - 2FA code verification

### User Interface Components
- `UserButton` - User avatar/button with dropdown menu
- `UserProfile` - Complete user profile management component
- `SignOutButton` - Pre-styled sign out button with confirmation

### Organization Components
- `OrganizationSwitcher` - Organization selector with search and create functionality
- `OrganizationSettings` - Organization configuration
- `MemberManagement` - Team member management

### Workspace Components
- `WorkspaceSwitcher` - Workspace selector with descriptions and member counts
- `CreateWorkspaceButton` - Workspace creation button
- `WorkspaceSettings` - Workspace configuration

### Social Authentication Components
- `GoogleSignInButton` - Google OAuth sign-in button
- `GitHubSignInButton` - GitHub OAuth sign-in button
- `MicrosoftSignInButton` - Microsoft OAuth sign-in button
- `SocialSignInGroup` - Grouped social sign-in buttons

### Control & Utility Components
- `Protect` - Conditional rendering based on authentication/roles
- `WaitlistForm` - Waitlist signup form with additional fields
- `WaitlistStatus` - Display waitlist position and status
- `DeploymentInstance` - Deployment status display
- `LoadingSpinner` - Loading states
- `ErrorBoundary` - Error handling

## 🔧 Development

### Setup Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd wacht-react

# Install dependencies
pnpm install

# Build the library
pnpm build
```

### Building

```bash
# Build for production
pnpm build

# Watch mode for development
pnpm build --watch
```

### Testing

```bash
# Run tests (when available)
pnpm test

# Type checking
pnpm type-check
```

## 📁 Project Structure

```
wacht-react/
├── lib/
│   ├── components/      # React components
│   │   ├── auth/       # Authentication components
│   │   ├── control/    # Control components
│   │   ├── organization/ # Organization components
│   │   ├── user/       # User management components
│   │   ├── workspace/  # Workspace components
│   │   └── utility/    # Utility components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── constants/      # Application constants
├── dist/               # Built library files
├── package.json        # Package configuration
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite build configuration
```

## 🔗 API Integration

This library is designed to work with the [Wacht Frontend API](../wacht-frontend-api). Make sure to configure the API client properly:

```tsx
import { useClient } from '@snipextt/wacht';

// Configure API base URL
const client = useClient({
  baseURL: 'https://your-api-domain.com',
  apiKey: 'your-api-key'
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-component`)
3. Commit your changes (`git commit -m 'Add amazing component'`)
4. Push to the branch (`git push origin feature/amazing-component`)
5. Open a Pull Request

### Development Guidelines

- Follow React best practices and hooks patterns
- Use TypeScript for all new code
- Write meaningful component documentation
- Test components thoroughly
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in this repository
- Check the component documentation
- Contact the development team

## 🔗 Related Projects

- [Wacht Frontend API](../wacht-frontend-api) - Backend API for the Wacht platform
- Wacht Platform - Main platform repository

---

Built with ❤️ by the Wacht team for rapid enterprise application development.
