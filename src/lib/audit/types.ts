export type AuditAction =
  | 'user.create'
  | 'user.activate'
  | 'user.deactivate'
  | 'user.reset_password'
  | 'settings.update';

export type AuditTargetType = 'user' | 'settings';

export type AuditStatus = 'success' | 'failure';

export interface AuditLogEntry {
  id?: string;
  actorId: string | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string | null;
  status: AuditStatus;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  createdAt?: string;
}
