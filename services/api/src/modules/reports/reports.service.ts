import { OrderStatus, DeliveryStatus } from '@hypermarket/shared-types';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get inventory status report - low stock and out of stock
   * Uses database aggregation for performance
   */
  async getInventoryStatus() {
    // Get products with their total inventory
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        sku: true,
        nameAr: true,
        nameEn: true,
        lowStockThreshold: true,
        category: {
          select: { id: true, nameAr: true },
        },
        inventoryItems: {
          select: {
            quantity: true,
            location: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const outOfStock: Array<{
      id: string;
      sku: string;
      nameAr: string;
      nameEn: string | null;
      category: { id: string; nameAr: string } | null;
      totalQuantity: number;
      threshold: number;
    }> = [];

    const lowStock: Array<{
      id: string;
      sku: string;
      nameAr: string;
      nameEn: string | null;
      category: { id: string; nameAr: string } | null;
      totalQuantity: number;
      threshold: number;
    }> = [];

    for (const product of products) {
      const totalQuantity = product.inventoryItems.reduce(
        (sum: number, item: { quantity: number }) => sum + item.quantity,
        0,
      );
      const threshold = product.lowStockThreshold || 10;

      const productInfo = {
        id: product.id,
        sku: product.sku,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        category: product.category,
        totalQuantity,
        threshold,
      };

      if (totalQuantity === 0) {
        outOfStock.push(productInfo);
      } else if (totalQuantity <= threshold) {
        lowStock.push(productInfo);
      }
    }

    // Sort by quantity (ascending) so most critical items appear first
    outOfStock.sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));
    lowStock.sort((a, b) => a.totalQuantity - b.totalQuantity);

    return {
      summary: {
        totalProducts: products.length,
        outOfStockCount: outOfStock.length,
        lowStockCount: lowStock.length,
        healthyCount: products.length - outOfStock.length - lowStock.length,
      },
      outOfStock,
      lowStock,
    };
  }

  /**
   * Get top selling products by quantity or revenue
   * Includes both DELIVERED (online) and COMPLETED (POS) orders
   */
  async getTopProducts(params: {
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: 'quantity' | 'revenue';
    limit?: number;
  }) {
    const { dateFrom, dateTo, sortBy = 'revenue', limit = 10 } = params;

    // Build date filter - use createdAt for both order types
    const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.gte = dateFrom;
      if (dateTo) dateFilter.createdAt.lte = dateTo;
    }

    // Get order items from both DELIVERED and COMPLETED (POS) orders
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          ...dateFilter,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
        },
      },
      select: {
        productId: true,
        quantity: true,
        subtotal: true,
        product: {
          select: {
            id: true,
            sku: true,
            nameAr: true,
            salePrice: true,
            category: { select: { id: true, nameAr: true } },
          },
        },
      },
    });

    // Aggregate by product
    const productMap = new Map<
      string,
      {
        product: {
          id: string;
          sku: string;
          nameAr: string;
          salePrice: number;
          category: { id: string; nameAr: string } | null;
        };
        totalQuantity: number;
        totalRevenue: number;
      }
    >();

    for (const item of orderItems) {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.subtotal;
      } else {
        productMap.set(item.productId, {
          product: item.product,
          totalQuantity: item.quantity,
          totalRevenue: item.subtotal,
        });
      }
    }

    // Sort and limit
    const sorted = Array.from(productMap.values()).sort((a, b) =>
      sortBy === 'quantity' ? b.totalQuantity - a.totalQuantity : b.totalRevenue - a.totalRevenue,
    );

    return sorted.slice(0, limit).map((item, index) => ({
      rank: index + 1,
      product: item.product,
      totalQuantity: item.totalQuantity,
      totalRevenue: item.totalRevenue,
    }));
  }

  /**
   * Get sales summary report
   * Includes both DELIVERED (online) and COMPLETED (POS) orders
   */
  async getSalesSummary(params: { dateFrom?: Date; dateTo?: Date; categoryId?: string }) {
    const { dateFrom, dateTo, categoryId } = params;

    // Include both completed delivery orders and POS orders
    const orderWhere: {
      status: { in: OrderStatus[] };
      createdAt?: { gte?: Date; lte?: Date };
    } = {
      status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
    };

    if (dateFrom || dateTo) {
      orderWhere.createdAt = {};
      if (dateFrom) {
        orderWhere.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        orderWhere.createdAt.lte = dateTo;
      }
    }

    // Get orders with items
    const orders = await this.prisma.order.findMany({
      where: orderWhere,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                nameAr: true,
                categoryId: true,
                category: { select: { id: true, nameAr: true } },
              },
            },
          },
        },
      },
    });

    // Filter by category if specified
    type OrderWithItems = (typeof orders)[number];
    type OrderItem = OrderWithItems['items'][number];
    let filteredOrders: OrderWithItems[] = orders;
    if (categoryId) {
      filteredOrders = orders
        .map((order: OrderWithItems) => ({
          ...order,
          items: order.items.filter((item: OrderItem) => item.product.categoryId === categoryId),
        }))
        .filter((order: OrderWithItems) => order.items.length > 0);
    }

    // Calculate totals
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce(
      (sum: number, order: OrderWithItems) => sum + order.total,
      0,
    );
    const totalItems = filteredOrders.reduce(
      (sum: number, order: OrderWithItems) =>
        sum + order.items.reduce((s: number, item: OrderItem) => s + item.quantity, 0),
      0,
    );

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Get top selling products
    const productSales: Record<string, { product: unknown; quantity: number; revenue: number }> =
      {};
    for (const order of filteredOrders) {
      for (const item of order.items) {
        const key = item.productId;
        if (!productSales[key]) {
          productSales[key] = {
            product: item.product,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += item.subtotal;
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Sales by category
    const categorySales: Record<string, { category: unknown; quantity: number; revenue: number }> =
      {};
    for (const order of filteredOrders) {
      for (const item of order.items) {
        const key = item.product.categoryId;
        if (!categorySales[key]) {
          categorySales[key] = {
            category: item.product.category,
            quantity: 0,
            revenue: 0,
          };
        }
        categorySales[key].quantity += item.quantity;
        categorySales[key].revenue += item.subtotal;
      }
    }

    const salesByCategory = Object.values(categorySales).sort((a, b) => b.revenue - a.revenue);

    return {
      summary: {
        totalOrders,
        totalRevenue,
        totalItems,
        averageOrderValue,
      },
      topProducts,
      salesByCategory,
    };
  }

  /**
   * Get daily sales report
   */
  async getDailySales(params: { dateFrom: Date; dateTo: Date }) {
    const { dateFrom, dateTo } = params;

    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.DELIVERED,
        deliveredAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      select: {
        id: true,
        total: true,
        deliveredAt: true,
      },
    });

    // Group by date
    const dailySales: Record<string, { date: string; orders: number; revenue: number }> = {};
    for (const order of orders) {
      if (!order.deliveredAt) {
        continue;
      }
      const dateKey = order.deliveredAt.toISOString().split('T')[0];
      if (!dailySales[dateKey]) {
        dailySales[dateKey] = { date: dateKey, orders: 0, revenue: 0 };
      }
      dailySales[dateKey].orders += 1;
      dailySales[dateKey].revenue += order.total;
    }

    return Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get stock aging report
   */
  async getStockAging() {
    const now = new Date();

    // Get all inventory items with expiry dates
    const inventory = await this.prisma.inventoryItem.findMany({
      where: {
        quantity: { gt: 0 },
        expiryDate: { not: null },
      },
      include: {
        product: {
          select: { id: true, sku: true, nameAr: true },
        },
        location: {
          select: { id: true, name: true },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    // Categorize by expiry
    const expired: typeof inventory = [];
    const critical: typeof inventory = []; // Within 7 days
    const warning: typeof inventory = []; // Within 30 days
    const good: typeof inventory = []; // More than 30 days

    for (const item of inventory) {
      if (!item.expiryDate) {
        continue;
      }

      const daysUntilExpiry = Math.floor(
        (item.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilExpiry < 0) {
        expired.push(item);
      } else if (daysUntilExpiry <= 7) {
        critical.push(item);
      } else if (daysUntilExpiry <= 30) {
        warning.push(item);
      } else {
        good.push(item);
      }
    }

    return {
      summary: {
        expired: expired.length,
        critical: critical.length,
        warning: warning.length,
        good: good.length,
        total: inventory.length,
      },
      expired,
      critical,
      warning,
    };
  }

  /**
   * Get department/category performance report
   */
  async getCategoryPerformance(params: { dateFrom?: Date; dateTo?: Date }) {
    const { dateFrom, dateTo } = params;

    const orderWhere: { status: OrderStatus; deliveredAt?: { gte?: Date; lte?: Date } } = {
      status: OrderStatus.DELIVERED,
    };

    if (dateFrom || dateTo) {
      orderWhere.deliveredAt = {};
      if (dateFrom) {
        orderWhere.deliveredAt.gte = dateFrom;
      }
      if (dateTo) {
        orderWhere.deliveredAt.lte = dateTo;
      }
    }

    // Get all categories (for reference) - currently unused but kept for future use
    await this.prisma.category.findMany({
      where: { parentId: null }, // Top-level categories only
      select: { id: true, nameAr: true },
    });

    // Get order items with category info
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: orderWhere,
      },
      include: {
        product: {
          select: {
            categoryId: true,
            category: {
              select: {
                id: true,
                nameAr: true,
                parentId: true,
                parent: { select: { id: true, nameAr: true } },
              },
            },
          },
        },
      },
    });

    // Calculate performance per category
    const categoryPerformance: Record<
      string,
      {
        category: { id: string; nameAr: string };
        totalItems: number;
        totalRevenue: number;
        uniqueProducts: Set<string>;
      }
    > = {};

    for (const item of orderItems) {
      // Get root category
      const rootCategory = item.product.category?.parent || item.product.category;
      if (!rootCategory) {
        continue;
      }

      const key = rootCategory.id;
      if (!categoryPerformance[key]) {
        categoryPerformance[key] = {
          category: { id: rootCategory.id, nameAr: rootCategory.nameAr },
          totalItems: 0,
          totalRevenue: 0,
          uniqueProducts: new Set(),
        };
      }

      categoryPerformance[key].totalItems += item.quantity;
      categoryPerformance[key].totalRevenue += item.subtotal;
      categoryPerformance[key].uniqueProducts.add(item.productId);
    }

    // Convert to array and calculate percentages
    const totalRevenue = Object.values(categoryPerformance).reduce(
      (sum, cat) => sum + cat.totalRevenue,
      0,
    );

    const results = Object.values(categoryPerformance)
      .map((cat) => ({
        category: cat.category,
        totalItems: cat.totalItems,
        totalRevenue: cat.totalRevenue,
        uniqueProducts: cat.uniqueProducts.size,
        revenuePercentage:
          totalRevenue > 0 ? ((cat.totalRevenue / totalRevenue) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      totalRevenue,
      categories: results,
    };
  }

  /**
   * Get driver performance report
   */
  async getDriverPerformance(params: { dateFrom?: Date; dateTo?: Date }) {
    const { dateFrom, dateTo } = params;

    const deliveryWhere: { assignedAt?: { gte?: Date; lte?: Date } } = {};

    if (dateFrom || dateTo) {
      deliveryWhere.assignedAt = {};
      if (dateFrom) {
        deliveryWhere.assignedAt.gte = dateFrom;
      }
      if (dateTo) {
        deliveryWhere.assignedAt.lte = dateTo;
      }
    }

    // Get all drivers
    const drivers = await this.prisma.user.findMany({
      where: { role: 'DRIVER', isActive: true },
      select: { id: true, fullName: true, phone: true },
    });

    // Get delivery assignments
    const deliveries = await this.prisma.deliveryAssignment.findMany({
      where: deliveryWhere,
      select: {
        id: true,
        driverId: true,
        status: true,
        collectedAmount: true,
        assignedAt: true,
        deliveredAt: true,
      },
    });

    // Calculate per-driver performance
    const driverStats: Record<
      string,
      {
        driver: { id: string; fullName: string; phone: string };
        total: number;
        delivered: number;
        failed: number;
        inProgress: number;
        totalCollected: number;
        avgDeliveryTime: number[];
      }
    > = {};

    for (const driver of drivers) {
      driverStats[driver.id] = {
        driver,
        total: 0,
        delivered: 0,
        failed: 0,
        inProgress: 0,
        totalCollected: 0,
        avgDeliveryTime: [],
      };
    }

    for (const delivery of deliveries) {
      const stats = driverStats[delivery.driverId];
      if (!stats) {
        continue;
      }

      stats.total += 1;

      if (delivery.status === DeliveryStatus.DELIVERED) {
        stats.delivered += 1;
        stats.totalCollected += delivery.collectedAmount || 0;

        // Calculate delivery time
        if (delivery.assignedAt && delivery.deliveredAt) {
          const deliveryTimeMinutes = Math.floor(
            (delivery.deliveredAt.getTime() - delivery.assignedAt.getTime()) / (1000 * 60),
          );
          stats.avgDeliveryTime.push(deliveryTimeMinutes);
        }
      } else if (delivery.status === DeliveryStatus.FAILED) {
        stats.failed += 1;
      } else {
        stats.inProgress += 1;
      }
    }

    // Convert to results
    return Object.values(driverStats)
      .map((stats) => ({
        driver: stats.driver,
        total: stats.total,
        delivered: stats.delivered,
        failed: stats.failed,
        inProgress: stats.inProgress,
        totalCollected: stats.totalCollected,
        successRate: stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : '0',
        avgDeliveryTimeMinutes:
          stats.avgDeliveryTime.length > 0
            ? Math.round(
                stats.avgDeliveryTime.reduce((a, b) => a + b, 0) / stats.avgDeliveryTime.length,
              )
            : null,
      }))
      .filter((d) => d.total > 0)
      .sort((a, b) => b.delivered - a.delivered);
  }

  /**
   * Get picker performance report
   */
  async getPickerPerformance(params: { dateFrom?: Date; dateTo?: Date }) {
    const { dateFrom, dateTo } = params;

    const orderWhere: { pickerId: { not: null }; createdAt?: { gte?: Date; lte?: Date } } = {
      pickerId: { not: null },
    };

    if (dateFrom || dateTo) {
      orderWhere.createdAt = {};
      if (dateFrom) {
        orderWhere.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        orderWhere.createdAt.lte = dateTo;
      }
    }

    // Get all pickers
    const pickers = await this.prisma.user.findMany({
      where: { role: 'PICKER', isActive: true },
      select: { id: true, fullName: true, phone: true },
    });

    // Get orders with picker info
    const orders = await this.prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        pickerId: true,
        status: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    });

    // Calculate per-picker performance
    const pickerStats: Record<
      string,
      {
        picker: { id: string; fullName: string; phone: string };
        total: number;
        completed: number;
        totalItems: number;
      }
    > = {};

    for (const picker of pickers) {
      pickerStats[picker.id] = {
        picker,
        total: 0,
        completed: 0,
        totalItems: 0,
      };
    }

    const completedStatuses = [
      OrderStatus.READY,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ];

    for (const order of orders) {
      if (!order.pickerId) {
        continue;
      }
      const stats = pickerStats[order.pickerId];
      if (!stats) {
        continue;
      }

      stats.total += 1;
      stats.totalItems += order._count.items;

      if (completedStatuses.includes(order.status as OrderStatus)) {
        stats.completed += 1;
      }
    }

    // Convert to results
    return Object.values(pickerStats)
      .map((stats) => ({
        picker: stats.picker,
        total: stats.total,
        completed: stats.completed,
        totalItems: stats.totalItems,
        completionRate: stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0',
      }))
      .filter((p) => p.total > 0)
      .sort((a, b) => b.completed - a.completed);
  }

  /**
   * Get combined sales report with breakdown by order type
   * Provides operational overview for store owner
   */
  async getSalesReport(params: { dateFrom?: Date; dateTo?: Date }) {
    const { dateFrom, dateTo } = params;

    // Build date filter
    const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.gte = dateFrom;
      if (dateTo) dateFilter.createdAt.lte = dateTo;
    }

    // Get completed orders (both delivery and POS)
    const orders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
      },
      select: {
        id: true,
        orderNumber: true,
        orderType: true,
        totalAmountIqd: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    });

    // Calculate totals
    let totalRevenue = 0;
    let deliveryRevenue = 0;
    let posRevenue = 0;
    let deliveryOrders = 0;
    let posOrders = 0;

    for (const order of orders) {
      totalRevenue += order.totalAmountIqd;
      if (order.orderType === 'POS') {
        posRevenue += order.totalAmountIqd;
        posOrders += 1;
      } else {
        deliveryRevenue += order.totalAmountIqd;
        deliveryOrders += 1;
      }
    }

    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        deliveryOrders,
        deliveryRevenue,
        posOrders,
        posRevenue,
      },
      dateRange: {
        from: dateFrom?.toISOString() || null,
        to: dateTo?.toISOString() || null,
      },
    };
  }
}
