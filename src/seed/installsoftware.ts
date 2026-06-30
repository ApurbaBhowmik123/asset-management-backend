import { PrismaClient } from "../../prisma/generated/prisma/client";
import { generateNextCode } from "../utils/codeGenerator";
import prisma from "../utils/prisma";
const installsoft = [
  {
    name: "Proxy",
    version: "1.0.0",
  },
  {
    name: "IP Address",
    version: "1.0.0",
  },
  {
    name: "AV",
    version: "1.0.0",
  },
  {
    name: "Domain",
    version: "1.0.0",
  },
  {
    name: "Host Name",
    version: "1.0.0",
  },
  {
    name: "Bit Locker",
    version: "1.0.0",
  },
  {
    name: "MAC Address",
    version: "1.0.0",
  },
  {
    name: "OS Service Pack",
    version: "1.0.0",
  },
  {
    name: "OS Version",
    version: "1.0.0",
  },
  {
    name: "OS",
    version: "1.0.0",
  },
];

async function main() {
  for (let i = 0; i < installsoft.length; i++) {
    const { name, version } = installsoft[i];
    const uuid = await generateNextCode(
      prisma.installationSoftware,
      "uuid",
      "INS-"
    );
    await prisma.installationSoftware.create({
      data: {
        uuid,
        name,
        version,
        createdBy: 1,
        updatedBy: 1,
      },
    });
  }
}
main()
  .catch((e) => {
    console.error(" Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
