'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingButton } from '@/components/ui/loading-button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  onConfirm,
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const isProcessing = loading || isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="min-h-[44px]"
          >
            {cancelLabel}
          </Button>
          <LoadingButton
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            loading={isProcessing}
            className="min-h-[44px]"
          >
            {confirmLabel}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
    variant?: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'default',
  });

  const confirm = React.useCallback(
    (options: {
      title: string;
      description: string;
      onConfirm: () => void | Promise<void>;
      variant?: 'default' | 'destructive';
    }) => {
      setDialogState({
        open: true,
        ...options,
      });
    },
    [],
  );

  const dialogProps = {
    ...dialogState,
    onOpenChange: (open: boolean) => setDialogState((prev) => ({ ...prev, open })),
  };

  return { confirm, dialogProps };
}
