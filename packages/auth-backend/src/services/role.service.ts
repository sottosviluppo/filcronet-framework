import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { RoleEntity } from "../entities/role.entity";
import { PermissionEntity } from "../entities/permission.entity";
import { ICreateRoleDto, IUpdateRoleDto } from "@sottosviluppo/core";

/**
 * Service for managing roles and their permissions
 * Handles CRUD operations with system role protection
 *
 * @export
 * @class RoleService
 */
@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private permissionRepository: Repository<PermissionEntity>
  ) {}

  /**
   * Creates a new role with specified permissions
   *
   * @param {ICreateRoleDto} createRoleDto - Role creation data
   * @returns {Promise<RoleEntity>} Created role entity
   * @throws {ConflictException} If role name already exists
   * @memberof RoleService
   */
  async create(
    createRoleDto: ICreateRoleDto & { isSystem?: boolean }
  ): Promise<RoleEntity> {
    const existing = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Role "${createRoleDto.name}" already exists`
      );
    }

    let permissions: PermissionEntity[] = [];
    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      permissions = await this.permissionRepository.findBy({
        id: In(createRoleDto.permissionIds),
      });
    }

    const role = this.roleRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
      permissions,
      isSystem: createRoleDto.isSystem ?? false,
    });

    return this.roleRepository.save(role);
  }

  /**
   * Retrieves all roles with their permissions
   *
   * @returns {Promise<RoleEntity[]>} Array of all roles
   * @memberof RoleService
   */
  async findAll(): Promise<RoleEntity[]> {
    return this.roleRepository.find({
      relations: ["permissions"],
      order: { name: "ASC" },
    });
  }

  /**
   * Finds a single role by ID
   *
   * @param {string} id - Role UUID
   * @returns {Promise<RoleEntity>} Role entity with permissions
   * @throws {NotFoundException} If role not found
   * @memberof RoleService
   */
  async findOne(id: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ["permissions"],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  /**
   * Finds a role by name
   *
   * @param {string} name - Role name
   * @returns {Promise<RoleEntity | null>} Role entity or null if not found
   * @memberof RoleService
   */
  async findByName(name: string): Promise<RoleEntity | null> {
    return this.roleRepository.findOne({
      where: { name },
      relations: ["permissions"],
    });
  }

  /**
   * Updates role information
   * System roles cannot be modified
   *
   * @param {string} id - Role UUID
   * @param {IUpdateRoleDto} updateRoleDto - Fields to update
   * @returns {Promise<RoleEntity>} Updated role entity
   * @throws {NotFoundException} If role not found
   * @throws {ConflictException} If attempting to modify system role or name already exists
   * @memberof RoleService
   */
  async update(id: string, updateRoleDto: IUpdateRoleDto): Promise<RoleEntity> {
    const role = await this.findOne(id);

    if (role.name === "super-admin") {
      throw new ConflictException(
        "Cannot modify 'super-admin' role: this role is locked for security reasons"
      );
    }

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existing = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (existing) {
        throw new ConflictException(
          `Role "${updateRoleDto.name}" already exists`
        );
      }
    }

    if (updateRoleDto.permissionIds !== undefined) {
      const permissions = await this.permissionRepository.findBy({
        id: In(updateRoleDto.permissionIds),
      });
      role.permissions = permissions;
    }

    Object.assign(role, {
      name: updateRoleDto.name,
      description: updateRoleDto.description,
    });

    return this.roleRepository.save(role);
  }

  /**
   * Permanently deletes a role
   * System roles cannot be deleted
   *
   * @param {string} id - Role UUID
   * @returns {Promise<void>}
   * @throws {NotFoundException} If role not found
   * @throws {ConflictException} If attempting to delete system role
   * @memberof RoleService
   */
  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new ConflictException("Cannot delete system role");
    }

    await this.roleRepository.remove(role);
  }
}
