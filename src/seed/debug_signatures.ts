import { PrismaClient } from '../../prisma/generated/prisma/client';
import prisma from "../utils/prisma";

async function main() {
    const assignments = await prisma.productAssignment.findMany({
        where: {
            productHandover: { isNot: null }
        },
        include: {
            productHandover: true
        }
    });

    console.log(assignments.map(a => ({
        id: a.id,
        signatureFile: a.productHandover?.signatureFile
    })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
