import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * Global module that provides EmailService
 * Must be imported BEFORE FilcronetAuthModule
 */
@Global()
@Module({
  providers: [
    EmailService,
    {
      provide: 'EMAIL_SERVICE',
      useExisting: EmailService,
    },
  ],
  exports: [EmailService, 'EMAIL_SERVICE'],
})
export class EmailModule {}
