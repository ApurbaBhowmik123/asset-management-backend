import cron from 'node-cron';
import { PrismaClient } from "../../prisma/generated/prisma";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export const autoUnassignSoftware = async () => {
  try {
    const today = new Date();
    // Set to beginning of today
    today.setHours(0, 0, 0, 0);

    const expiredAssignments = await prisma.softWareAssignment.findMany({
      where: {
        status: "ASSIGNED",
        expiryDate: { lte: today }
      },
      include: {
        software: true
      }
    });

    if (expiredAssignments.length === 0) {
      console.log("No expired software assignments found.");
      return;
    }

    console.log(`Found ${expiredAssignments.length} expired software assignments. Auto-unassigning...`);

    // In background cron jobs, we need an admin/system user ID or we can use the assignedBy user.
    // For automatic logs, let's just use the assignedBy ID or a default value (e.g. 1 if admin exists)
    
    for (const assignment of expiredAssignments) {
      await prisma.$transaction(async (tx) => {
        // 1. Create UnAssignment record
        await tx.softWareUnAssignment.create({
          data: {
            uuid: uuidv4(),
            softwareAssignmentId: assignment.id,
            unassignedQuantity: assignment.quantity,
            unassignmentDate: new Date(),
            remarks: "Auto-unassigned due to expiration date",
            condition: "Expired",
            createdById: assignment.assignedBy, // Fallback to the original assigner
          }
        });

        // 2. Increase software quantity back
        await tx.softWare.update({
          where: { id: assignment.softwareId },
          data: {
            currentQuantity: { increment: assignment.quantity }
          }
        });

        // 3. Update Assignment status
        await tx.softWareAssignment.update({
          where: { id: assignment.id },
          data: { status: "UNASSIGNED" }
        });

        // 4. Log the action
        await tx.softWareLog.create({
          data: {
            uuid: uuidv4(),
            softwareId: assignment.softwareId,
            userId: assignment.assignedBy,
            action: "AUTO_UNASSIGN",
            actionDetails: `Auto-unassigned ${assignment.quantity} qty due to expiration.`,
          }
        });
      });
    }

    console.log("Successfully auto-unassigned expired softwares.");
  } catch (error) {
    console.error("Error running auto-unassign software cron job:", error);
  }
};

export const initSoftwareCronJobs = () => {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running auto-unassign software cron job...');
    await autoUnassignSoftware();
  });
};
