const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.calculation.create({
        data: {
          id: "debug-history-rollback",
          userId: null,
          publicId: null,
          saved: false,
          type: "NATAL",
          name1: "debug",
          date1: "2000-01-01",
          time1: "00:00",
          place1: "debug",
          lat1: 0,
          lon1: 0,
          tz1: "UTC",
          name2: null,
          date2: null,
          time2: null,
          place2: null,
          lat2: null,
          lon2: null,
          tz2: null,
          transitDate: null,
          houseSystem: "placidus",
          ipAddress: null,
          userAgent: null,
          resultJson: "{}",
          updatedAt: null,
        },
      });
      throw new Error("rollback-debug");
    });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "rollback-debug") throw error;
  }
  console.log("history insert schema check passed");
})()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
