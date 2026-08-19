import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany();
  console.log("Existing students in database:");
  for (const s of students) {
    console.log(`- Name: ${s.name}, Email: ${s.email}, SID: ${s.sid}, NIC: ${s.nic}, Status: ${s.status}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
