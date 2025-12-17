import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FilcronetAuthModule,
  JwtAuthGuard,
  PermissionsGuard,
} from '@sottosviluppo/auth-backend';
import { EmailModule } from './email.module';
import { FilcronetFileManagerModule } from '@sottosviluppo/file-manager-backend';

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
      synchronize: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
        secure: false,
      },
      defaults: {
        from: '"Auth Module" <noreply@example.com>',
      },
    }),
    EmailModule,
    FilcronetAuthModule.forRoot({
      jwt: {
        secret:
          process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: '1m',
        refreshExpiresIn: '7d',
      },
      passwordReset: {
        expiresIn: '15m',
      },
      invitation: {
        expiresIn: '7d',
      },
      defaultUserRole: 'user',
      resources: [
        { name: 'products', description: 'Product catalog management' },
        { name: 'orders', description: 'Order processing and tracking' },
      ],
    }),
    FilcronetFileManagerModule.forRoot({
      storage: {
        basePath: './uploads',
        publicUrlPath: '/uploads/public',
      },
      validation: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/*', 'application/pdf', 'text/plain'],
        validateMagicBytes: true,
      },
      cleanup: {
        enabled: false,
        retentionDays: 7,
      },
      defaults: {
        isPublic: false,
      },
      guards: {
        guards: [JwtAuthGuard, PermissionsGuard],
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
