import { Module, DynamicModule, Global } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";

// Entities
import { UserEntity } from "./entities/user.entity";
import { RoleEntity } from "./entities/role.entity";
import { PermissionEntity } from "./entities/permission.entity";

// Services
import { AuthService } from "./services/auth.service";
import { UserService } from "./services/user.service";
import { RoleService } from "./services/role.service";
import { PermissionService } from "./services/permission.service";

// Controllers
import { AuthController } from "./controllers/auth.controller";
import { UserController } from "./controllers/user.controller";
import { RoleController } from "./controllers/role.controller";

// Guards & Strategy
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { PermissionsGuard } from "./guards/permissions.guard";

// Interfaces
import { AuthModuleOptions } from "./interfaces/auth-module-options.interface";
import { PasswordRecoveryService } from "./services/password-recovery.service";
import { PermissionController } from "./controllers/permission.controller";
import { SetupController } from "./controllers/setup.controller";
import { BootstrapService } from "./services/bootstrap.service";
import { APP_FILTER } from "@nestjs/core";
import { HttpExceptionFilter } from "./filters/http-exception.filter";

/**
 * Filcronet Authentication Module
 * Provides complete authentication and authorization system with:
 * - JWT-based authentication
 * - Role-based access control (RBAC)
 * - Permission-based authorization
 * - User, Role and Permission management
 * - Password recovery and invitation flows
 *
 * @export
 * @class FilcronetAuthModule
 */
@Global()
@Module({})
export class FilcronetAuthModule {
  /**
   * Configures the authentication module with custom options
   *
   * @static
   * @param {AuthModuleOptions} options - Module configuration options
   * @returns {DynamicModule} Configured NestJS module
   * @memberof FilcronetAuthModule
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     MailerModule.forRoot({ ... }),
   *     FilcronetAuthModule.forRoot({
   *       jwt: {
   *         secret: process.env.JWT_SECRET,
   *         expiresIn: '15m',
   *         refreshExpiresIn: '7d',
   *       },
   *       passwordReset: {
   *         expiresIn: '15m',
   *       },
   *       invitation: {
   *         expiresIn: '7d',
   *       },
   *       resources: [
   *         { name: 'users', description: 'User management' },
   *         { name: 'products', description: 'Product catalog' },
   *       ],
   *     }),
   *   ],
   *   providers: [
   *     EmailService,
   *     {
   *       provide: 'EMAIL_SERVICE',
   *       useExisting: EmailService,
   *     },
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(options: AuthModuleOptions): DynamicModule {
    return {
      module: FilcronetAuthModule,
      imports: [
        TypeOrmModule.forFeature([UserEntity, RoleEntity, PermissionEntity]),
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({
          secret: options.jwt.secret,
          signOptions: {
            expiresIn: options.jwt.expiresIn ?? "15m",
          },
        }),
      ],
      controllers: [
        AuthController,
        UserController,
        RoleController,
        PermissionController,
        SetupController,
      ],
      providers: [
        {
          provide: APP_FILTER,
          useClass: HttpExceptionFilter,
        },
        {
          provide: "AUTH_OPTIONS",
          useValue: options,
        },
        AuthService,
        UserService,
        RoleService,
        PermissionService,
        PasswordRecoveryService,
        BootstrapService,
        JwtStrategy,
        JwtAuthGuard,
        PermissionsGuard,
      ],
      exports: [
        AuthService,
        UserService,
        RoleService,
        PermissionService,
        PasswordRecoveryService,
        JwtAuthGuard,
        PermissionsGuard,
      ],
    };
  }
}
