'use client';

import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  X,
  Rocket,
  MapPin,
  Package,
  Store,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useOnboarding, OnboardingStep } from '@/hooks/use-onboarding';

const STEP_ICONS: Record<string, typeof MapPin> = {
  delivery_zone: MapPin,
  first_product: Package,
  store_status: Store,
  preview: Eye,
};

function StepItem({ step, isNext }: { step: OnboardingStep; isNext: boolean }) {
  const Icon = STEP_ICONS[step.id] || Circle;

  return (
    <Link
      href={step.href}
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        step.completed
          ? 'bg-green-50 border border-green-200'
          : isNext
            ? 'bg-primary/5 border border-primary/20 hover:bg-primary/10'
            : 'bg-muted/50 border border-transparent hover:bg-muted'
      }`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          step.completed
            ? 'bg-green-500 text-white'
            : isNext
              ? 'bg-primary text-white'
              : 'bg-muted-foreground/20 text-muted-foreground'
        }`}
      >
        {step.completed ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`font-medium ${
            step.completed
              ? 'text-green-700 line-through'
              : isNext
                ? 'text-primary'
                : 'text-muted-foreground'
          }`}
        >
          {step.title}
        </p>
        <p className="text-sm text-muted-foreground truncate">{step.description}</p>
      </div>

      {!step.completed && (
        <ChevronLeft className={`h-5 w-5 ${isNext ? 'text-primary' : 'text-muted-foreground'}`} />
      )}
    </Link>
  );
}

export function OnboardingChecklist() {
  const { steps, progress, dismissOnboarding, showOnboarding, currentStep, isComplete } =
    useOnboarding();

  if (!showOnboarding) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">ابدأ متجرك في دقائق</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                أكمل هذه الخطوات لتفعيل متجرك
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={dismissOnboarding}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">التقدم</span>
            <span className="font-medium text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {steps.map((step) => (
          <StepItem key={step.id} step={step} isNext={currentStep?.id === step.id} />
        ))}

        {isComplete && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-green-700">مبروك! متجرك جاهز للعمل</p>
            <p className="text-sm text-green-600 mt-1">يمكنك الآن استقبال الطلبات</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
