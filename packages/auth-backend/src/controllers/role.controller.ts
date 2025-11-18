import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { IsString, IsOptional, IsArray, IsUUID } from "class-validator";
import { RoleService } from "../services/role.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionsGuard } from "../guards/permissions.guard";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { RoleEntity } from "../entities/role.entity";
import { CreateRoleDto } from "../dto/create-role.dto";
import { UpdateRoleDto } from "../dto/update-role.dto";

/**
 * Controller handling role management endpoints
 * All routes require authentication and specific permissions
 *
 * @export
 * @class RoleController
 */
@ApiTags("Roles")
@Controller({
  path: "roles",
  version: "1",
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * Creates a new role with specified permissions
   *
   * @param {CreateRoleDto} createRoleDto - Role creation data
   * @returns {Promise<RoleEntity>} Created role
   * @memberof RoleController
   */
  @Post()
  @RequirePermissions("roles:create")
  @ApiOperation({ summary: "Create a new role" })
  @ApiResponse({ status: 201, description: "Role successfully created" })
  @ApiResponse({ status: 409, description: "Role already exists" })
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleEntity> {
    return this.roleService.create(createRoleDto);
  }

  /**
   * Retrieves all roles with their permissions
   *
   * @returns {Promise<RoleEntity[]>} Array of all roles
   * @memberof RoleController
   */
  @Get()
  @RequirePermissions("roles:list")
  @ApiOperation({ summary: "List all roles" })
  @ApiResponse({ status: 200, description: "Role list retrieved successfully" })
  async findAll(): Promise<RoleEntity[]> {
    return this.roleService.findAll();
  }

  /**
   * Retrieves a single role by ID
   *
   * @param {string} id - Role UUID
   * @returns {Promise<RoleEntity>} Role details
   * @memberof RoleController
   */
  @Get(":id")
  @RequirePermissions("roles:read")
  @ApiOperation({ summary: "Get role by ID" })
  @ApiResponse({ status: 200, description: "Role details" })
  @ApiResponse({ status: 404, description: "Role not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<RoleEntity> {
    return this.roleService.findOne(id);
  }

  /**
   * Updates role information
   * System roles cannot be modified
   *
   * @param {string} id - Role UUID
   * @param {UpdateRoleDto} updateRoleDto - Fields to update
   * @returns {Promise<RoleEntity>} Updated role
   * @memberof RoleController
   */
  @Patch(":id")
  @RequirePermissions("roles:update")
  @ApiOperation({ summary: "Update role" })
  @ApiResponse({ status: 200, description: "Role successfully updated" })
  @ApiResponse({ status: 404, description: "Role not found" })
  @ApiResponse({
    status: 409,
    description: "Cannot modify system role or role name already exists",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto
  ): Promise<RoleEntity> {
    return this.roleService.update(id, updateRoleDto);
  }

  /**
   * Permanently deletes a role
   * System roles cannot be deleted
   *
   * @param {string} id - Role UUID
   * @returns {Promise<void>}
   * @memberof RoleController
   */
  @Delete(":id")
  @RequirePermissions("roles:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete role" })
  @ApiResponse({ status: 204, description: "Role successfully deleted" })
  @ApiResponse({ status: 404, description: "Role not found" })
  @ApiResponse({ status: 409, description: "Cannot delete system role" })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.roleService.remove(id);
  }
}
