import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { ProductsModule } from '../products/products.module';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderEventsProcessor } from './processors/order-events.processor';
import { ORDER_EVENTS_QUEUE } from './queues/order-events.constants';

@Module({
  imports: [
    ProductsModule,
    BullModule.registerQueue({
      name: ORDER_EVENTS_QUEUE,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderEventsProcessor],
  exports: [OrdersService],
})
export class OrdersModule {}
