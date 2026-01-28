'use client';

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Settings,
  LogOut,
  Menu,
  Boxes,
  BarChart3,
  Store,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useT } from '@/hooks/use-t';
import { useAuth } from '@/lib/auth';
import { userRoleLabels } from '@/lib/formatters';
import { cn } from '@/lib/utils';

// Navigation items with translation keys
const navItems = [
  { href: '/dashboard', labelKey: 'admin.dashboard', icon: LayoutDashboard },
  { href: '/dashboard/orders', labelKey: 'navigation.orders', icon: ShoppingCart },
  { href: '/dashboard/inventory', labelKey: 'inventory.title', icon: Boxes },
  { href: '/dashboard/catalog', labelKey: 'products.title', icon: Store },
  { href: '/dashboard/delivery', labelKey: 'delivery.title', icon: Truck },
  { href: '/dashboard/users', labelKey: 'admin.users', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { href: '/dashboard/reports', labelKey: 'reports.title', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { href: '/dashboard/settings', labelKey: 'admin.settings', icon: Settings, roles: ['ADMIN'] },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { hasRole } = useAuth();
  const { t } = useT();

  return (
    <nav className="flex-1 space-y-1">
      {navItems.map((item) => {
        // Check role access
        if (item.roles && !hasRole(...item.roles)) {
          return null;
        }

        const Icon = item.icon;
        const isActive =
          pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const { t } = useT();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  const userInitials =
    user?.fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2) || 'م';

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-l bg-card md:flex">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <Package className="h-7 w-7 text-primary" />
            <span>{t('common.appName')}</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 p-4">
          <NavLinks pathname={pathname} />
        </ScrollArea>
        <Separator />
        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            {t('auth.logout')}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t('common.actions')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <div className="flex h-16 items-center border-b px-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 font-bold text-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  <Package className="h-7 w-7 text-primary" />
                  <span>{t('common.appName')}</span>
                </Link>
              </div>
              <ScrollArea className="h-[calc(100vh-4rem)] p-4">
                <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                <Separator className="my-4" />
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="h-5 w-5" />
                  {t('auth.logout')}
                </Button>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 px-2">
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium">{user?.fullName || 'المستخدم'}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role ? userRoleLabels[user.role] : ''}
                  </p>
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user?.phone}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="ml-2 h-4 w-4" />
                  {t('admin.settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="ml-2 h-4 w-4" />
                {t('auth.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
