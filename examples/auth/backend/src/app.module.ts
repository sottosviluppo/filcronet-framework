import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FilcronetAuthModule } from '@sottosviluppo/auth-backend';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionAction } from '@sottosviluppo/core';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'mydb',
      autoLoadEntities: true,
      synchronize: true, // Only in development
    }),
    FilcronetAuthModule.forRoot({
      jwt: {
        secret: 'dn874fb3847fb4384f7b3',
        expiresIn: '15m', // Access token expiration
        refreshExpiresIn: '7d', // Refresh token expiration
      },
      passwordReset: {
        expiresIn: '10m', // Password reset token expiration
      },
      invitation: {
        expiresIn: '7d', // New user set password token expiration
      },
      defaultRoles: ['user'], // Default roles for new user
      resources: [
        {
          name: 'users',
          description: 'User management',
        },
        {
          name: 'roles',
          description: 'Role management',
        },
        {
          name: 'products',
          description: 'Product catalog',
          actions: [PermissionAction.CREATE, PermissionAction.DELETE, PermissionAction.READ], // Optional: limit actions
        },
        {
          name: 'orders',
          description: 'Order management',
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
