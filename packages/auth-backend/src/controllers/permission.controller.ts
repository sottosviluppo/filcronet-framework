import { IApiResponse } from "@sottosviluppo/core";
import { ResponseHelper } from "../utils/response.helper";
import { PermissionEntity } from "../entities/permission.entity";
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { PermissionService } from "../services/permission.service";
import { PermissionsGuard } from "../guards/permissions.guard";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("Permissions")
@Controller({ path: "permissions", version: "1" })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @RequirePermissions("permissions:list")
  @ApiOperation({ summary: "List all permissions" })
  async findAll(): Promise<IApiResponse<PermissionEntity[]>> {
    const permissions = await this.permissionService.findAll();
    return ResponseHelper.success(permissions);
  }

  @Get(":id")
  @RequirePermissions("permissions:read")
  @ApiOperation({ summary: "Get permission by ID" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<IApiResponse<PermissionEntity>> {
    const permission = await this.permissionService.findOne(id);
    return ResponseHelper.success(permission);
  }
}
