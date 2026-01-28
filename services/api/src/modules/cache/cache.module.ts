import { Global, Module } from '@nestjs/common';

import { CacheService } from './cache.service';

/**
 * Global CacheModule - provides Redis caching across the application
 *
 * Marked as @Global() so it doesn't need to be imported in every module
 */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
