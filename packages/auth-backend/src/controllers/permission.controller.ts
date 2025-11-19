import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { PermissionService } from "../services/permission.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionsGuard } from "../guards/permissions.guard";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { PermissionEntity } from "../entities/permission.entity";

/**
 * Controller handling permission management endpoints
 * All routes require authentication and specific permissions
 *
 * @export
 * @class PermissionController
 */
@ApiTags("Permissions")
@Controller({
  path: "permissions",
  version: "1",
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /**
   * Retrieves all permissions
   *
   * @returns {Promise<PermissionEntity[]>} Array of all permissions
   * @memberof PermissionController
   */
  @Get()
  @RequirePermissions("permissions:list")
  @ApiOperation({ summary: "List all permissions" })
  @ApiResponse({
    status: 200,
    description: "Permission list retrieved successfully",
  })
  async findAll(): Promise<PermissionEntity[]> {
    return this.permissionService.findAll();
  }

  /**
   * Retrieves a single permission by ID
   *
   * @param {string} id - Permission UUID
   * @returns {Promise<PermissionEntity>} Permission details
   * @memberof PermissionController
   */
  @Get(":id")
  @RequirePermissions("permissions:read")
  @ApiOperation({ summary: "Get permission by ID" })
  @ApiResponse({ status: 200, description: "Permission details" })
  @ApiResponse({ status: 404, description: "Permission not found" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<PermissionEntity> {
    return this.permissionService.findOne(id);
  }
}
