/**
 * @fileoverview Dynamic guard that delegates to configured guards
 * @packageDocumentation
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ModuleRef, ContextIdFactory } from "@nestjs/core";
import { IFileManagerModuleOptions } from "../interfaces/file-manager-options.interface";
import { FILE_MANAGER_OPTIONS } from "../constants/file-manager.constants";
import { firstValueFrom, isObservable } from "rxjs";

/**
 * Dynamic guard that delegates authentication/authorization
 * to the guards configured in module options.
 *
 * If no guards are configured, all requests are allowed.
 *
 * @export
 * @class FileManagerGuard
 * @implements {CanActivate}
 */
@Injectable()
export class FileManagerGuard implements CanActivate {
  private readonly logger = new Logger(FileManagerGuard.name);

  constructor(
    @Inject(FILE_MANAGER_OPTIONS)
    private readonly options: IFileManagerModuleOptions,
    private readonly moduleRef: ModuleRef
  ) {}

  /**
   * Executes all configured guards in sequence
   * All guards must pass for the request to be allowed
   *
   * @param {ExecutionContext} context - Execution context
   * @returns {Promise<boolean>} True if all guards pass
   * @memberof FileManagerGuard
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const guardClasses = this.options.guards?.guards;

    // No guards configured - allow all requests
    if (!guardClasses || guardClasses.length === 0) {
      return true;
    }

    // Create a context ID for request-scoped resolution
    const contextId = ContextIdFactory.create();

    // Register the request in the context (needed for request-scoped providers)
    const request = context.switchToHttp().getRequest();
    this.moduleRef.registerRequestByContextId(request, contextId);

    // Execute each guard in sequence
    for (const GuardClass of guardClasses) {
      try {
        // Resolve guard instance with request context
        const guard = await this.moduleRef.resolve<CanActivate>(
          GuardClass,
          contextId,
          { strict: false }
        );

        const result = await this.executeGuard(guard, context);
        if (!result) {
          return false;
        }
      } catch (error) {
        // Re-throw authentication/authorization errors
        if (error instanceof UnauthorizedException) {
          throw error;
        }

        this.logger.error(`Error executing guard ${GuardClass.name}: ${error}`);
        throw error;
      }
    }

    return true;
  }

  /**
   * Executes a single guard and handles sync, async, and Observable results
   */
  private async executeGuard(
    guard: CanActivate,
    context: ExecutionContext
  ): Promise<boolean> {
    const result = guard.canActivate(context);

    if (typeof result === "boolean") {
      return result;
    }

    if (result instanceof Promise) {
      return (await result) ?? false;
    }

    if (isObservable(result)) {
      return (await firstValueFrom(result)) ?? false;
    }

    return false;
  }
}
