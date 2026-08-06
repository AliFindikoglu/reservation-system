import { ConflictException, Injectable } from "@nestjs/common";
import { Prisma, ThemePreference } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { preferredOffice: { select: { id: true, name: true, city: true } } },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { preferredOffice: { select: { id: true, name: true, city: true } } },
    });
  }

  async updateProfile(
    id: string,
    data: {
      fullName?: string;
      phone?: string;
      preferredOfficeId?: string;
      themePreference?: ThemePreference;
    },
  ) {
    if (data.preferredOfficeId !== undefined) {
      const office = await this.prisma.office.findFirst({
        where: {
          id: data.preferredOfficeId,
          isActive: true,
        },
        select: { id: true },
      });

      if (!office) {
        throw new ConflictException(
          "The selected preferred office is not available.",
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        preferredOffice: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });
  }

  updatePasswordHash(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async create(data: {
    fullName: string;
    email: string;
    phone: string;
    passwordHash: string;
  }) {
    try {
      const defaultOffice = await this.prisma.office.findFirst({
        where: { city: { equals: "Istanbul", mode: "insensitive" }, isActive: true },
        select: { id: true },
      });
      return await this.prisma.user.create({
        data: {
          ...data,
          ...(defaultOffice ? { preferredOfficeId: defaultOffice.id } : {}),
        },
        include: { preferredOffice: { select: { id: true, name: true, city: true } } },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "A user with this email address already exists.",
        );
      }
      throw error;
    }
  }
}
