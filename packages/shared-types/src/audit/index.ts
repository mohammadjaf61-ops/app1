/**
 * Audit and logging types
 */

import type { BaseEntity } from '../common';

/**
 * Audit action types
 */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  STATUS_CHANGE = 'STATUS_CHANGE',
  ASSIGNMENT = 'ASSIGNMENT',
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  actorUserId: string | null;
  entityType: string;
  entityId: string;
  action: AuditAction;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * Create audit log DTO
 */
export interface CreateAuditLogDto {
  actorUserId?: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit log filters
 */
export interface AuditLogFilters {
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  dateFrom?: Date;
  dateTo?: Date;
}
