import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PermissionEntity } from "../entities/permission.entity";
import { PermissionAction, PermissionResource } from "@filcronet/core";

/**
 * Service for managing permissions
 * Handles CRUD operations and default permission seeding
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
   * @param {PermissionResource} resource - Resource type (e.g., 'users', 'roles')
   * @param {PermissionAction} action - Action type (e.g., 'create', 'read')
   * @param {string} [description] - Optional description
   * @returns {Promise<PermissionEntity>} Created or existing permission entity
   * @memberof PermissionService
   */
  async create(
    resource: PermissionResource,
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
   * @param {PermissionResource} resource - Resource type
   * @param {PermissionAction} action - Action type
   * @returns {Promise<PermissionEntity | null>} Permission entity or null if not found
   * @memberof PermissionService
   */
  async findByResourceAndAction(
    resource: PermissionResource,
    action: PermissionAction
  ): Promise<PermissionEntity | null> {
    return this.permissionRepository.findOne({
      where: { resource, action },
    });
  }

  /**
   * Seeds default permissions for all resource-action combinations
   * Automatically creates permissions for all enum values
   * Safe to run multiple times (skips existing permissions)
   *
   * @returns {Promise<void>}
   * @memberof PermissionService
   */
  async seedDefaultPermissions(): Promise<void> {
    const resources = Object.values(PermissionResource);
    const actions = Object.values(PermissionAction);

    for (const resource of resources) {
      for (const action of actions) {
        await this.create(resource, action, `${action} ${resource}`);
      }
    }
  }
}
