// Eligibility restriction types for organization and workspace memberships
export type EligibilityRestrictionType =
    | "none"
    | "ip_not_allowed"
    | "mfa_required"
    | "ip_and_mfa_required";

export interface EligibilityRestriction {
    type: EligibilityRestrictionType;
    message: string;
}

// Extended membership types with eligibility restriction
declare module "@wacht/types" {
    export interface OrganizationMembershipWithOrganization {
        eligibility_restriction?: EligibilityRestriction;
    }

    export interface WorkspaceMembershipWithWorkspace {
        eligibility_restriction?: EligibilityRestriction;
    }
}
