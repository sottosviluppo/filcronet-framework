/**
 * Filcronet Auth Backend Package
 * Complete authentication and authorization system for NestJS
 *
 * @packageDocumentation
 */

// Module
export * from "./auth.module";

// Entities
export * from "./entities/user.entity";
export * from "./entities/role.entity";
export * from "./entities/permission.entity";

// Services
export * from "./services/auth.service";
export * from "./services/user.service";
export * from "./services/role.service";
export * from "./services/permission.service";
export * from "./services/bootstrap.service";

// Controllers
export * from "./controllers/auth.controller";
export * from "./controllers/user.controller";
export * from "./controllers/role.controller";
export * from "./controllers/permission.controller";
export * from "./controllers/setup.controller";

// DTOs
export * from "./dto/login.dto";
export * from "./dto/register.dto";
export * from "./dto/create-user.dto";
export * from "./dto/update-user.dto";
export * from "./dto/create-role.dto";
export * from "./dto/update-role.dto";

// Guards
export * from "./guards/jwt-auth.guard";
export * from "./guards/permissions.guard";

// Decorators
export * from "./decorators/current-user.decorator";
export * from "./decorators/public.decorator";
export * from "./decorators/require-permissions.decorator";

// Strategies
export * from "./strategies/jwt.strategy";

// Interfaces
export * from "./interfaces/auth-module-options.interface";
export * from "./interfaces/auth-response.interface";
export * from "./interfaces/jwt-payload.interface";
export * from "./interfaces/email-service.interface";
export * from "./interfaces/user-invitation.interface";

// Utils
export * from "./utils/password-error-messages";
export * from "./utils/response.helper";

// Filters
export * from "./filters/http-exception.filter";
