// .env-ის ხელით ჩატვირთვა — საჭიროა, რადგან ეს სკრიპტი Next.js-ის გარეთ (tsx-ით) გაშვებულია
// და, ჩვეულებრივი Node.js პროცესებისგან განსხვავებით, .env ფაილს ავტომატურად არ კითხულობს.
import "dotenv/config";

// გაუშვით: npm run seed:admin
// ქმნის (ან არსებულს აქცევს ადმინად) .env ფაილში მითითებულ ADMIN_EMAIL / ADMIN_PASSWORD ანგარიშს.
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { allocatePublicId, ensureAdminIds, ensureUserPublicId } from "../src/lib/publicIds";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("ADMIN_EMAIL და ADMIN_PASSWORD უნდა იყოს მითითებული .env ფაილში.");
    process.exit(1);
  }

  const numberedAdmins = Object.entries(process.env)
    .map(([key, value]) => {
      const match = key.match(/^(\d+)\.ADMIN_EMAIL$/);
      return match && value ? { index: Number(match[1]), email: value, password: process.env[`${match[1]}.ADMIN_PASSWORD`] } : null;
    })
    .filter((value): value is { index: number; email: string; password: string | undefined } => Boolean(value))
    .sort((a, b) => a.index - b.index);

  for (const adminConfig of [{ email, password }, ...numberedAdmins]) {
    if (!adminConfig.password) {
      console.error(`ADMIN_PASSWORD აკლია ${adminConfig.email}-ისთვის.`);
      continue;
    }
    const normalizedEmail = adminConfig.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      await prisma.user.update({ where: { email: normalizedEmail }, data: { role: "ADMIN" } });
      await ensureUserPublicId(existing.id);
      console.log(`მომხმარებელი ${normalizedEmail} უკვე არსებობდა — მიენიჭა ADMIN როლი.`);
    } else {
      const passwordHash = await hashPassword(adminConfig.password);
      const publicId = await allocatePublicId("REGISTERED");
      await prisma.user.create({ data: { email: normalizedEmail, passwordHash, role: "ADMIN", publicId } });
      console.log(`ადმინის ანგარიში შეიქმნა: ${normalizedEmail}`);
    }
  }
  await ensureAdminIds();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
