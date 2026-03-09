function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasScopedId(value: Record<string, unknown>, key: string): boolean {
  const candidate = value[key];

  if (typeof candidate === "string") {
    return candidate.length > 0 && candidate !== "0";
  }

  if (typeof candidate === "number") {
    return Number.isFinite(candidate) && candidate > 0;
  }

  return false;
}

function readBoolean(value: Record<string, unknown>, key: string): boolean | null {
  const candidate = value[key];
  return typeof candidate === "boolean" ? candidate : null;
}

export function isDeploymentLevelRole(role: unknown): boolean {
  if (!isRecord(role)) return false;

  const explicitFlag = readBoolean(role, "is_deployment_level");
  if (explicitFlag !== null) {
    return explicitFlag;
  }

  return false;
}

export function canEditOrganizationRole(role: unknown): boolean {
  if (!isRecord(role)) return false;
  if (isDeploymentLevelRole(role)) return false;

  return hasScopedId(role, "organization_id");
}

export function canEditWorkspaceRole(role: unknown): boolean {
  if (!isRecord(role)) return false;
  if (isDeploymentLevelRole(role)) return false;

  return hasScopedId(role, "workspace_id");
}
