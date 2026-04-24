import { useState, useRef } from "react";
import useSWR from "swr";
import styled from "styled-components";
import { Organization, OrganizationDomain } from "@/types";
import { useOrganizationList } from "@/hooks/use-organization";
import { Button, Spinner } from "@/components/utility";
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
    DesktopTableContainer,
    StatusPill,
} from "./shared";

const InlineActions = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: flex-end;
    flex-wrap: nowrap;
    white-space: nowrap;
`;

export const DomainsSection = ({ organization }: { organization: Organization }) => {
    const {
        getOrganizationDomains: getDomains,
        removeOrganizationDomain: removeDomain,
    } = useOrganizationList();

    const [domainForDeletion, setDomainForDeletion] = useState<string | null>(null);
    const [isAddingDomain, setIsAddingDomain] = useState(false);
    const [domainInVerification, setDomainInVerification] = useState<string | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const addDomainButtonRef = useRef<HTMLButtonElement>(null);
    const verifyButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const {
        data: domains = [],
        isLoading,
        mutate,
    } = useSWR(
        organization?.id ? `wacht-org-domains:${organization.id}` : null,
        async () => {
            const real = (await getDomains?.(organization)) || [];
            return real.map((d) => ({
                ...d,
                verified: d.verified !== undefined ? d.verified : false,
            }));
        },
    );

    const markPending = (id: string, on: boolean) => {
        setPendingIds((prev) => {
            const next = new Set(prev);
            on ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const handleDelete = async (domain: OrganizationDomain) => {
        markPending(domain.id, true);
        try {
            await removeDomain(organization, domain);
            mutate();
        } finally {
            markPending(domain.id, false);
            setDomainForDeletion(null);
        }
    };

    if (isLoading) return <Spinner />;

    return (
        <>
            <HeaderCTAContainer style={{ marginBottom: "var(--space-6u)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-card-foreground)" }}>
                        Domains
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-secondary-text)", marginTop: 2 }}>
                        Users with verified domain emails auto-join this organization.
                    </div>
                </div>
                <Button ref={addDomainButtonRef} onClick={() => setIsAddingDomain(true)} $size="sm">
                    Add domain
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

            {!domains?.length ? (
                <EmptyState
                    title="No domains added"
                    description="Users with verified domain emails automatically join this organization."
                />
            ) : (
                <DesktopTableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeader>Domain</TableHeader>
                                <TableHeader>Status</TableHeader>
                                <TableHeader>Added</TableHeader>
                                <TableHeader />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {domains.map((domain) => {
                                const isBusy = pendingIds.has(domain.id);
                                return (
                                    <TableRow key={domain.id}>
                                        <TableCell>{domain.fqdn}</TableCell>
                                        <TableCell>
                                            {domain.verified ? (
                                                <StatusPill $variant="success">Verified</StatusPill>
                                            ) : (
                                                <StatusPill $variant="warning">Pending</StatusPill>
                                            )}
                                        </TableCell>
                                        <TableCell style={{ color: "var(--color-secondary-text)" }}>
                                            {new Date(domain.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <ActionsCell>
                                            <InlineActions>
                                                <Button
                                                    ref={(r: HTMLButtonElement | null) => {
                                                        if (r) verifyButtonRefs.current[domain.id] = r;
                                                    }}
                                                    $size="sm"
                                                    $outline
                                                    disabled={isBusy}
                                                    onClick={() => setDomainInVerification(domain.id)}
                                                >
                                                    {domain.verified ? "View DNS" : "Verify"}
                                                </Button>
                                                <Button
                                                    $size="sm"
                                                    $outline
                                                    $destructive
                                                    disabled={isBusy}
                                                    onClick={() => setDomainForDeletion(domain.id)}
                                                >
                                                    {isBusy ? <Spinner size={12} /> : "Remove"}
                                                </Button>
                                            </InlineActions>
                                        </ActionsCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </DesktopTableContainer>
            )}

            {domainForDeletion && (
                <ConfirmationPopover
                    title="Remove domain?"
                    description="Active users aren't affected, but new users with this domain won't auto-join."
                    onConfirm={() => {
                        const domain = domains.find((d) => d.id === domainForDeletion);
                        if (domain) handleDelete(domain);
                    }}
                    onCancel={() => setDomainForDeletion(null)}
                />
            )}

            {domainInVerification && (
                <AddDomainPopover
                    domain={domains.find((d) => d.id === domainInVerification)}
                    onClose={() => setDomainInVerification(null)}
                    triggerRef={{ current: verifyButtonRefs.current[domainInVerification] }}
                />
            )}
        </>
    );
};
