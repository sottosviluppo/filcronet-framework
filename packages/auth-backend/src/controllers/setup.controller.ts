import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ConflictException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { UserService } from "../services/user.service";
import { RoleService } from "../services/role.service";
import { Public } from "../decorators/public.decorator";
import { CreateUserDto } from "../dto/create-user.dto";
import { UserStatus } from "@sottosviluppo/core";

/**
 * Controller for initial system setup
 * Only works when no users exist in the system
 *
 * @export
 * @class SetupController
 */
@ApiTags("Setup")
@Controller({
  path: "setup",
  version: "1",
})
export class SetupController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService
  ) {}

  /**
   * Creates the first super-admin user
   * Only works if no users exist in the database
   *
   * @param {CreateUserDto} createUserDto - Super admin user data
   * @returns {Promise<{ message: string; user: any }>}
   * @throws {ConflictException} If users already exist
   * @memberof SetupController
   */
  @Public()
  @Post("initial-admin")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create initial super-admin user",
    description:
      "Creates the first super-admin user. Only works when database is empty (no users exist).",
  })
  @ApiResponse({
    status: 201,
    description: "Super-admin user created successfully",
  })
  @ApiResponse({
    status: 409,
    description: "Users already exist in the system",
  })
  async createInitialAdmin(
    @Body() createUserDto: CreateUserDto
  ): Promise<{ message: string; user: any }> {
    // Check if any users exist
    const userCount = await this.userService.count();

    if (userCount > 0) {
      throw new ConflictException(
        "Cannot create initial admin: users already exist in the system"
      );
    }

    // Get super-admin role
    const superAdminRole = await this.roleService.findByName("super-admin");

    if (!superAdminRole) {
      throw new ConflictException(
        "Super-admin role not found. Bootstrap may have failed."
      );
    }

    // Create super-admin user
    const user = await this.userService.create({
      ...createUserDto,
      roleIds: [superAdminRole.id],
      status: UserStatus.ACTIVE, // Directly active
    });

    return {
      message: "Super-admin user created successfully",
      user: user.toSafeObject(),
    };
  }
}
