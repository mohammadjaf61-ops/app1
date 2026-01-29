'use client';

import {
  Lightbulb,
  Package,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInsights, useInsightsStatus, type Insight } from '@/hooks/use-api';

const insightIcons: Record<Insight['type'], React.ReactNode> = {
  STAGNANT_PRODUCTS: <Package className="h-5 w-5" />,
  PEAK_HOURS: <Clock className="h-5 w-5" />,
  HIGH_CANCELLATION: <AlertTriangle className="h-5 w-5" />,
  LOW_STOCK_VELOCITY: <Package className="h-5 w-5" />,
};

const severityColors: Record<Insight['severity'], string> = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

const severityLabels: Record<Insight['severity'], string> = {
  info: 'معلومات',
  warning: 'تنبيه',
  critical: 'حرج',
};

function InsightCard({ insight }: { insight: Insight }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`border-2 ${severityColors[insight.severity]}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${severityColors[insight.severity]}`}>
              {insightIcons[insight.type]}
            </div>
            <div>
              <CardTitle className="text-lg">{insight.titleAr}</CardTitle>
              <CardDescription className="text-sm mt-1">{insight.summaryAr}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={severityColors[insight.severity]}>
            {severityLabels[insight.severity]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Expandable Explanation */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-right"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span>لماذا؟ (التفسير)</span>
        </button>

        {expanded && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3 text-sm">
            <div>
              <span className="font-medium">السبب: </span>
              <span className="text-muted-foreground">{insight.explanation.reasonAr}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-medium">مصدر البيانات: </span>
                <span className="text-muted-foreground">{insight.explanation.dataSource}</span>
              </div>
              <div>
                <span className="font-medium">فترة التحليل: </span>
                <span className="text-muted-foreground">{insight.explanation.periodDays} يوم</span>
              </div>
            </div>
            <div className="text-xs">
              <span className="font-medium">المنهجية: </span>
              <span className="text-muted-foreground">{insight.explanation.methodology}</span>
            </div>
          </div>
        )}

        {/* Data Preview */}
        {insight.type === 'STAGNANT_PRODUCTS' && insight.data ? (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">أمثلة:</p>
            <div className="space-y-1">
              {(
                (insight.data as { products: Array<{ sku: string; nameAr: string }> }).products ||
                []
              )
                .slice(0, 5)
                .map((product: { sku: string; nameAr: string }, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{product.sku}</span>
                    <span>-</span>
                    <span>{product.nameAr}</span>
                  </div>
                ))}
            </div>
          </div>
        ) : null}

        {insight.type === 'PEAK_HOURS' && insight.data ? (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">ساعات الذروة:</p>
            <div className="flex gap-2">
              {(
                (
                  insight.data as {
                    peakHours: Array<{ hour: number; percentage: number }>;
                  }
                ).peakHours || []
              ).map(
                (peak: { hour: number; percentage: number; orderCount?: number }, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {peak.hour}:00 ({peak.percentage}%)
                  </Badge>
                ),
              )}
            </div>
          </div>
        ) : null}

        {insight.type === 'HIGH_CANCELLATION' && insight.data ? (
          <div className="mt-4">
            <div className="text-sm">
              <span className="font-medium">معدل الإلغاء: </span>
              <span className="text-red-600 font-bold">
                {(insight.data as { cancellationRate: number }).cancellationRate}%
              </span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function InsightsPage() {
  const { data: statusData, isLoading: statusLoading } = useInsightsStatus();
  const { data: insights, isLoading: insightsLoading } = useInsights();

  const isEnabled = statusData?.enabled ?? false;
  const isLoading = statusLoading || insightsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-yellow-500" />
            رؤى تشغيلية
          </h1>
          <p className="text-muted-foreground">
            دعم قرار قائم على البيانات - للقراءة فقط، لا يؤثر على العمليات
          </p>
        </div>
        {!isLoading && (
          <Badge variant={isEnabled ? 'default' : 'secondary'}>
            {isEnabled ? 'مُفعّل' : 'معطّل'}
          </Badge>
        )}
      </div>

      {/* Feature Disabled Notice */}
      {!isLoading && !isEnabled && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-4 py-6">
            <XCircle className="h-8 w-8 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">ميزة الرؤى معطّلة</p>
              <p className="text-sm text-amber-700">
                يمكن تفعيلها من الإعدادات (feature_ai_insights)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      {!isLoading && isEnabled && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-start gap-4 py-4">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">هذه الرؤى للمعلومات فقط</p>
              <p className="text-blue-700">
                الذكاء الاصطناعي يُفسّر ولا يُقرر. كل رؤية مبنية على بيانات فعلية ويمكن تعطيلها.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Insights Grid */}
      {!isLoading && isEnabled && insights && insights.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {/* No Insights */}
      {!isLoading && isEnabled && (!insights || insights.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">لا توجد رؤى حالياً</p>
            <p className="text-sm text-muted-foreground">
              قد يكون هناك بيانات غير كافية أو أن جميع المؤشرات طبيعية
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
