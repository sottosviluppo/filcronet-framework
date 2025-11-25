// packages/auth-backend/src/controllers/role.controller.ts

import { IApiResponse } from "@sottosviluppo/core";
import { ResponseHelper } from "../utils/response.helper";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { RoleEntity } from "../entities/role.entity";
import { UpdateRoleDto } from "../dto/update-role.dto";
import { CreateRoleDto } from "../dto/create-role.dto";
import { RoleService } from "../services/role.service";
import { PermissionsGuard } from "../guards/permissions.guard";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("Roles")
@Controller({ path: "roles", version: "1" })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @RequirePermissions("roles:create")
  @ApiOperation({ summary: "Create a new role" })
  async create(
    @Body() createRoleDto: CreateRoleDto
  ): Promise<IApiResponse<RoleEntity>> {
    const role = await this.roleService.create(createRoleDto);
    return ResponseHelper.success(role, "Role created successfully");
  }

  @Get()
  @RequirePermissions("roles:list")
  @ApiOperation({ summary: "List all roles" })
  async findAll(): Promise<IApiResponse<RoleEntity[]>> {
    const roles = await this.roleService.findAll();
    return ResponseHelper.success(roles);
  }

  @Get(":id")
  @RequirePermissions("roles:read")
  @ApiOperation({ summary: "Get role by ID" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<IApiResponse<RoleEntity>> {
    const role = await this.roleService.findOne(id);
    return ResponseHelper.success(role);
  }

  @Patch(":id")
  @RequirePermissions("roles:update")
  @ApiOperation({ summary: "Update role" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto
  ): Promise<IApiResponse<RoleEntity>> {
    const role = await this.roleService.update(id, updateRoleDto);
    return ResponseHelper.success(role, "Role updated successfully");
  }

  @Delete(":id")
  @RequirePermissions("roles:delete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete role" })
  async remove(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<IApiResponse<void>> {
    await this.roleService.remove(id);
    return ResponseHelper.successMessage("Role deleted successfully");
  }
}
