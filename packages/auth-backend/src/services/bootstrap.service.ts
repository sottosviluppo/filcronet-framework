import {
  Injectable,
  OnModuleInit,
  Inject,
  Logger,
  ConflictException,
} from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { RoleService } from "./role.service";
import { AuthModuleOptions } from "../interfaces/auth-module-options.interface";
import { PermissionAction, ResourceDefinition } from "@sottosviluppo/core";

/**
 * System role configuration
 * Defines the three built-in roles with their permissions
 */
interface SystemRoleConfig {
  name: string;
  description: string;
  permissionPattern: "all" | "management" | "readonly";
  locked: boolean; // If true, role cannot be modified
}

/**
 * Bootstrap service for initializing system roles and permissions
 * Runs automatically on module initialization
 *
 * @export
 * @class BootstrapService
 * @implements {OnModuleInit}
 */
@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  /**
   * Default resources that are always included in the system
   * These are core resources required for authentication and authorization
   */
  private readonly DEFAULT_RESOURCES: ResourceDefinition[] = [
    {
      name: "users",
      description: "User management - Create, read, update and delete users",
    },
    {
      name: "roles",
      description: "Role management - Define and assign roles with permissions",
    },
    {
      name: "permissions",
      description: "Permission management - View and manage system permissions",
    },
  ];

  /**
   * System roles configuration
   * These roles are always created on bootstrap with predefined permissions
   */
  private readonly SYSTEM_ROLES: SystemRoleConfig[] = [
    {
      name: "super-admin",
      description: "Super Administrator - Full system access (all permissions)",
      permissionPattern: "all",
      locked: true, // Cannot be modified
    },
    {
      name: "admin",
      description: "Administrator - User and role management access",
      permissionPattern: "management",
      locked: false, // Can be modified
    },
    {
      name: "user",
      description: "User - Read-only access to system resources",
      permissionPattern: "readonly",
      locked: false, // Can be modified
    },
  ];

  constructor(
    private readonly permissionService: PermissionService,
    private readonly roleService: RoleService,
    @Inject("AUTH_OPTIONS")
    private readonly options: AuthModuleOptions
  ) {}

  /**
   * Lifecycle hook called after module initialization
   * Triggers automatic bootstrap of permissions and roles
   *
   * @memberof BootstrapService
   */
  async onModuleInit() {
    try {
      await this.bootstrapPermissions();
      await this.bootstrapSystemRoles();
      await this.validateDefaultUserRole();

      this.logger.log("Authentication system bootstrap completed successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error("❌ Bootstrap failed:", errorMessage);
      throw error;
    }
  }

  /**
   * Merges default resources with user-defined resources
   * User-defined resources with the same name will override defaults
   *
   * @private
   * @returns {ResourceDefinition[]} Merged array of resources
   * @memberof BootstrapService
   */
  private getMergedResources(): ResourceDefinition[] {
    const userResources = this.options.resources || [];
    const resourceMap = new Map<string, ResourceDefinition>();

    // Add default resources first
    this.DEFAULT_RESOURCES.forEach((resource) => {
      resourceMap.set(resource.name, resource);
    });

    // Override with user-defined resources (if they redefine defaults)
    userResources.forEach((resource) => {
      resourceMap.set(resource.name, resource);
    });

    const mergedResources = Array.from(resourceMap.values());
    return mergedResources;
  }

  /**
   * Creates permissions for all resources
   * For each resource, creates permissions for all actions (or specific actions if defined)
   *
   * @private
   * @returns {Promise<void>}
   * @memberof BootstrapService
   */
  private async bootstrapPermissions(): Promise<void> {
    const resources = this.getMergedResources();

    if (resources.length === 0) {
      return;
    }

    const allActions = Object.values(PermissionAction);
    let createdCount = 0;
    let skippedCount = 0;

    for (const resource of resources) {
      const actions = resource.actions || allActions;

      for (const action of actions) {
        try {
          await this.permissionService.create(
            resource.name,
            action as PermissionAction,
            `${action} ${resource.name}${
              resource.description ? ` - ${resource.description}` : ""
            }`
          );
          createdCount++;
        } catch (error) {
          // Permission already exists, skip
          skippedCount++;
        }
      }
    }

    this.logger.log(
      `Permissions bootstrap completed: ${createdCount} created, ${skippedCount} already existed`
    );
  }

  /**
   * Creates system roles with predefined permissions
   *
   * System roles:
   * - super-admin: All permissions (locked, cannot be modified)
   * - admin: Management permissions (modifiable)
   * - user: Read-only permissions (modifiable)
   *
   * @private
   * @returns {Promise<void>}
   * @memberof BootstrapService
   */
  private async bootstrapSystemRoles(): Promise<void> {
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const roleConfig of this.SYSTEM_ROLES) {
      try {
        const existingRole = await this.roleService.findByName(roleConfig.name);

        if (existingRole) {
          // Role exists - update permissions if not locked
          if (roleConfig.locked) {
            skippedCount++;
          } else {
            // Update permissions for non-locked roles
            const permissions = await this.getPermissionsForRole(
              roleConfig.permissionPattern
            );

            await this.roleService.update(existingRole.id, {
              permissionIds: permissions.map((p) => p.id),
            });

            updatedCount++;
          }
          continue;
        }

        // Create new role with permissions
        const permissions = await this.getPermissionsForRole(
          roleConfig.permissionPattern
        );

        await this.roleService.create({
          name: roleConfig.name,
          description: roleConfig.description,
          isSystem: true,
          permissionIds: permissions.map((p) => p.id),
        });

        createdCount++;
      } catch (error) {
        if (error instanceof ConflictException) {
          skippedCount++;
        } else {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `   ❌ Failed to create/update role '${roleConfig.name}':`,
            errorMessage
          );
        }
      }
    }

    this.logger.log(
      `System roles bootstrap completed: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped`
    );
  }

  /**
   * Gets permissions based on role pattern
   *
   * @private
   * @param {'all' | 'management' | 'readonly'} pattern - Permission pattern
   * @returns {Promise<PermissionEntity[]>} Array of permissions
   * @memberof BootstrapService
   */
  private async getPermissionsForRole(
    pattern: "all" | "management" | "readonly"
  ): Promise<any[]> {
    const allPermissions = await this.permissionService.findAll();

    switch (pattern) {
      case "all":
        // Super-admin: ALL permissions on ALL resources
        return allPermissions;

      case "management":
        // Admin: Full access to users, roles, permissions
        return allPermissions.filter((p) =>
          ["users", "roles", "permissions"].includes(p.resource)
        );

      case "readonly":
        // User: Only read and list on system resources
        return allPermissions.filter(
          (p) =>
            ["users", "roles", "permissions"].includes(p.resource) &&
            ["read", "list"].includes(p.action)
        );

      default:
        return [];
    }
  }

  /**
   * Validates that defaultUserRole exists
   * Throws error if configured role is not found
   *
   * @private
   * @returns {Promise<void>}
   * @throws {Error} If defaultUserRole does not exist
   * @memberof BootstrapService
   */
  private async validateDefaultUserRole(): Promise<void> {
    const defaultUserRole = this.options.defaultUserRole || "user";

    const roleExists = await this.roleService.findByName(defaultUserRole);

    if (!roleExists) {
      const availableRoles = this.SYSTEM_ROLES.map((r) => r.name).join(", ");

      throw new Error(
        `Configuration error: defaultUserRole '${defaultUserRole}' does not exist.\n` +
          `Available system roles: ${availableRoles}\n` +
          `If using a custom role, create it via POST /v1/roles before starting the application.`
      );
    }
  }
}
