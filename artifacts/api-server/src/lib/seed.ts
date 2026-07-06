import { db } from "@workspace/db";
import {
  orgProfileTable, donorsTable, programsTable, fundingEntriesTable, usersTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

/**
 * Seed the initial admin user from ADMIN_EMAIL / ADMIN_PASSWORD secrets.
 * Skips (with a warning) when the secrets are absent, and is idempotent —
 * it never overwrites an existing user with the same email.
 */
export async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    logger.warn(
      "ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user seed. Login will be unavailable until they are configured.",
    );
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (existing.length > 0) return;

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(usersTable).values({
    email,
    passwordHash,
    name: "Admin",
    role: "admin",
  });
  logger.info({ email }, "Admin user created");
}

export async function seedIfEmpty() {
  const orgs = await db.select().from(orgProfileTable).limit(1);
  if (orgs.length > 0) return;

  // Org profile
  await db.insert(orgProfileTable).values({
    name: "Horizon Community Foundation",
    mission: "Empowering underserved communities through education, economic opportunity, and health equity programs.",
    founded: 2004,
    city: "Chicago",
    state: "IL",
    website: "https://horizoncf.org",
    annualBudget: "2840000",
    fiscalYearStart: "01-01",
    programPct: 78,
    adminPct: 14,
    fundraisingPct: 8,
  });

  // Donors
  await db.insert(donorsTable).values([
    { firstName: "Margaret", lastName: "Ellison", email: "m.ellison@gmail.com", phone: "312-555-0101", tier: "major", totalGiven: "125000", lastGiftAmount: "40000", lastGiftDate: "2024-11-15", firstGiftDate: "2015-03-10", isRecurring: true, notes: "Prefers personal outreach. Interested in education programs." },
    { firstName: "Robert", lastName: "Nakamura", email: "rnakamura@vertexcap.com", phone: "312-555-0102", tier: "major", totalGiven: "98500", lastGiftAmount: "35000", lastGiftDate: "2025-01-20", firstGiftDate: "2017-06-01", isRecurring: true, notes: "Corporate sponsor. Board member interest." },
    { firstName: "Diana", lastName: "Flores", email: "dflores@wealthfund.com", phone: "773-555-0103", tier: "major", totalGiven: "75000", lastGiftAmount: "25000", lastGiftDate: "2024-09-30", firstGiftDate: "2019-01-15", isRecurring: false, notes: "Legacy giving prospect." },
    { firstName: "Samuel", lastName: "Okonkwo", email: "s.okonkwo@greenridge.org", phone: "312-555-0104", tier: "major", totalGiven: "60000", lastGiftAmount: "20000", lastGiftDate: "2024-12-01", firstGiftDate: "2018-07-04", isRecurring: true },
    { firstName: "Catherine", lastName: "Weston", email: "cweston@email.com", phone: "847-555-0105", tier: "major", totalGiven: "52000", lastGiftAmount: "18000", lastGiftDate: "2025-02-14", firstGiftDate: "2020-02-14", isRecurring: false },
    { firstName: "Thomas", lastName: "Bergmann", email: "tbergmann@midtown.net", tier: "mid_level", totalGiven: "8500", lastGiftAmount: "2500", lastGiftDate: "2025-01-05", firstGiftDate: "2021-03-20", isRecurring: true },
    { firstName: "Aisha", lastName: "Patel", email: "aisha.patel@gmail.com", phone: "708-555-0107", tier: "mid_level", totalGiven: "7200", lastGiftAmount: "1800", lastGiftDate: "2024-10-10", firstGiftDate: "2022-01-01", isRecurring: true },
    { firstName: "Kevin", lastName: "Morrison", email: "k.morrison@outlook.com", tier: "mid_level", totalGiven: "6100", lastGiftAmount: "1500", lastGiftDate: "2024-08-22", firstGiftDate: "2021-08-22", isRecurring: false },
    { firstName: "Laura", lastName: "Sandoval", email: "lsandoval@yahoo.com", phone: "630-555-0109", tier: "mid_level", totalGiven: "5400", lastGiftAmount: "1200", lastGiftDate: "2025-03-01", firstGiftDate: "2022-05-15", isRecurring: true },
    { firstName: "James", lastName: "Chen", email: "jchen@corporate.com", tier: "mid_level", totalGiven: "4800", lastGiftAmount: "1000", lastGiftDate: "2024-11-28", firstGiftDate: "2023-01-10", isRecurring: false },
    { firstName: "Nicole", lastName: "Williams", email: "nwilliams@gmail.com", tier: "mid_level", totalGiven: "3600", lastGiftAmount: "900", lastGiftDate: "2024-07-04", firstGiftDate: "2022-07-04", isRecurring: true },
    { firstName: "Marcus", lastName: "Thompson", email: "mthompson@email.org", tier: "mid_level", totalGiven: "3100", lastGiftAmount: "750", lastGiftDate: "2024-12-20", firstGiftDate: "2023-03-15", isRecurring: false },
    { firstName: "Priya", lastName: "Sharma", email: "psharma@hotmail.com", tier: "grassroots", totalGiven: "850", lastGiftAmount: "150", lastGiftDate: "2025-01-15", firstGiftDate: "2023-06-01", isRecurring: true },
    { firstName: "David", lastName: "Kim", email: "david.kim@gmail.com", tier: "grassroots", totalGiven: "620", lastGiftAmount: "100", lastGiftDate: "2024-09-12", firstGiftDate: "2023-09-12", isRecurring: false },
    { firstName: "Susan", lastName: "Larson", email: "slarson@gmail.com", tier: "grassroots", totalGiven: "480", lastGiftAmount: "80", lastGiftDate: "2025-02-28", firstGiftDate: "2024-01-01", isRecurring: true },
    { firstName: "Anthony", lastName: "Rivera", email: "arivera@yahoo.com", tier: "grassroots", totalGiven: "350", lastGiftAmount: "50", lastGiftDate: "2024-11-01", firstGiftDate: "2024-02-14", isRecurring: false },
    { firstName: "Rachel", lastName: "Green", email: "rgreen@email.com", tier: "grassroots", totalGiven: "280", lastGiftAmount: "50", lastGiftDate: "2024-06-30", firstGiftDate: "2024-06-30", isRecurring: false },
    { firstName: "Carlos", lastName: "Mendez", email: "cmendez@gmail.com", tier: "grassroots", totalGiven: "200", lastGiftAmount: "25", lastGiftDate: "2025-01-31", firstGiftDate: "2024-08-01", isRecurring: true },
  ]);

  // Programs
  await db.insert(programsTable).values([
    {
      name: "Youth Education Initiative",
      description: "After-school tutoring, college prep, and STEM enrichment for students in underserved neighborhoods.",
      category: "Education",
      status: "active",
      annualBudget: "680000",
      peopleServedTarget: 1200,
      peopleServedActual: 1087,
      outcomesTarget: 480,
      outcomesActual: 412,
      costPerOutcome: "1650",
      startDate: "2024-01-01",
    },
    {
      name: "Economic Opportunity Center",
      description: "Job training, resume workshops, and employer partnerships to reduce unemployment in the south side.",
      category: "Economic Development",
      status: "active",
      annualBudget: "520000",
      peopleServedTarget: 600,
      peopleServedActual: 584,
      outcomesTarget: 320,
      outcomesActual: 301,
      costPerOutcome: "1728",
      startDate: "2023-06-01",
    },
    {
      name: "Community Health Clinic",
      description: "Free primary care, mental health counseling, and wellness education for uninsured residents.",
      category: "Health",
      status: "active",
      annualBudget: "740000",
      peopleServedTarget: 2000,
      peopleServedActual: 1842,
      outcomesTarget: 1400,
      outcomesActual: 1298,
      costPerOutcome: "570",
      startDate: "2022-01-01",
    },
    {
      name: "Housing Stability Program",
      description: "Emergency rental assistance, tenant rights education, and transitional housing support.",
      category: "Housing",
      status: "active",
      annualBudget: "420000",
      peopleServedTarget: 350,
      peopleServedActual: 287,
      outcomesTarget: 220,
      outcomesActual: 175,
      costPerOutcome: "2400",
      startDate: "2024-03-01",
    },
    {
      name: "Digital Literacy Program",
      description: "Technology training and device access for seniors and adults to bridge the digital divide.",
      category: "Education",
      status: "active",
      annualBudget: "180000",
      peopleServedTarget: 500,
      peopleServedActual: 463,
      outcomesTarget: 380,
      outcomesActual: 344,
      costPerOutcome: "523",
      startDate: "2023-09-01",
    },
    {
      name: "Food Security Network",
      description: "Mobile food pantry and nutrition education serving food-insecure families citywide.",
      category: "Basic Needs",
      status: "paused",
      annualBudget: "95000",
      peopleServedTarget: 800,
      peopleServedActual: 420,
      outcomesTarget: 600,
      outcomesActual: 310,
      costPerOutcome: "306",
      startDate: "2023-01-01",
      endDate: "2024-06-30",
    },
  ]);

  // Funding entries — 24 months of realistic data
  const currentYear = new Date().getFullYear();
  const entries: Array<{
    source: "grants" | "individual" | "events" | "corporate";
    donor?: string;
    amount: string;
    date: string;
    notes?: string;
  }> = [];

  const months: string[] = [];
  for (let y = currentYear - 1; y <= currentYear; y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === currentYear && m > new Date().getMonth() + 1) break;
      months.push(`${y}-${String(m).padStart(2, "0")}`);
    }
  }

  // Grant funding (large chunks, quarterly)
  const grantDonors = ["Illinois Arts Council", "Robert Wood Johnson Foundation", "Kresge Foundation", "MacArthur Foundation", "W.K. Kellogg Foundation", "Chicago Community Trust"];
  months.forEach((month, i) => {
    if (i % 3 === 0) {
      entries.push({
        source: "grants",
        donor: grantDonors[i % grantDonors.length],
        amount: String(Math.round((80000 + Math.random() * 60000) * 100) / 100),
        date: `${month}-15`,
        notes: "Quarterly grant disbursement",
      });
    }
  });

  // Individual giving (monthly)
  months.forEach((month, i) => {
    const count = 3 + Math.floor(Math.random() * 4);
    for (let j = 0; j < count; j++) {
      entries.push({
        source: "individual",
        amount: String(Math.round((500 + Math.random() * 8000) * 100) / 100),
        date: `${month}-${String(Math.floor(1 + Math.random() * 27)).padStart(2, "0")}`,
      });
    }
  });

  // Corporate donations (bimonthly)
  const corpDonors = ["Vertex Capital", "Midtown Partners", "BlueCross BlueShield", "Deloitte", "JPMorgan Chase"];
  months.forEach((month, i) => {
    if (i % 2 === 0) {
      entries.push({
        source: "corporate",
        donor: corpDonors[i % corpDonors.length],
        amount: String(Math.round((15000 + Math.random() * 25000) * 100) / 100),
        date: `${month}-10`,
        notes: "Corporate partnership contribution",
      });
    }
  });

  // Event revenue (periodic)
  const events = [
    { name: "Annual Gala", month: "03", amount: 85000 },
    { name: "5K Fun Run", month: "05", amount: 24000 },
    { name: "Fall Auction", month: "10", amount: 62000 },
    { name: "Holiday Campaign", month: "12", amount: 38000 },
  ];
  for (const y of [currentYear - 1, currentYear]) {
    for (const ev of events) {
      const d = new Date();
      if (y === currentYear && parseInt(ev.month) > d.getMonth() + 1) continue;
      entries.push({
        source: "events",
        donor: ev.name,
        amount: String(Math.round((ev.amount * (0.9 + Math.random() * 0.2)) * 100) / 100),
        date: `${y}-${ev.month}-20`,
        notes: ev.name,
      });
    }
  }

  if (entries.length > 0) {
    await db.insert(fundingEntriesTable).values(entries);
  }
}
