import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from './config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';
import { Role } from './user/entities/role.entity';
import { Permission } from './user/entities/permission.entity';
import { RedisModule } from './redis/redis.module';
import { EmailModule } from './email/email.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      async useFactory(configService: ConfigService) {
        return {
          logging: true,
          poolSize: 10,
          connectorPackage: 'mysql2',
          synchronize: true,
          type: 'mysql',
          username: configService.get('application.db.username'),
          password: configService.get('application.db.password'),
          host: configService.get('application.db.host'),
          port: configService.get('application.db.port'),
          database: configService.get('application.db.database'),
          entities: [User, Role, Permission],
        };
      },
    }),
    RedisModule,
    EmailModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
