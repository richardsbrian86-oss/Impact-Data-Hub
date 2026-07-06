import { Router } from "express";
import { db, fundingEntriesTable, insertFundingEntrySchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { asyncHandler } from "../lib/asyncHandler";
import { parseBody, coerceNumericFields } from "../lib/validate";

const router = Router();

const NUMERIC_FIELDS = ["amount"] as const;

const mapEntry = (e: typeof fundingEntriesTable.$inferSelect) => ({
  id: e.id,
  source: e.source,
  donor: e.donor,
  amount: Number(e.amount),
  date: e.date,
  notes: e.notes,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
});

router.get("/funding", asyncHandler(async (req, res) => {
  const { source, year } = req.query as { source?: string; year?: string };
  let rows = await db.select().from(fundingEntriesTable).orderBy(fundingEntriesTable.date);

  if (source && ["grants", "individual", "events", "corporate"].includes(source)) {
    rows = rows.filter(e => e.source === source);
  }
  if (year) {
    rows = rows.filter(e => e.date?.startsWith(year));
  }
  res.json(rows.map(mapEntry));
}));

router.post("/funding", asyncHandler(async (req, res) => {
  const data = parseBody(insertFundingEntrySchema, coerceNumericFields(req.body, NUMERIC_FIELDS));
  const inserted = await db.insert(fundingEntriesTable).values(data).returning();
  res.status(201).json(mapEntry(inserted[0]));
}));

router.get("/funding/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const rows = await db.select().from(fundingEntriesTable).where(eq(fundingEntriesTable.id, id));
  if (rows.length === 0) { res.status(404).json({ error: "Funding entry not found" }); return; }
  res.json(mapEntry(rows[0]));
}));

router.put("/funding/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const data = parseBody(insertFundingEntrySchema.partial(), coerceNumericFields(req.body, NUMERIC_FIELDS));
  const updated = await db.update(fundingEntriesTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(fundingEntriesTable.id, id))
    .returning();
  if (updated.length === 0) { res.status(404).json({ error: "Funding entry not found" }); return; }
  res.json(mapEntry(updated[0]));
}));

router.delete("/funding/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  await db.delete(fundingEntriesTable).where(eq(fundingEntriesTable.id, id));
  res.status(204).send();
}));

export default router;
