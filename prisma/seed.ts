import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

async function main() {
  // Admin user
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "System Administrator",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  // Streams
  const streamNames = [
    "Bio Science",
    "Physical Science",
    "Mathematics",
    "Commerce",
    "Arts",
  ];
  for (const name of streamNames) {
    await prisma.stream.upsert({
      where: { name },
      update: {},
      create: { name, status: true },
    });
  }

  // Subjects
  const subjects = [
    { code: "BIO", name: "Bio Science" },
    { code: "CHEM", name: "Chemistry" },
    { code: "PHY", name: "Physics" },
    { code: "MATH", name: "Mathematics" },
  ];
  for (const s of subjects) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: { code: s.code, name: s.name, status: true },
    });
  }

  // Class sessions
  const sessionNames = ["Day", "Evening", "Special"];
  for (const name of sessionNames) {
    await prisma.classSession.upsert({
      where: { name },
      update: {},
      create: { name, status: true },
    });
  }

  // Class periods (current + next two months)
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const displayName = `${MONTHS[d.getMonth()]}/${d.getFullYear()}`;
    await prisma.classPeriod.upsert({
      where: { displayName },
      update: {},
      create: {
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        displayName,
        status: "ACTIVE",
      },
    });
  }

  // Seed fees for the current period across all sessions/subjects
  const currentDisplay = `${MONTHS[now.getMonth()]}/${now.getFullYear()}`;
  const period = await prisma.classPeriod.findUnique({
    where: { displayName: currentDisplay },
  });
  if (period) {
    const allSubjects = await prisma.subject.findMany();
    const allSessions = await prisma.classSession.findMany();
    const baseFees: Record<string, number> = {
      BIO: 2500,
      CHEM: 2000,
      PHY: 2000,
      MATH: 2500,
    };

    for (const session of allSessions) {
      for (const subject of allSubjects) {
        const amount = (baseFees[subject.code] ?? 2000) + (session.name === "Special" ? 500 : session.name === "Evening" ? 250 : 0);
        await prisma.subjectFee.upsert({
          where: {
            classPeriodId_sessionId_subjectId: {
              classPeriodId: period.id,
              sessionId: session.id,
              subjectId: subject.id,
            },
          },
          update: {},
          create: {
            classPeriodId: period.id,
            sessionId: session.id,
            subjectId: subject.id,
            amount,
            status: true,
          },
        });
      }
    }
  }

  console.log("Seed complete.");
  console.log("Admin login: admin@example.com / Admin@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
