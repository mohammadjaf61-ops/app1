import { Injectable } from '@nestjs/common';

import { CacheService, CACHE_KEYS, CACHE_TTL } from '@/modules/cache';
import { PrismaService } from '@/prisma/prisma.service';

export interface AdminKPIs {
  totalOrdersToday: number;
  revenueToday: number;
  pendingOrders: number;
  outOfStockCount: number;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Get real-time KPIs for admin dashboard
   * Cached for 60 seconds to reduce database load while staying current
   */
  async getKPIs(): Promise<AdminKPIs> {
    const cacheKey = CACHE_KEYS.ADMIN_KPIS;

    // Try cache first (short TTL for near real-time data)
    const cached = await this.cacheService.get<AdminKPIs>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Execute all queries in parallel for performance
    const [ordersToday, pendingOrders, outOfStockItems] = await Promise.all([
      // Orders created today with revenue
      this.prisma.order.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        select: {
          totalAmountIqd: true,
          status: true,
        },
      }),

      // Pending orders count
      this.prisma.order.count({
        where: {
          status: 'PENDING',
        },
      }),

      // Out of stock products (inventory quantity = 0 or no inventory)
      this.prisma.product.count({
        where: {
          deletedAt: null,
          isActive: true,
          OR: [
            {
              inventoryItems: {
                none: {},
              },
            },
            {
              inventoryItems: {
                every: {
                  quantity: 0,
                },
              },
            },
          ],
        },
      }),
    ]);

    // Calculate today's totals
    const totalOrdersToday = ordersToday.length;
    const revenueToday = ordersToday.reduce(
      (sum: number, order: { totalAmountIqd: number }) => sum + order.totalAmountIqd,
      0,
    );

    const kpis: AdminKPIs = {
      totalOrdersToday,
      revenueToday,
      pendingOrders,
      outOfStockCount: outOfStockItems,
    };

    // Cache for 60 seconds
    await this.cacheService.set(cacheKey, kpis, CACHE_TTL.ADMIN_KPIS);

    return kpis;
  }
}
