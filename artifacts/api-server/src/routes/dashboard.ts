import { Router } from "express";
import { db } from "@workspace/db";
import { donorsTable, programsTable, fundingEntriesTable, orgProfileTable } from "@workspace/db";

const router = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const allFunding = await db.select().from(fundingEntriesTable);
  const ytdFunding = allFunding.filter(e => e.date?.startsWith(String(currentYear)));
  const lastYearFunding = allFunding.filter(e => e.date?.startsWith(String(lastYear)));

  const totalFundingYTD = ytdFunding.reduce((s, e) => s + Number(e.amount), 0);
  const totalFundingLastYear = lastYearFunding.reduce((s, e) => s + Number(e.amount), 0);
  const fundingChange = totalFundingLastYear > 0
    ? ((totalFundingYTD - totalFundingLastYear) / totalFundingLastYear) * 100
    : 0;

  const allDonors = await db.select().from(donorsTable);
  const totalDonors = allDonors.length;

  // Real year-over-year donor count change using firstGiftDate
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgo.toISOString().substring(0, 10);
  const priorDonorCount = allDonors.filter(d => d.firstGiftDate && d.firstGiftDate <= oneYearAgoStr).length;
  const totalDonorsChange = priorDonorCount > 0
    ? ((totalDonors - priorDonorCount) / priorDonorCount) * 100
    : 0;

  const programs = await db.select().from(programsTable);
  const activePrograms = programs.filter(p => p.status === "active");
  const totalPeopleServed = activePrograms.reduce((s, p) => s + p.peopleServedActual, 0);

  const orgRows = await db.select().from(orgProfileTable).limit(1);
  const org = orgRows[0];
  const annualBudget = org ? Number(org.annualBudget) : 2800000;
  const programPct = org?.programPct ?? 78;
  const adminPct = org?.adminPct ?? 14;
  const fundraisingPct = org?.fundraisingPct ?? 8;

  const programSpend = annualBudget * (programPct / 100);
  const programExpenseRatio = programPct;

  const isRecurringDonors = allDonors.filter(d => d.isRecurring).length;
  const retentionRate = totalDonors > 0 ? (isRecurringDonors / totalDonors) * 100 : 0;
  const totalGiven = allDonors.reduce((s, d) => s + Number(d.totalGiven), 0);
  const averageGiftSize = totalDonors > 0 ? totalGiven / totalDonors : 0;

  res.json({
    totalFundingYTD,
    totalFundingYTDChange: fundingChange,
    totalDonors,
    totalDonorsChange,
    activeProgramsCount: activePrograms.length,
    totalPeopleServed,
    totalPeopleServedChange: null,
    programExpenseRatio,
    programExpenseRatioChange: null,
    donorRetentionRate: retentionRate,
    averageGiftSize,
  });
});

router.get("/dashboard/funding-trend", async (req, res): Promise<void> => {
  const allFunding = await db.select().from(fundingEntriesTable);

  const monthMap: Record<string, { grants: number; individual: number; events: number; corporate: number }> = {};
  for (const e of allFunding) {
    if (!e.date) continue;
    const key = e.date.substring(0, 7);
    if (!monthMap[key]) monthMap[key] = { grants: 0, individual: 0, events: 0, corporate: 0 };
    monthMap[key][e.source as keyof typeof monthMap[string]] += Number(e.amount);
  }

  const sortedMonths = Object.keys(monthMap).sort().slice(-24);
  const result = sortedMonths.map(month => ({
    month,
    grants: monthMap[month].grants,
    individual: monthMap[month].individual,
    events: monthMap[month].events,
    corporate: monthMap[month].corporate,
    total: monthMap[month].grants + monthMap[month].individual + monthMap[month].events + monthMap[month].corporate,
  }));

  res.json(result);
});

router.get("/dashboard/donor-trends", async (req, res): Promise<void> => {
  const allDonors = await db.select().from(donorsTable);

  // Tier breakdown
  const tierMap: Record<string, { count: number; totalGiven: number }> = {
    major: { count: 0, totalGiven: 0 },
    mid_level: { count: 0, totalGiven: 0 },
    grassroots: { count: 0, totalGiven: 0 },
  };
  let grandTotal = 0;
  for (const d of allDonors) {
    tierMap[d.tier].count++;
    tierMap[d.tier].totalGiven += Number(d.totalGiven);
    grandTotal += Number(d.totalGiven);
  }

  const tierBreakdown = Object.entries(tierMap).map(([tier, data]) => ({
    tier,
    count: data.count,
    totalGiven: data.totalGiven,
    percentage: grandTotal > 0 ? (data.totalGiven / grandTotal) * 100 : 0,
  }));

  // Real monthly trend derived from donor date columns
  const now = new Date();
  const monthly = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthStartStr = monthStart.toISOString().substring(0, 10);
    const monthEndStr = monthEnd.toISOString().substring(0, 10);

    // New: first gift fell within this calendar month
    const newDonors = allDonors.filter(d =>
      d.firstGiftDate && d.firstGiftDate >= monthStartStr && d.firstGiftDate <= monthEndStr
    ).length;

    // Lapsed: last gift was in the month exactly 12 months prior (crossed 12-month inactivity threshold)
    const lapsedMonthStart = new Date(monthStart.getFullYear() - 1, monthStart.getMonth(), 1);
    const lapsedMonthEnd = new Date(monthStart.getFullYear() - 1, monthStart.getMonth() + 1, 0);
    const lapsedStartStr = lapsedMonthStart.toISOString().substring(0, 10);
    const lapsedEndStr = lapsedMonthEnd.toISOString().substring(0, 10);
    const lapsedDonors = allDonors.filter(d =>
      d.lastGiftDate && d.lastGiftDate >= lapsedStartStr && d.lastGiftDate <= lapsedEndStr
    ).length;

    // Retained: first gift before this month AND last gift within the 12 months preceding end of this month
    const twelveMonthsBeforeEnd = new Date(monthEnd.getFullYear() - 1, monthEnd.getMonth(), monthEnd.getDate());
    const twelveMonthsBeforeEndStr = twelveMonthsBeforeEnd.toISOString().substring(0, 10);
    const retainedDonors = allDonors.filter(d =>
      d.firstGiftDate && d.lastGiftDate &&
      d.firstGiftDate < monthStartStr &&
      d.lastGiftDate >= twelveMonthsBeforeEndStr &&
      d.lastGiftDate <= monthEndStr
    ).length;

    // Cumulative total: donors with firstGiftDate on or before end of this month
    const total = allDonors.filter(d =>
      d.firstGiftDate && d.firstGiftDate <= monthEndStr
    ).length;

    const month = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;
    monthly.push({ month, newDonors, retainedDonors, lapsedDonors, total });
  }

  const recurringCount = allDonors.filter(d => d.isRecurring).length;
  const retentionRate = allDonors.length > 0 ? (recurringCount / allDonors.length) * 100 : 0;
  const totalGiven = allDonors.reduce((s, d) => s + Number(d.totalGiven), 0);
  const averageGiftSize = allDonors.length > 0 ? totalGiven / allDonors.length : 0;

  res.json({ monthly, tierBreakdown, retentionRate, averageGiftSize });
});

router.get("/dashboard/program-outcomes", async (req, res): Promise<void> => {
  const programs = await db.select().from(programsTable);
  const result = programs.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    status: p.status,
    peopleServedTarget: p.peopleServedTarget,
    peopleServedActual: p.peopleServedActual,
    peopleServedPct: p.peopleServedTarget > 0 ? (p.peopleServedActual / p.peopleServedTarget) * 100 : 0,
    outcomesTarget: p.outcomesTarget,
    outcomesActual: p.outcomesActual,
    outcomesPct: p.outcomesTarget > 0 ? (p.outcomesActual / p.outcomesTarget) * 100 : 0,
    annualBudget: Number(p.annualBudget),
    costPerOutcome: p.costPerOutcome ? Number(p.costPerOutcome) : null,
  }));
  res.json(result);
});

router.get("/dashboard/operational-metrics", async (req, res): Promise<void> => {
  const orgRows = await db.select().from(orgProfileTable).limit(1);
  const org = orgRows[0];
  const totalBudget = org ? Number(org.annualBudget) : 2800000;
  const programPct = org?.programPct ?? 78;
  const adminPct = org?.adminPct ?? 14;
  const fundraisingPct = org?.fundraisingPct ?? 8;

  const programSpend = totalBudget * (programPct / 100);
  const adminSpend = totalBudget * (adminPct / 100);
  const fundraisingSpend = totalBudget * (fundraisingPct / 100);

  // Real cost trend: sum actual funding per year, split by org percentages
  const allFunding = await db.select().from(fundingEntriesTable);
  const currentYear = new Date().getFullYear();
  const costTrend = [];
  for (let y = currentYear - 4; y <= currentYear; y++) {
    const yearFunding = allFunding.filter(e => e.date?.startsWith(String(y)));
    const yearTotal = yearFunding.reduce((s, e) => s + Number(e.amount), 0);
    costTrend.push({
      year: String(y),
      programCosts: Math.round(yearTotal * (programPct / 100)),
      adminCosts: Math.round(yearTotal * (adminPct / 100)),
      fundraisingCosts: Math.round(yearTotal * (fundraisingPct / 100)),
    });
  }

  res.json({
    programExpenseRatio: programPct,
    adminExpenseRatio: adminPct,
    fundraisingExpenseRatio: fundraisingPct,
    totalBudget,
    programSpend,
    adminSpend,
    fundraisingSpend,
    costTrend,
  });
});

export default router;
