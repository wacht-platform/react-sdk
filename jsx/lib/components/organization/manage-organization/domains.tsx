import { useState, useRef, useMemo } from "react";
import { AlertTriangle, Copy, ExternalLink, Trash2, Info } from "lucide-react";
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
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: max-content;
`;

const InfoCard = styled.div`
  padding: 16px;
  background: var(--color-background-alt);
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid var(--color-border);
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const InfoContent = styled.div`
  flex: 1;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-secondary-text);
`;

const MobileDomainCard = styled.div`
  padding: 16px;
  background: var(--color-input-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
                    placeholder="Search domains..."
                />
                <Button
                    $size="sm"
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
                    <Info size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
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
                                                    <AlertTriangle size={12} /> Pending
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
                                        <div style={{ fontWeight: 400, fontSize: "14px", marginBottom: "4px" }}>{domain.fqdn}</div>
                                        <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>
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
                                            <AlertTriangle size={12} /> Pending Verification
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
                    <ExternalLink size={16} /> Visit Domain
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem $destructive onClick={() => { onDelete(); setSelectedAction(null); }}>
                    <Trash2 size={16} /> Remove Domain
                </DropdownItem>
            </DropdownItems>
        </Dropdown>
    </div>
);
