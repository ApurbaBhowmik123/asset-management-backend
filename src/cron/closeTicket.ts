import cron from 'node-cron';
import { LogAction, TicketStatus } from '@src/enum/enum';
import { createLog } from '@src/helpers/createLog';
import { sendTicketEmail } from '@src/utils/mail';
import { ticketAutoClosedTemplate } from '@src/emails/tickets/ticketAutoClosedTemplate';
import prisma from "../utils/prisma";




export const autoCloseOldTickets = async () => {
  try {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const oldTickets = await prisma.ticket.findMany({
      where: {
        createdAt: { lt: fiveDaysAgo },
        status: { notIn: [TicketStatus.Closed] }
      },
      include: {
        createdBy: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    if (oldTickets.length === 0) {
      console.log("No old tickets found for auto-closing.");
      return;
    }

    await prisma.ticket.updateMany({
      where: { id: { in: oldTickets.map((t: any) => t.id) } },
      data: {
        status: TicketStatus.Closed,
        updatedAt: new Date(),
        completedAt: new Date()
      }
    });

    console.log(`Auto-closed ${oldTickets.length} tickets`);

    for (const ticket of oldTickets) {
      // log
      await createLog({
        action: LogAction.TICKET,
        userId: ticket.userId,
        relatedModelType: "prisma.ticket",
        relatedModelId: ticket.id,
        details: {
          actions: "CLOSED",
          uuid: ticket.uuid,
          remarks: "Ticket automatically closed after 5 days of inactivity"
        },
        actionUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.uuid}`
      });

      // send email
      if (ticket.createdBy?.email) {
        const html = ticketAutoClosedTemplate(
          ticket.uuid.toString(),
          ticket.createdBy.name,
          ticket.subjectLine,
          `${process.env.FRONTEND_URL}/tickets/${ticket.uuid}`,
          "Ticket automatically closed after 5 days of inactivity"
        );

        await sendTicketEmail(
          ticket.createdBy.email,
          `Ticket #${ticket.id} Closed Automatically`,
          html
        );
      }
    }
  } catch (error) {
    console.error("Error in autoCloseOldTickets:", error);
  }
};

export const initCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running auto-close tickets cron job...');
    await autoCloseOldTickets();
  });


// cron.schedule('*/5 * * * * *', async () => {
//   console.log('Running auto-close tickets cron job...');
//   await autoCloseOldTickets();
// },)
}
