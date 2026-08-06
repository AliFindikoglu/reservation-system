import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type DatabaseClient = PrismaService | Prisma.TransactionClient | PrismaClient;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  findMine(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async markAsRead(userId: string, id: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException("Notification not found.");
    }
    return { message: "The notification has been marked as read." };
  }

  create(
    database: DatabaseClient,
    data: {
      userId: string;
      type: string;
      title: string;
      message: string;
      relatedEntityType?: string;
      relatedEntityId?: string;
    },
  ) {
    return database.notification.create({ data });
  }
}
