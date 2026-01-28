import { OrderStatus } from '@hypermarket/shared-types';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ReservationStatus } from '@prisma/client';

import {
  InsufficientStockException,
  PriceChangedException,
  ProductUnavailableException,
} from '@/common/exceptions';
import { PrismaService } from '@/prisma/prisma.service';

import { OrdersService } from './orders.service';

/**
 * Mock PrismaService for testing
 */
const mockPrismaService = {
  $transaction: jest.fn(),
  order: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
  },
  inventoryItem: {
    groupBy: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  inventoryReservation: {
    groupBy: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  setting: {
    findUnique: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
};

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    const validCreateDto = {
      customerName: 'أحمد محمد',
      customerPhone: '07701234567',
      deliveryAddressText: 'بغداد، الكرادة',
      items: [
        { productId: 'product-1', quantity: 2 },
        { productId: 'product-2', quantity: 1 },
      ],
    };

    it('should create order with reservations when inventory is sufficient', async () => {
      const mockProducts = [
        { id: 'product-1', nameAr: 'منتج 1', salePrice: 10000, isActive: true },
        { id: 'product-2', nameAr: 'منتج 2', salePrice: 5000, isActive: true },
      ];

      const mockOrder = {
        id: 'order-1',
        orderNumber: 'HM-20250128-12345',
        status: OrderStatus.PENDING,
        items: [],
        reservations: [
          { id: 'res-1', productId: 'product-1', quantity: 2, status: ReservationStatus.HELD },
          { id: 'res-2', productId: 'product-2', quantity: 1, status: ReservationStatus.HELD },
        ],
      };

      // Mock transaction to execute callback
      prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => {
        const tx = {
          setting: { findUnique: jest.fn().mockResolvedValue({ value: 5000 }) },
          product: { findMany: jest.fn().mockResolvedValue(mockProducts) },
          inventoryItem: {
            groupBy: jest.fn().mockResolvedValue([
              { productId: 'product-1', _sum: { quantity: 10 } },
              { productId: 'product-2', _sum: { quantity: 5 } },
            ]),
          },
          inventoryReservation: {
            groupBy: jest.fn().mockResolvedValue([]),
          },
          order: { create: jest.fn().mockResolvedValue(mockOrder) },
        };
        return callback(tx);
      });

      const result = await service.create(validCreateDto);

      expect(result).toBeDefined();
      expect(result.orderNumber).toBe(mockOrder.orderNumber);
      expect(result.reservations).toHaveLength(2);
    });

    it('should throw InsufficientStockException when inventory is not enough', async () => {
      const mockProducts = [
        { id: 'product-1', nameAr: 'منتج 1', salePrice: 10000, isActive: true },
        { id: 'product-2', nameAr: 'منتج 2', salePrice: 5000, isActive: true },
      ];

      prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => {
        const tx = {
          setting: { findUnique: jest.fn().mockResolvedValue({ value: 5000 }) },
          product: { findMany: jest.fn().mockResolvedValue(mockProducts) },
          inventoryItem: {
            groupBy: jest.fn().mockResolvedValue([
              { productId: 'product-1', _sum: { quantity: 1 } }, // Only 1 available, need 2
              { productId: 'product-2', _sum: { quantity: 5 } },
            ]),
          },
          inventoryReservation: {
            groupBy: jest.fn().mockResolvedValue([]),
          },
        };
        return callback(tx);
      });

      await expect(service.create(validCreateDto)).rejects.toThrow(InsufficientStockException);
    });

    it('should throw PriceChangedException when price differs from expected', async () => {
      const dtoWithPrices = {
        ...validCreateDto,
        items: [
          { productId: 'product-1', quantity: 2, expectedPrice: 8000 }, // Expected 8000 but actual is 10000
        ],
      };

      const mockProducts = [
        { id: 'product-1', nameAr: 'منتج 1', salePrice: 10000, isActive: true },
      ];

      prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => {
        const tx = {
          setting: { findUnique: jest.fn().mockResolvedValue({ value: 5000 }) },
          product: { findMany: jest.fn().mockResolvedValue(mockProducts) },
        };
        return callback(tx);
      });

      await expect(service.create(dtoWithPrices)).rejects.toThrow(PriceChangedException);
    });

    it('should throw ProductUnavailableException when product not found', async () => {
      prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => {
        const tx = {
          setting: { findUnique: jest.fn().mockResolvedValue({ value: 5000 }) },
          product: { findMany: jest.fn().mockResolvedValue([]) }, // No products found
        };
        return callback(tx);
      });

      await expect(service.create(validCreateDto)).rejects.toThrow(ProductUnavailableException);
    });

    it('should account for existing HELD reservations when checking availability', async () => {
      const mockProducts = [
        { id: 'product-1', nameAr: 'منتج 1', salePrice: 10000, isActive: true },
      ];

      prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => {
        const tx = {
          setting: { findUnique: jest.fn().mockResolvedValue({ value: 5000 }) },
          product: { findMany: jest.fn().mockResolvedValue(mockProducts) },
          inventoryItem: {
            groupBy: jest.fn().mockResolvedValue([
              { productId: 'product-1', _sum: { quantity: 5 } }, // 5 in inventory
            ]),
          },
          inventoryReservation: {
            groupBy: jest.fn().mockResolvedValue([
              { productId: 'product-1', _sum: { quantity: 4 } }, // 4 already reserved
            ]),
          },
        };
        return callback(tx);
      });

      // Available = 5 - 4 = 1, but need 2
      const dto = {
        ...validCreateDto,
        items: [{ productId: 'product-1', quantity: 2 }],
      };

      await expect(service.create(dto)).rejects.toThrow(InsufficientStockException);
    });
  });

  describe('cancel', () => {
    it('should release HELD reservations on cancellation', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.PENDING,
        notes: null,
      };

      const mockReservations = [
        { id: 'res-1', productId: 'product-1', quantity: 2, status: ReservationStatus.HELD },
      ];

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => {
        const tx = {
          inventoryReservation: {
            findMany: jest.fn().mockResolvedValue(mockReservations),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          order: {
            update: jest.fn().mockResolvedValue({
              ...mockOrder,
              status: OrderStatus.CANCELLED,
            }),
          },
        };
        return callback(tx);
      });

      const result = await service.cancel('order-1', 'لا أريد الطلب');

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should restore inventory for COMMITTED reservations on cancellation', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.PICKING,
        notes: null,
      };

      const mockReservations = [
        { id: 'res-1', productId: 'product-1', quantity: 2, status: ReservationStatus.COMMITTED },
      ];

      const mockInventoryItem = {
        id: 'inv-1',
        productId: 'product-1',
        quantity: 8,
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const updateCalls: Array<{ id: string; data: { quantity: number } }> = [];

      prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => {
        const tx = {
          inventoryReservation: {
            findMany: jest.fn().mockResolvedValue(mockReservations),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }), // No HELD to release
            update: jest.fn().mockResolvedValue({}),
          },
          inventoryItem: {
            findFirst: jest.fn().mockResolvedValue(mockInventoryItem),
            update: jest.fn().mockImplementation((args: { where: { id: string }; data: { quantity: number } }) => {
              updateCalls.push({ id: args.where.id, data: args.data });
              return Promise.resolve({});
            }),
          },
          order: {
            update: jest.fn().mockResolvedValue({
              ...mockOrder,
              status: OrderStatus.CANCELLED,
            }),
          },
        };
        return callback(tx);
      });

      await service.cancel('order-1', 'إلغاء');

      // Check inventory was restored
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0].data.quantity).toBe(10); // 8 + 2 = 10
    });

    it('should reject cancellation for non-cancellable status', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.DELIVERED,
        notes: null,
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.cancel('order-1', 'test')).rejects.toThrow(BadRequestException);
    });
  });

  describe('race conditions', () => {
    it('should use Serializable isolation level to prevent race conditions', async () => {
      const mockProducts = [
        { id: 'product-1', nameAr: 'منتج 1', salePrice: 10000, isActive: true },
      ];

      const mockOrder = {
        id: 'order-1',
        orderNumber: 'HM-20250128-12345',
        status: OrderStatus.PENDING,
        items: [],
        reservations: [],
      };

      prisma.$transaction.mockImplementation(
        (callback: (tx: unknown) => unknown, options: { isolationLevel?: string }) => {
          // Verify isolation level is set
          expect(options.isolationLevel).toBe('Serializable');

          const tx = {
            setting: { findUnique: jest.fn().mockResolvedValue({ value: 5000 }) },
            product: { findMany: jest.fn().mockResolvedValue(mockProducts) },
            inventoryItem: {
              groupBy: jest
                .fn()
                .mockResolvedValue([{ productId: 'product-1', _sum: { quantity: 10 } }]),
            },
            inventoryReservation: {
              groupBy: jest.fn().mockResolvedValue([]),
            },
            order: { create: jest.fn().mockResolvedValue(mockOrder) },
          };
          return callback(tx);
        },
      );

      await service.create({
        customerName: 'test',
        customerPhone: '07701234567',
        deliveryAddressText: 'test',
        items: [{ productId: 'product-1', quantity: 1 }],
      });

      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: 'Serializable',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return order when found', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'HM-20250128-12345',
        status: OrderStatus.PENDING,
        items: [],
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findById('order-1');

      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
