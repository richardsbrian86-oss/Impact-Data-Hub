import { Router } from "express";
import { db, orgProfileTable, insertOrgProfileSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { asyncHandler } from "../lib/asyncHandler";
import { parseBody, coerceNumericFields } from "../lib/validate";

const router = Router();

const mapOrg = (p: typeof orgProfileTable.$inferSelect) => ({
  id: p.id,
  name: p.name,
  mission: p.mission,
  founded: p.founded,
  city: p.city,
  state: p.state,
  website: p.website,
  annualBudget: Number(p.annualBudget),
  fiscalYearStart: p.fiscalYearStart,
  programPct: p.programPct,
  adminPct: p.adminPct,
  fundraisingPct: p.fundraisingPct,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

router.get("/org", asyncHandler(async (_req, res) => {
  const profiles = await db.select().from(orgProfileTable).limit(1);
  if (profiles.length === 0) {
    res.status(404).json({ error: "Organization profile not found" });
    return;
  }
  res.json(mapOrg(profiles[0]));
}));

router.put("/org", asyncHandler(async (req, res) => {
  const data = parseBody(
    insertOrgProfileSchema.partial(),
    coerceNumericFields(req.body, ["annualBudget"]),
  );

  const profiles = await db.select().from(orgProfileTable).limit(1);
  let p;
  if (profiles.length === 0) {
    const inserted = await db.insert(orgProfileTable).values({
      name: data.name ?? "",
      mission: data.mission ?? "",
      founded: data.founded ?? new Date().getFullYear(),
      city: data.city ?? "",
      state: data.state ?? "",
      website: data.website ?? null,
      annualBudget: data.annualBudget ?? "0",
      fiscalYearStart: data.fiscalYearStart ?? "01-01",
      programPct: data.programPct ?? 78,
      adminPct: data.adminPct ?? 14,
      fundraisingPct: data.fundraisingPct ?? 8,
    }).returning();
    p = inserted[0];
  } else {
    const updated = await db.update(orgProfileTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orgProfileTable.id, profiles[0].id))
      .returning();
    p = updated[0];
  }
  res.json(mapOrg(p));
}));

export default router;
