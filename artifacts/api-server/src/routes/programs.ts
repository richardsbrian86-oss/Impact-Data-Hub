import { Router } from "express";
import { db, programsTable, insertProgramSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { asyncHandler } from "../lib/asyncHandler";
import { parseBody, coerceNumericFields } from "../lib/validate";

const router = Router();

const NUMERIC_FIELDS = ["annualBudget", "costPerOutcome"] as const;

const mapProgram = (p: typeof programsTable.$inferSelect) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  category: p.category,
  status: p.status,
  annualBudget: Number(p.annualBudget),
  peopleServedTarget: p.peopleServedTarget,
  peopleServedActual: p.peopleServedActual,
  outcomesTarget: p.outcomesTarget,
  outcomesActual: p.outcomesActual,
  costPerOutcome: p.costPerOutcome ? Number(p.costPerOutcome) : null,
  startDate: p.startDate,
  endDate: p.endDate,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

router.get("/programs", asyncHandler(async (_req, res) => {
  const rows = await db.select().from(programsTable).orderBy(programsTable.name);
  res.json(rows.map(mapProgram));
}));

router.post("/programs", asyncHandler(async (req, res) => {
  const data = parseBody(insertProgramSchema, coerceNumericFields(req.body, NUMERIC_FIELDS));
  const inserted = await db.insert(programsTable).values(data).returning();
  res.status(201).json(mapProgram(inserted[0]));
}));

router.get("/programs/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const rows = await db.select().from(programsTable).where(eq(programsTable.id, id));
  if (rows.length === 0) { res.status(404).json({ error: "Program not found" }); return; }
  res.json(mapProgram(rows[0]));
}));

router.put("/programs/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const data = parseBody(insertProgramSchema.partial(), coerceNumericFields(req.body, NUMERIC_FIELDS));
  const updated = await db.update(programsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(programsTable.id, id))
    .returning();
  if (updated.length === 0) { res.status(404).json({ error: "Program not found" }); return; }
  res.json(mapProgram(updated[0]));
}));

router.delete("/programs/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  await db.delete(programsTable).where(eq(programsTable.id, id));
  res.status(204).send();
}));

export default router;
