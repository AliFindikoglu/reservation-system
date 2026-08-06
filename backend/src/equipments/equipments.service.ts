import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EquipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive() {
    const equipments = await this.prisma.equipment.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    });
    return { equipments };
  }
}
