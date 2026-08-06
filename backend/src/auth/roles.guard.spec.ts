import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard", () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new RolesGuard(reflector as never);

  const context = (role: UserRole) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { userId: "user-1", email: "user@eteration.com", role },
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
  });

  it("allows an administrator to access an administrator endpoint", () => {
    expect(guard.canActivate(context(UserRole.ADMIN))).toBe(true);
  });

  it("rejects a normal user from an administrator endpoint", () => {
    expect(() => guard.canActivate(context(UserRole.USER))).toThrow(
      new ForbiddenException(
        "Administrator permission is required to perform this action.",
      ),
    );
  });
});
