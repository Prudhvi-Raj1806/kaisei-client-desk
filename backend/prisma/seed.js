// Fills the database with demo studio data so the app is explorable
// immediately after setup. Safe to run once on an empty database.
// Usage: npm run seed
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const d = (s) => new Date(`${s}T00:00:00.000Z`);

async function main() {
  const existing = await prisma.client.count();
  if (existing > 0) {
    console.log(`Database already has ${existing} clients - skipping seed.`);
    return;
  }

  const meera = await prisma.client.create({
    data: { name: "Meera Krishnan", company: "Malgudi Coffee Works", email: "meera@malgudicoffee.in", phone: "+91 98450 12345" },
  });
  const arjun = await prisma.client.create({
    data: { name: "Arjun Shetty", company: "Nandi Cycles", email: "arjun@nandicycles.com", phone: "+91 99802 44321" },
  });
  const farah = await prisma.client.create({
    data: { name: "Farah Khan", company: "Silk Route Sarees", email: "farah@silkroute.in", phone: "+91 97310 87654" },
  });
  const dev = await prisma.client.create({
    data: { name: "Dev Patel", company: "GreenPlate Catering", email: "dev@greenplate.co", phone: "" },
  });

  const store = await prisma.project.create({
    data: { clientId: meera.id, title: "Online store with UPI checkout", brief: "Shopify-style catalog, UPI payments, order emails.", deadline: d("2026-11-15"), status: "ACTIVE", budgetPaise: 8500000 },
  });
  const landing = await prisma.project.create({
    data: { clientId: meera.id, title: "Brand photoshoot landing page", brief: "Single-page site for the new roast launch.", deadline: d("2026-10-20"), status: "DELIVERED", budgetPaise: 1800000 },
  });
  const booking = await prisma.project.create({
    data: { clientId: arjun.id, title: "Service booking portal", brief: "Customers book repair slots; staff dashboard.", deadline: d("2026-12-01"), status: "ACTIVE", budgetPaise: 12000000 },
  });
  const catalogue = await prisma.project.create({
    data: { clientId: farah.id, title: "Catalogue website refresh", brief: "New collection pages, WhatsApp enquiry button.", deadline: d("2026-10-28"), status: "ACTIVE", budgetPaise: 4500000 },
  });
  await prisma.project.create({
    data: { clientId: dev.id, title: "Weekly menu subscription site", brief: "Recurring orders, kitchen print view.", deadline: d("2027-01-10"), status: "DRAFT", budgetPaise: 9500000 },
  });

  await prisma.invoice.create({ data: { projectId: store.id, amountPaise: 4000000, status: "PAID", issuedOn: d("2026-10-10"), dueOn: d("2026-10-25"), paidOn: d("2026-10-24"), note: "Advance, 50%" } });
  await prisma.invoice.create({ data: { projectId: landing.id, amountPaise: 1800000, status: "PAID", issuedOn: d("2026-10-05"), dueOn: d("2026-10-19"), paidOn: d("2026-10-18"), note: "Full payment" } });
  await prisma.invoice.create({ data: { projectId: catalogue.id, amountPaise: 2250000, status: "UNPAID", issuedOn: d("2026-10-18"), dueOn: d("2026-11-02"), note: "Advance" } });
  await prisma.invoice.create({ data: { projectId: booking.id, amountPaise: 3000000, status: "UNPAID", issuedOn: d("2026-10-22"), dueOn: d("2026-11-06"), note: "Milestone 1" } });

  await prisma.studioTask.create({ data: { projectId: booking.id, title: "Design booking-slot calendar UI", notes: "Weekly grid, staff colour coding", dueDate: d("2026-11-05") } });
  await prisma.studioTask.create({ data: { projectId: store.id, title: "Razorpay UPI intent flow", notes: "Test on Android Chrome", dueDate: d("2026-10-30") } });
  await prisma.studioTask.create({ data: { projectId: store.id, title: "Product photo placeholders", dueDate: d("2026-11-02") } });
  await prisma.studioTask.create({ data: { projectId: catalogue.id, title: "WhatsApp enquiry deep-link", notes: "Prefilled message with saree code", dueDate: d("2026-10-24") } });
  await prisma.studioTask.create({ data: { projectId: landing.id, title: "Compress hero images", dueDate: d("2026-10-18"), done: true } });

  console.log("Seeded: 4 clients, 5 projects, 4 invoices, 5 studio tasks.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
