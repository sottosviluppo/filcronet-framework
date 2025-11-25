import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilcronetAuthModule } from '@sottosviluppo/auth-backend';
import { EmailModule } from './email.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
