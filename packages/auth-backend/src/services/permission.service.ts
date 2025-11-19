import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PermissionEntity } from "../entities/permission.entity";
import { PermissionAction } from "@sottosviluppo/core";

/**
 * Service for managing permissions
 * Handles CRUD operations and permission seeding
 *
 * @export
 * @class PermissionService
 */
@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(PermissionEntity)
    private permissionRepository: Repository<PermissionEntity>
  ) {}

  /**
   * Creates a new permission or returns existing one
   *
   * @param {string} resource - Resource name (e.g., 'users', 'products')
   * @param {PermissionAction} action - Action type (e.g., 'create', 'read')
   * @param {string} [description] - Optional description
   * @returns {Promise<PermissionEntity>} Created or existing permission entity
   * @memberof PermissionService
   */
  async create(
    resource: string,
    action: PermissionAction,
    description?: string
  ): Promise<PermissionEntity> {
    const existing = await this.permissionRepository.findOne({
      where: { resource, action },
    });

    if (existing) {
      return existing;
    }

    const permission = this.permissionRepository.create({
      resource,
      action,
      description,
    });

    return this.permissionRepository.save(permission);
  }

  /**
   * Retrieves all permissions ordered by resource and action
   *
   * @returns {Promise<PermissionEntity[]>} Array of all permissions
   * @memberof PermissionService
   */
  async findAll(): Promise<PermissionEntity[]> {
    return this.permissionRepository.find({
      order: { resource: "ASC", action: "ASC" },
    });
  }

  /**
   * Finds a single permission by ID
   *
   * @param {string} id - Permission UUID
   * @returns {Promise<PermissionEntity>} Permission entity
   * @throws {NotFoundException} If permission not found
   * @memberof PermissionService
   */
  async findOne(id: string): Promise<PermissionEntity> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  /**
   * Finds permission by resource and action combination
   *
   * @param {string} resource - Resource name
   * @param {PermissionAction} action - Action type
   * @returns {Promise<PermissionEntity | null>} Permission entity or null if not found
   * @memberof PermissionService
   */
  async findByResourceAndAction(
    resource: string,
    action: PermissionAction
  ): Promise<PermissionEntity | null> {
    return this.permissionRepository.findOne({
      where: { resource, action },
    });
  }

  /**
   * Finds all permissions for a specific resource
   *
   * @param {string} resource - Resource name
   * @returns {Promise<PermissionEntity[]>} Filtered permissions
   * @memberof PermissionService
   */
  async findByResource(resource: string): Promise<PermissionEntity[]> {
    return this.permissionRepository.find({
      where: { resource },
      order: { action: "ASC" },
    });
  }

  /**
   * Seeds permissions for specified resources and actions
   * Used by BootstrapService to create permissions from configuration
   *
   * @param {string[]} resources - Array of resource names
   * @param {PermissionAction[]} [actions] - Actions to create (defaults to all)
   * @returns {Promise<void>}
   * @memberof PermissionService
   */
  async seedPermissions(
    resources: string[],
    actions?: PermissionAction[]
  ): Promise<void> {
    const actionsToCreate = actions ?? Object.values(PermissionAction);

    for (const resource of resources) {
      for (const action of actionsToCreate) {
        await this.create(resource, action, `${action} ${resource}`);
      }
    }
  }

  /**
   * Counts total permissions
   *
   * @returns {Promise<number>} Total count
   * @memberof PermissionService
   */
  async count(): Promise<number> {
    return this.permissionRepository.count();
  }
}
