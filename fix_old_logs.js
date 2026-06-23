const { PrismaClient } = require('./prisma/generated/prisma');
const prisma = new PrismaClient();

async function fix() {
  const logs = await prisma.softWareLog.findMany();
  for (const log of logs) {
    if (log.actionDetails && log.actionDetails.includes('Assignment ID:')) {
      const match = log.actionDetails.match(/Assignment ID:\s*(mg-sass-\d+)/);
      if (match) {
        const assignmentId = match[1];
        const assignment = await prisma.softWareAssignment.findFirst({
          where: { assignedId: assignmentId }
        });
        
        if (assignment) {
            let assignedToName = "";
            if (assignment.assignedTo) {
                const u = await prisma.user.findUnique({ where: { id: assignment.assignedTo } });
                if (u) assignedToName = `User ${u.name}`;
            } else if (assignment.unitId) {
                const u = await prisma.unit.findUnique({ where: { id: assignment.unitId } });
                if (u) assignedToName = `Unit ${u.name}`;
            } else if (assignment.locationId) {
                const l = await prisma.location.findUnique({ where: { id: assignment.locationId } });
                if (l) assignedToName = `Location ${l.name}`;
            }

            if (assignedToName && !log.actionDetails.includes('[Assigned To:')) {
                await prisma.softWareLog.update({
                where: { id: log.id },
                data: { actionDetails: log.actionDetails + ` [Assigned To: ${assignedToName}]` }
                });
            }
        }
      }
    }
  }
  console.log('Updated logs');
}

fix().finally(() => prisma.$disconnect());
