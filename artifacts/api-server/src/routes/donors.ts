import { Router } from "express";
import { db, donorsTable, insertDonorSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { asyncHandler } from "../lib/asyncHandler";
import { parseBody, coerceNumericFields } from "../lib/validate";

const router = Router();

const NUMERIC_FIELDS = ["totalGiven", "lastGiftAmount"] as const;

const mapDonor = (d: typeof donorsTable.$inferSelect) => ({
  id: d.id,
  firstName: d.firstName,
  lastName: d.lastName,
  email: d.email,
  phone: d.phone,
  tier: d.tier,
  totalGiven: Number(d.totalGiven),
  lastGiftAmount: d.lastGiftAmount ? Number(d.lastGiftAmount) : null,
  lastGiftDate: d.lastGiftDate,
  firstGiftDate: d.firstGiftDate,
  isRecurring: d.isRecurring,
  notes: d.notes,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

router.get("/donors", asyncHandler(async (req, res) => {
  const { search, tier } = req.query as { search?: string; tier?: string };
  let rows = await db.select().from(donorsTable).orderBy(donorsTable.lastName);

  if (tier && ["major", "mid_level", "grassroots"].includes(tier)) {
    rows = rows.filter(d => d.tier === tier);
  }
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(d =>
      d.firstName.toLowerCase().includes(s) ||
      d.lastName.toLowerCase().includes(s) ||
      d.email.toLowerCase().includes(s)
    );
  }

  res.json(rows.map(mapDonor));
}));

router.post("/donors", asyncHandler(async (req, res) => {
  const data = parseBody(insertDonorSchema, coerceNumericFields(req.body, NUMERIC_FIELDS));
  const inserted = await db.insert(donorsTable).values(data).returning();
  res.status(201).json(mapDonor(inserted[0]));
}));

router.get("/donors/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const rows = await db.select().from(donorsTable).where(eq(donorsTable.id, id));
  if (rows.length === 0) { res.status(404).json({ error: "Donor not found" }); return; }
  res.json(mapDonor(rows[0]));
}));

router.put("/donors/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const data = parseBody(insertDonorSchema.partial(), coerceNumericFields(req.body, NUMERIC_FIELDS));
  const updated = await db.update(donorsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(donorsTable.id, id))
    .returning();
  if (updated.length === 0) { res.status(404).json({ error: "Donor not found" }); return; }
  res.json(mapDonor(updated[0]));
}));

router.delete("/donors/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  await db.delete(donorsTable).where(eq(donorsTable.id, id));
  res.status(204).send();
}));

export default router;
