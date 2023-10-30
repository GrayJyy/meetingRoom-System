import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      async useFactory(configService: ConfigService) {
        const _client = createClient({
          socket: {
            host: configService.get('application.redis.host'),
            port: configService.get('application.redis.port'),
          },
          database: 1,
        });
        await _client.connect();
        return _client;
      },
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
