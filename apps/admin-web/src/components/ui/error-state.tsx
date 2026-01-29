'use client';

import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  severity?: ErrorSeverity;
  onRetry?: () => void;
  retryLabel?: string;
  showIcon?: boolean;
}

const severityStyles: Record<
  ErrorSeverity,
  { icon: typeof AlertCircle; color: string; bg: string }
> = {
  error: {
    icon: XCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  info: {
    icon: AlertCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
};

export function ErrorState({
  title,
  message,
  severity = 'error',
  onRetry,
  retryLabel = 'إعادة المحاولة',
  showIcon = true,
  className,
  ...props
}: ErrorStateProps) {
  const styles = severityStyles[severity];
  const Icon = styles.icon;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border p-6 text-center',
        styles.bg,
        className,
      )}
      {...props}
    >
      {showIcon && (
        <div className={cn('mb-4', styles.color)} aria-hidden="true">
          <Icon className="h-12 w-12" />
        </div>
      )}
      {title && <h3 className={cn('text-lg font-semibold', styles.color)}>{title}</h3>}
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="mt-4 min-h-[44px] min-w-[120px]"
          size="default"
        >
          <RefreshCw className="ml-2 h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export interface ErrorBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  onDismiss?: () => void;
  severity?: ErrorSeverity;
}

export function ErrorBanner({
  message,
  onDismiss,
  severity = 'error',
  className,
  ...props
}: ErrorBannerProps) {
  const styles = severityStyles[severity];
  const Icon = styles.icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn('flex items-center gap-3 rounded-lg border px-4 py-3', styles.bg, className)}
      {...props}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', styles.color)} aria-hidden="true" />
      <p className="flex-1 text-sm">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="min-h-[44px] min-w-[44px] rounded-md p-2 hover:bg-black/5"
          aria-label="إغلاق"
        >
          <XCircle className="h-5 w-5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
