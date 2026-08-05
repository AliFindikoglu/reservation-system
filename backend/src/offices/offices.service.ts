import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OfficesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.office.findMany({
      where: { isActive: true },
      select: { id: true, name: true, city: true, address: true },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    const office = await this.prisma.office.findFirst({
      where: { id, isActive: true },
      select: { id: true, name: true, city: true, address: true },
    });
    if (!office) throw new NotFoundException("Office not found.");
    return office;
  }
}
