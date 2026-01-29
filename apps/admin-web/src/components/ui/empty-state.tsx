'use client';

import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        'flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center',
        className,
      )}
      {...props}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full bg-muted"
        aria-hidden="true"
      >
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6 min-h-[44px] min-w-[120px]" size="default">
          {ActionIcon && <ActionIcon className="ml-2 h-4 w-4" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export interface EmptyStateInlineProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  icon?: LucideIcon;
}

export function EmptyStateInline({
  message,
  icon: Icon,
  className,
  ...props
}: EmptyStateInlineProps) {
  return (
    <div
      role="status"
      className={cn('flex items-center justify-center gap-2 py-8 text-muted-foreground', className)}
      {...props}
    >
      {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
      <span>{message}</span>
    </div>
  );
}
