import { Injectable, OnModuleInit, Inject, Logger } from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { RoleService } from "./role.service";
import { AuthModuleOptions } from "../interfaces/auth-module-options.interface";
import { PermissionAction } from "@sottosviluppo/core";

/**
 * Bootstrap service for initializing default roles and permissions
 * Runs automatically on module initialization
 *
 * @export
 * @class BootstrapService
 * @implements {OnModuleInit}
 */
@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly roleService: RoleService,
    @Inject("AUTH_OPTIONS")
    private readonly options: AuthModuleOptions
  ) {}

  /**
   * Executes on module initialization
   * Seeds permissions and roles based on configuration
   *
   * @memberof BootstrapService
   */
  async onModuleInit() {
    this.logger.log("Starting authentication module bootstrap...");

    try {
      // Validate configuration
      if (!this.options.resources || this.options.resources.length === 0) {
        this.logger.warn(
          "No resources defined in configuration. Permissions will not be created."
        );
        return;
      }

      // 1. Seed permissions for configured resources
      await this.seedPermissions();

      // 2. Create default roles
      await this.seedDefaultRoles();

      this.logger.log("Authentication module bootstrap completed successfully");
    } catch (error) {
      this.logger.error("Bootstrap failed:", error);
      // Don't block app startup, just log the error
    }
  }

  /**
   * Seeds permissions based on configured resources
   *
   * @private
   * @memberof BootstrapService
   */
  private async seedPermissions() {
    this.logger.log("Seeding permissions for configured resources...");

    for (const resourceDef of this.options.resources) {
      const actions = resourceDef.actions ?? Object.values(PermissionAction);

      this.logger.log(
        `Creating permissions for resource: ${resourceDef.name} (${actions.length} actions)`
      );

      await this.permissionService.seedPermissions([resourceDef.name], actions);
    }

    const count = await this.permissionService.count();
    this.logger.log(`Total permissions in system: ${count}`);
  }

  /**
   * Creates default roles with appropriate permissions
   *
   * @private
   * @memberof BootstrapService
   */
  private async seedDefaultRoles() {
    this.logger.log("Seeding default roles...");

    // Get all permissions
    const allPermissions = await this.permissionService.findAll();

    // Super Admin - all permissions
    const superAdminRole = await this.roleService.findByName("super-admin");
    if (!superAdminRole) {
      await this.roleService.create({
        name: "super-admin",
        description: "Super administrator with full system access",
        permissionIds: allPermissions.map((p) => p.id),
        isSystem: true,
      });
      this.logger.log("Created role: super-admin");
    }

    // Admin - all permissions except 'manage' on 'roles'
    const adminRole = await this.roleService.findByName("admin");
    if (!adminRole) {
      const adminPermissions = allPermissions.filter(
        (p) => !(p.resource === "roles" && p.action === PermissionAction.MANAGE)
      );

      await this.roleService.create({
        name: "admin",
        description: "Administrator with elevated privileges",
        permissionIds: adminPermissions.map((p) => p.id),
        isSystem: true,
      });
      this.logger.log("Created role: admin");
    }

    // User - only 'read' permissions on 'users' resource
    const userRole = await this.roleService.findByName("user");
    if (!userRole) {
      const userPermissions = allPermissions.filter(
        (p) => p.resource === "users" && p.action === PermissionAction.READ
      );

      await this.roleService.create({
        name: "user",
        description: "Standard user with basic access",
        permissionIds: userPermissions.map((p) => p.id),
        isSystem: true,
      });
      this.logger.log("Created role: user");
    }

    // Create additional default roles from config
    if (this.options.defaultRoles) {
      for (const roleName of this.options.defaultRoles) {
        const exists = await this.roleService.findByName(roleName);
        if (!exists && !["super-admin", "admin", "user"].includes(roleName)) {
          await this.roleService.create({
            name: roleName,
            description: `Custom role: ${roleName}`,
            permissionIds: [],
          });
          this.logger.log(`Created custom role: ${roleName}`);
        }
      }
    }
  }
}
