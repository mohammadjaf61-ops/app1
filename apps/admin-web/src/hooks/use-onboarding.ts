'use client';

import { useState, useEffect, useCallback } from 'react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
}

const ONBOARDING_STORAGE_KEY = 'hypermarket_onboarding';

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: 'delivery_zone',
    title: 'إضافة منطقة توصيل',
    description: 'حدد مناطق التوصيل وأسعارها',
    href: '/dashboard/delivery?setup=zone',
    completed: false,
  },
  {
    id: 'first_product',
    title: 'إضافة أول منتج',
    description: 'أضف منتجاً واحداً على الأقل للبدء',
    href: '/dashboard/catalog?setup=product',
    completed: false,
  },
  {
    id: 'store_status',
    title: 'تفعيل المتجر',
    description: 'افتح متجرك لاستقبال الطلبات',
    href: '/dashboard/settings',
    completed: false,
  },
  {
    id: 'preview',
    title: 'معاينة حالة النظام',
    description: 'تأكد من أن النظام يعمل بشكل صحيح',
    href: '/dashboard/status',
    completed: false,
  },
];

interface OnboardingState {
  steps: OnboardingStep[];
  dismissed: boolean;
}

function loadOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') {
    return { steps: DEFAULT_STEPS, dismissed: false };
  }

  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }

  return { steps: DEFAULT_STEPS, dismissed: false };
}

function saveOnboardingState(state: OnboardingState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(() => loadOnboardingState());

  // Load from localStorage on mount
  useEffect(() => {
    setState(loadOnboardingState());
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    saveOnboardingState(state);
  }, [state]);

  const completeStep = useCallback((stepId: string) => {
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId ? { ...step, completed: true } : step,
      ),
    }));
  }, []);

  const dismissOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, dismissed: true }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState({ steps: DEFAULT_STEPS, dismissed: false });
  }, []);

  const completedCount = state.steps.filter((s) => s.completed).length;
  const totalCount = state.steps.length;
  const progress = Math.round((completedCount / totalCount) * 100);
  const isComplete = completedCount === totalCount;
  const currentStep = state.steps.find((s) => !s.completed);

  return {
    steps: state.steps,
    dismissed: state.dismissed,
    completeStep,
    dismissOnboarding,
    resetOnboarding,
    completedCount,
    totalCount,
    progress,
    isComplete,
    currentStep,
    showOnboarding: !state.dismissed && !isComplete,
  };
}
