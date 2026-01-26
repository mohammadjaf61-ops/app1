import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AggregationService {
  private readonly logger = new Logger(AggregationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compute daily sales aggregation for a specific date
   */
  async computeDailySales(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    this.logger.log(`Computing daily sales for ${startOfDay.toISOString()}`);

    // Get order aggregations
    const orderStats = await this.prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
      },
      _count: true,
      _sum: { totalAmountIqd: true },
    });

    // Get item count
    const itemStats = await this.prisma.orderItem.aggregate({
      where: {
        order: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: { not: 'CANCELLED' },
        },
      },
      _count: true,
    });

    // Get unique customers
    const uniqueCustomers = await this.prisma.order.groupBy({
      by: ['customerPhone'],
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
      },
    });

    // Get refund stats
    const refundStats = await this.prisma.refund.aggregate({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      _count: true,
      _sum: { amountIqd: true },
    });

    const totalRevenue = BigInt(orderStats._sum.totalAmountIqd || 0);
    const orderCount = orderStats._count;
    const avgOrderValue = orderCount > 0 ? Number(totalRevenue) / orderCount : 0;

    // Upsert daily report
    await this.prisma.dailySalesReport.upsert({
      where: { reportDate: startOfDay },
      create: {
        reportDate: startOfDay,
        totalRevenue,
        orderCount,
        itemCount: itemStats._count,
        avgOrderValue: Math.round(avgOrderValue),
        uniqueCustomers: uniqueCustomers.length,
        refundCount: refundStats._count,
        refundAmount: BigInt(refundStats._sum.amountIqd || 0),
      },
      update: {
        totalRevenue,
        orderCount,
        itemCount: itemStats._count,
        avgOrderValue: Math.round(avgOrderValue),
        uniqueCustomers: uniqueCustomers.length,
        refundCount: refundStats._count,
        refundAmount: BigInt(refundStats._sum.amountIqd || 0),
        computedAt: new Date(),
      },
    });

    this.logger.log(`Daily sales computed: ${orderCount} orders, ${totalRevenue} IQD`);
    return orderCount;
  }

  /**
   * Compute category-level daily sales
   */
  async computeCategorySales(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get category sales using raw query for efficiency
    const categorySales = await this.prisma.$queryRaw<
      Array<{
        category_id: string;
        category_name: string;
        revenue: bigint;
        item_count: bigint;
        order_count: bigint;
      }>
    >`
      SELECT
        c.id as category_id,
        c.name_ar as category_name,
        SUM(oi.quantity * oi.unit_price_iqd)::BIGINT as revenue,
        SUM(oi.quantity)::BIGINT as item_count,
        COUNT(DISTINCT o.id)::BIGINT as order_count
      FROM "order" o
      JOIN order_item oi ON o.id = oi.order_id
      JOIN product p ON oi.product_id = p.id
      JOIN category c ON p.category_id = c.id
      WHERE o.created_at >= ${startOfDay}
        AND o.created_at <= ${endOfDay}
        AND o.status != 'CANCELLED'
      GROUP BY c.id, c.name_ar
    `;

    // Upsert each category's data
    for (const cat of categorySales) {
      await this.prisma.categoryDailySales.upsert({
        where: {
          reportDate_categoryId: {
            reportDate: startOfDay,
            categoryId: cat.category_id,
          },
        },
        create: {
          reportDate: startOfDay,
          categoryId: cat.category_id,
          categoryName: cat.category_name,
          revenue: cat.revenue,
          itemCount: Number(cat.item_count),
          orderCount: Number(cat.order_count),
        },
        update: {
          categoryName: cat.category_name,
          revenue: cat.revenue,
          itemCount: Number(cat.item_count),
          orderCount: Number(cat.order_count),
          computedAt: new Date(),
        },
      });
    }

    this.logger.log(`Category sales computed for ${categorySales.length} categories`);
    return categorySales.length;
  }

  /**
   * Compute product-level analytics
   */
  async computeProductAnalytics(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get product sales
    const productSales = await this.prisma.$queryRaw<
      Array<{
        product_id: string;
        sku: string;
        product_name: string;
        quantity_sold: bigint;
        revenue: bigint;
        order_count: bigint;
        avg_qty: number;
        stock_level: bigint;
      }>
    >`
      SELECT
        p.id as product_id,
        p.sku,
        p.name_ar as product_name,
        COALESCE(SUM(oi.quantity), 0)::BIGINT as quantity_sold,
        COALESCE(SUM(oi.quantity * oi.unit_price_iqd), 0)::BIGINT as revenue,
        COUNT(DISTINCT o.id)::BIGINT as order_count,
        CASE WHEN COUNT(DISTINCT o.id) > 0
          THEN SUM(oi.quantity)::FLOAT / COUNT(DISTINCT o.id)
          ELSE 0
        END as avg_qty,
        COALESCE((SELECT SUM(quantity) FROM inventory_item WHERE product_id = p.id), 0)::BIGINT as stock_level
      FROM product p
      LEFT JOIN order_item oi ON p.id = oi.product_id
      LEFT JOIN "order" o ON oi.order_id = o.id
        AND o.created_at >= ${startOfDay}
        AND o.created_at <= ${endOfDay}
        AND o.status != 'CANCELLED'
      WHERE p.is_active = true AND p.deleted_at IS NULL
      GROUP BY p.id, p.sku, p.name_ar
    `;

    // Compute days of stock for each product
    const sevenDaysAgo = new Date(date);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const prod of productSales) {
      // Calculate 7-day average daily sales
      const recentSales = await this.prisma.$queryRaw<[{ avg_daily: number }]>`
        SELECT COALESCE(SUM(oi.quantity)::FLOAT / 7, 0) as avg_daily
        FROM order_item oi
        JOIN "order" o ON oi.order_id = o.id
        WHERE oi.product_id = ${prod.product_id}
          AND o.created_at >= ${sevenDaysAgo}
          AND o.status != 'CANCELLED'
      `;

      const avgDailySales = recentSales[0]?.avg_daily || 0;
      const daysOfStock = avgDailySales > 0
        ? Number(prod.stock_level) / avgDailySales
        : null;

      await this.prisma.productAnalytics.upsert({
        where: {
          reportDate_productId: {
            reportDate: startOfDay,
            productId: prod.product_id,
          },
        },
        create: {
          reportDate: startOfDay,
          productId: prod.product_id,
          sku: prod.sku,
          productName: prod.product_name,
          quantitySold: Number(prod.quantity_sold),
          revenue: prod.revenue,
          orderCount: Number(prod.order_count),
          avgQuantityPerOrder: prod.avg_qty,
          stockLevel: Number(prod.stock_level),
          daysOfStock,
        },
        update: {
          quantitySold: Number(prod.quantity_sold),
          revenue: prod.revenue,
          orderCount: Number(prod.order_count),
          avgQuantityPerOrder: prod.avg_qty,
          stockLevel: Number(prod.stock_level),
          daysOfStock,
          computedAt: new Date(),
        },
      });
    }

    this.logger.log(`Product analytics computed for ${productSales.length} products`);
    return productSales.length;
  }

  /**
   * Refresh materialized views (call from PostgreSQL)
   */
  async refreshMaterializedViews(): Promise<void> {
    this.logger.log('Refreshing materialized views');
    try {
      await this.prisma.$executeRaw`SELECT refresh_analytics_views()`;
      this.logger.log('Materialized views refreshed successfully');
    } catch (error) {
      this.logger.warn('Could not refresh materialized views (may not exist yet)');
    }
  }
}
