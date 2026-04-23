import { useState, useRef, useMemo } from "react";
import { Warning, Copy, ArrowSquareOut, Trash, Info } from "@phosphor-icons/react";
import useSWR from "swr";
import { Organization, OrganizationDomain } from "@/types";
import { useOrganizationList } from "@/hooks/use-organization";
import {
    Button,
    SearchInput,
    Spinner,
    Dropdown,
    DropdownItems,
    DropdownItem,
    DropdownTrigger,
    DropdownDivider,
} from "@/components/utility";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    ActionsCell,
} from "@/components/utility/table";
import { EmptyState } from "@/components/utility/empty-state";
import { AddDomainPopover } from "../add-domain-popover";
import { ConfirmationPopover } from "../../utility/confirmation-popover";
import {
    HeaderCTAContainer,
    IconButton,
    DesktopTableContainer,
    MobileListContainer,
} from "./shared";
import styled from "styled-components";

const Badge = styled.span<{ $type: "success" | "warning" }>`
  background: ${props => props.$type === "success" ? "var(--color-primary-background)" : "var(--color-warning-background)"};
  color: ${props => props.$type === "success" ? "var(--color-primary)" : "var(--color-warning)"};
  padding: var(--space-2u) var(--space-4u);
  border-radius: var(--radius-2xs);
  font-size: var(--font-size-sm);
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: var(--space-2u);
  max-width: max-content;
`;

const InfoCard = styled.div`
  padding: var(--space-8u);
  background: var(--color-background-subtle);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-12u);
  border: var(--border-width-thin) solid var(--color-border);
  display: flex;
  gap: var(--space-6u);
  align-items: flex-start;
`;

const InfoContent = styled.div`
  flex: 1;
  font-size: var(--font-size-md);
  line-height: 1.5;
  color: var(--color-secondary-text);
`;

const MobileDomainCard = styled.div`
  padding: var(--space-8u);
  background: var(--color-input-background);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-6u);
`;

export const DomainsSection = ({ organization }: { organization: Organization }) => {
    const {
        getOrganizationDomains: getDomains,
        removeOrganizationDomain: removeDomain,
    } = useOrganizationList();
    const [domainForDeletion, setDomainForDeletion] = useState<string | null>(null);

    const {
        data: domains = [],
        isLoading,
        mutate,
    } = useSWR(
        organization?.id ? `wacht-org-domains:${organization.id}` : null,
        async () => {
            const realDomains = (await getDomains?.(organization)) || [];
            return realDomains.map((domain) => ({
                ...domain,
                verified: domain.verified !== undefined ? domain.verified : false,
            }));
        }
    );

    const [isAddingDomain, setIsAddingDomain] = useState(false);
    const [domainInVerification, setDomainInVerification] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDomainInAction, setSelectedDomainAction] = useState<string | null>(null);
    const addDomainButtonRef = useRef<HTMLButtonElement>(null);
    const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const filteredDomains = useMemo(() => {
        if (!searchQuery.trim()) return domains;
        const lower = searchQuery.toLowerCase();
        return domains.filter((d) => d.fqdn.toLowerCase().includes(lower));
    }, [domains, searchQuery]);

    const handleDeleteDomain = async (domain: OrganizationDomain) => {
        await removeDomain(organization, domain);
        mutate();
        setDomainForDeletion(null);
    };

    if (isLoading) return <Spinner />;

    return (
        <>
            <HeaderCTAContainer>
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="MagnifyingGlass domains..."
                />
                <Button
                    ref={addDomainButtonRef}
                    onClick={() => setIsAddingDomain(true)}
                >
                    Add Domain
                </Button>
                {isAddingDomain && (
                    <AddDomainPopover
                        onClose={() => {
                            setIsAddingDomain(false);
                            mutate();
                        }}
                        triggerRef={addDomainButtonRef}
                    />
                )}
            </HeaderCTAContainer>

            {filteredDomains?.length > 0 && (
                <InfoCard>
                    <Info size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: "var(--space-1u)" }} />
                    <InfoContent>
                        Users with verified domain emails automatically join this organization
                        {organization?.auto_assigned_workspace_id &&
                            ` and will be auto-assigned to the default workspace.`}
                        . This helps streamline onboarding for your team.
                    </InfoContent>
                </InfoCard>
            )}

            {!filteredDomains?.length ? (
                <EmptyState
                    title={searchQuery ? "No domains match your search" : "No domains added"}
                    description={searchQuery ? "Try a different search term." : "Manage your corporate domains to streamline onboarding for your team."}
                />
            ) : (
                <>
                    <DesktopTableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>Domain</TableHeader>
                                    <TableHeader>Status</TableHeader>
                                    <TableHeader>Date Added</TableHeader>
                                    <TableHeader></TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredDomains.map((domain) => (
                                    <TableRow key={domain.id}>
                                        <TableCell>{domain.fqdn}</TableCell>
                                        <TableCell>
                                            {domain.verified ? (
                                                <Badge $type="success">✓ Verified</Badge>
                                            ) : (
                                                <Badge $type="warning">
                                                    <Warning size={12} /> Pending
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(domain.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <ActionsCell>
                                            <ActionButtonContainer
                                                domain={domain}
                                                selectedAction={selectedDomainInAction}
                                                setSelectedAction={setSelectedDomainAction}
                                                onVerify={() => setDomainInVerification(domain.id)}
                                                onDelete={() => setDomainForDeletion(domain.id)}
                                                actionButtonRefs={actionButtonRefs}
                                            />
                                        </ActionsCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </DesktopTableContainer>

                    <MobileListContainer>
                        {filteredDomains.map((domain) => (
                            <MobileDomainCard key={domain.id}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontWeight: 400, fontSize: "var(--font-size-lg)", marginBottom: "var(--space-2u)" }}>{domain.fqdn}</div>
                                        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-muted)" }}>
                                            Added on {new Date(domain.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <ActionButtonContainer
                                        domain={domain}
                                        selectedAction={selectedDomainInAction}
                                        setSelectedAction={setSelectedDomainAction}
                                        onVerify={() => setDomainInVerification(domain.id)}
                                        onDelete={() => setDomainForDeletion(domain.id)}
                                        actionButtonRefs={actionButtonRefs}
                                    />
                                </div>
                                <div>
                                    {domain.verified ? (
                                        <Badge $type="success">✓ Verified</Badge>
                                    ) : (
                                        <Badge $type="warning">
                                            <Warning size={12} /> Pending Verification
                                        </Badge>
                                    )}
                                </div>
                            </MobileDomainCard>
                        ))}
                    </MobileListContainer>
                </>
            )}

            {domainForDeletion && (
                <ConfirmationPopover
                    title="Delete domain?"
                    description="Are you sure you want to remove this domain? Active users won't be affected but new ones won't auto-join."
                    onConfirm={() => {
                        const domain = domains.find(d => d.id === domainForDeletion);
                        if (domain) handleDeleteDomain(domain);
                    }}
                    onCancel={() => setDomainForDeletion(null)}
                />
            )}

            {domainInVerification && (
                <AddDomainPopover
                    domain={domains.find(d => d.id === domainInVerification)}
                    onClose={() => setDomainInVerification(null)}
                    triggerRef={{ current: actionButtonRefs.current[domainInVerification] }}
                />
            )}
        </>
    );
};

const ActionButtonContainer = ({
    domain,
    selectedAction,
    setSelectedAction,
    onVerify,
    onDelete,
    actionButtonRefs
}: any) => (
    <div style={{ position: "relative" }}>
        <Dropdown
            open={selectedAction === domain.id}
            openChange={(v) => setSelectedAction(v ? domain.id : null)}
        >
            <DropdownTrigger>
                <IconButton ref={(el) => { actionButtonRefs.current[domain.id] = el; }}>•••</IconButton>
            </DropdownTrigger>

            <DropdownItems>
                <DropdownItem onClick={() => { onVerify(); setSelectedAction(null); }}>
                    {domain.verified ? "📋 View DNS Record" : "✓ Verify Domain"}
                </DropdownItem>
                <DropdownItem onClick={() => { navigator.clipboard.writeText(domain.fqdn); setSelectedAction(null); }}>
                    <Copy size={16} /> Copy Domain
                </DropdownItem>
                <DropdownItem onClick={() => { window.open(`https://${domain.fqdn}`, "_blank"); setSelectedAction(null); }}>
                    <ArrowSquareOut size={16} /> Visit Domain
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem $destructive onClick={() => { onDelete(); setSelectedAction(null); }}>
                    <Trash size={16} /> Remove Domain
                </DropdownItem>
            </DropdownItems>
        </Dropdown>
    </div>
);
