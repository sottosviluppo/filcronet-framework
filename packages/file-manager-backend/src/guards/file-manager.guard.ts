/**
 * @fileoverview Dynamic guard that delegates to configured guards
 * @packageDocumentation
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { IFileManagerModuleOptions } from "../interfaces/file-manager-options.interface";
import { FILE_MANAGER_OPTIONS } from "../constants/file-manager.constants";

/**
 * Dynamic guard that delegates authentication/authorization
 * to the guards configured in module options.
 *
 * If no guards are configured, all requests are allowed (with a warning logged at startup).
 *
 * @export
 * @class FileManagerGuard
 * @implements {CanActivate}
 */
@Injectable()
export class FileManagerGuard implements CanActivate {
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

    // Execute each guard in sequence
    for (const GuardClass of guardClasses) {
      const guard = this.moduleRef.get(GuardClass, { strict: false });

      if (!guard) {
        // Try to instantiate if not found in module ref
        const guardInstance = new GuardClass();
        const result = await this.executeGuard(guardInstance, context);
        if (!result) return false;
      } else {
        const result = await this.executeGuard(guard, context);
        if (!result) return false;
      }
    }

    return true;
  }

  /**
   * Executes a single guard and handles both sync and async results
   */
  private async executeGuard(
    guard: CanActivate,
    context: ExecutionContext
  ): Promise<boolean> {
    const result = guard.canActivate(context);

    if (result instanceof Promise) {
      return (await result) ?? false;
    }

    if (typeof result === "boolean") {
      return result;
    }

    // Observable - use firstValueFrom instead of deprecated toPromise
    const { firstValueFrom } = await import("rxjs");
    return (await firstValueFrom(result)) ?? false;
  }
}
