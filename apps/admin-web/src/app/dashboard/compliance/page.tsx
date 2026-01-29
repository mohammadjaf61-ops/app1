'use client';

import { FileCheck, Users, FileText, Shield, RefreshCw, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/hooks/use-t';
import { formatNumber } from '@/lib/formatters';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ConsentStats {
  totalConsents: number;
  uniqueCustomers: number;
  byDocumentType: {
    documentType: string;
    count: number;
  }[];
  recentConsents: {
    date: string;
    count: number;
  }[];
}

// Document type labels in Arabic
const documentTypeLabels: Record<string, string> = {
  TERMS_OF_SERVICE: 'شروط الخدمة',
  PRIVACY_POLICY: 'سياسة الخصوصية',
  RETURN_REFUND: 'سياسة الإرجاع',
};

// Legal documents configuration
const legalDocuments = [
  {
    type: 'TERMS_OF_SERVICE',
    titleAr: 'شروط الخدمة',
    icon: FileText,
    version: '1.0',
    path: '/docs/legal/TERMS_OF_SERVICE.md',
  },
  {
    type: 'PRIVACY_POLICY',
    titleAr: 'سياسة الخصوصية',
    icon: Shield,
    version: '1.0',
    path: '/docs/legal/PRIVACY_POLICY.md',
  },
  {
    type: 'RETURN_REFUND',
    titleAr: 'سياسة الإرجاع والاسترداد',
    icon: RefreshCw,
    version: '1.0',
    path: '/docs/legal/RETURN_REFUND_POLICY.md',
  },
];

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-full bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function CompliancePage() {
  const { t } = useT();
  const [stats, setStats] = useState<ConsentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/consent/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else if (response.status === 401) {
          setError('غير مصرح');
        } else {
          setError('فشل في تحميل البيانات');
        }
      } catch (err) {
        console.error('Failed to fetch consent stats:', err);
        setError('خطأ في الاتصال بالخادم');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Transform data for chart
  const chartData =
    stats?.byDocumentType.map((item) => ({
      name: documentTypeLabels[item.documentType] || item.documentType,
      count: item.count,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('compliance.title')}</h1>
        <p className="text-muted-foreground">إدارة الموافقات والوثائق القانونية</p>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t('compliance.totalConsents')}
          value={formatNumber(stats?.totalConsents ?? 0)}
          description="إجمالي الموافقات المسجلة"
          icon={FileCheck}
          isLoading={isLoading}
        />
        <StatCard
          title={t('compliance.uniqueCustomers')}
          value={formatNumber(stats?.uniqueCustomers ?? 0)}
          description="عدد العملاء الذين وافقوا"
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="نسبة القبول"
          value={
            stats?.uniqueCustomers && stats.byDocumentType.length > 0
              ? `${Math.round((stats.byDocumentType[0].count / stats.uniqueCustomers) * 100)}%`
              : '0%'
          }
          description="نسبة قبول شروط الخدمة"
          icon={Shield}
          isLoading={isLoading}
        />
      </div>

      {/* Charts and Documents */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Consents by Document Type */}
        <Card>
          <CardHeader>
            <CardTitle>{t('compliance.byDocumentType')}</CardTitle>
            <CardDescription>عدد الموافقات لكل نوع وثيقة</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <span className="text-muted-foreground">الموافقات:</span>
                                <span className="font-bold">{payload[0].value}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t('compliance.noConsents')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legal Documents */}
        <Card>
          <CardHeader>
            <CardTitle>{t('compliance.legalDocuments')}</CardTitle>
            <CardDescription>الوثائق القانونية النشطة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {legalDocuments.map((doc) => {
                const Icon = doc.icon;
                return (
                  <div
                    key={doc.type}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.titleAr}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('compliance.version')}: {doc.version}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={doc.path}
                      target="_blank"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <span className="text-sm">{t('compliance.viewDocument')}</span>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Consents Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('compliance.recentConsents')}</CardTitle>
          <CardDescription>الموافقات في آخر 7 أيام</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : stats?.recentConsents && stats.recentConsents.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.recentConsents}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-muted-foreground">الموافقات:</span>
                              <span className="font-bold">{payload[0].value}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              لا توجد بيانات لآخر 7 أيام
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="rounded-full bg-blue-100 p-2 h-fit">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">ملاحظة مهمة</h3>
              <p className="text-sm text-blue-700">
                {t('compliance.consentRequired')}. يتم تسجيل الموافقة مع عنوان IP والوقت وإصدار
                الوثيقة لأغراض الامتثال القانوني.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
