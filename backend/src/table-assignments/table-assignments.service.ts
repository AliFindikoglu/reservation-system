import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { formatDateOnly } from "../reservations/reservation-date";

@Injectable()
export class TableAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string) {
    const assignments = await this.prisma.tableAssignment.findMany({
      where: { userId, revokedAt: null },
      include: {
        table: {
          include: {
            equipments: {
              where: { equipment: { isActive: true } },
              include: { equipment: true },
              orderBy: { equipment: { name: "asc" } },
            },
          },
        },
      },
      orderBy: { startsOn: "asc" },
    });
    return assignments.map((assignment) => ({
      id: assignment.id,
      startsOn: formatDateOnly(assignment.startsOn),
      endsOn: assignment.endsOn ? formatDateOnly(assignment.endsOn) : null,
      table: {
        id: assignment.table.id,
        number: assignment.table.number,
        code: assignment.table.code,
        equipments: assignment.table.equipments.map((item) => ({
          id: item.equipment.id,
          code: item.equipment.code,
          name: item.equipment.name,
        })),
      },
    }));
  }
}
