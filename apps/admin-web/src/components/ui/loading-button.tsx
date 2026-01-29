'use client';

import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, loadingText, disabled, children, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={loading || disabled}
        className={cn('min-h-[44px]', className)}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{loadingText || 'جاري المعالجة...'}</span>
          </>
        ) : (
          children
        )}
      </Button>
    );
  },
);
LoadingButton.displayName = 'LoadingButton';
