import cron from 'node-cron';
import prisma from "../utils/prisma";
import { AssignmentStatus, AssignedStatus } from "@src/enum/enum";

export const autoUnassignAsset = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredAssignments = await prisma.productAssignment.findMany({
      where: {
        status: { in: [AssignmentStatus.Active, AssignmentStatus.Handovered] },
        endDate: { lte: today },
      },
      include: {
        inventoryProductDetail: true,
      },
    });

    if (expiredAssignments.length === 0) {
      console.log("No expired hardware assignments found.");
      return;
    }

    console.log(`Found ${expiredAssignments.length} expired hardware assignments. Auto-unassigning...`);

    for (const assignment of expiredAssignments) {
      await prisma.$transaction(async (tx) => {
        // 1. Create UnAssignment record
        const uuid = `mg-assn-auto-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const productUnassignment = await tx.productUnAssignment.create({
          data: {
            uuid: uuid,
            inventoryProductDetailId: assignment.inventoryProductDetailId,
            approvedById: 1, 
            unassignmentDate: new Date(),
            remarks: "Auto-unassigned due to expiration date",
            createdById: 1, 
          }
        });

        // 2. Update Assignment status
        await tx.productAssignment.update({
          where: { id: assignment.id },
          data: { status: AssignmentStatus.PendingReturn }
        });

        // 3. Update Inventory Details status
        await tx.inventoryProductDetail.update({
          where: { id: assignment.inventoryProductDetailId },
          data: { assignedStatus: AssignedStatus.PENDING_RETURN }
        });

        // 4. Create log
        await tx.log.create({
          data: {
            action: "Auto Unassigned Asset",
            userId: 1,
            details: JSON.stringify({
              productUnassignmentId: productUnassignment.id,
              reason: "Expiration date reached",
            }),
          }
        });
      });
    }

    console.log("Successfully auto-unassigned expired hardware assets.");
  } catch (error) {
    console.error("Error running auto-unassign asset cron job:", error);
  }
};

export const initAssetCronJobs = () => {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running auto-unassign hardware asset cron job...');
    await autoUnassignAsset();
  });
};
