import { pgTable, serial, text, integer, numeric, date, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const programStatusEnum = pgEnum("program_status", ["active", "paused", "completed"]);

export const programsTable = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  status: programStatusEnum("status").notNull().default("active"),
  annualBudget: numeric("annual_budget", { precision: 14, scale: 2 }).notNull(),
  peopleServedTarget: integer("people_served_target").notNull(),
  peopleServedActual: integer("people_served_actual").notNull().default(0),
  outcomesTarget: integer("outcomes_target").notNull(),
  outcomesActual: integer("outcomes_actual").notNull().default(0),
  costPerOutcome: numeric("cost_per_outcome", { precision: 10, scale: 2 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("programs_status_idx").on(table.status),
]);

export const insertProgramSchema = createInsertSchema(programsTable, {
  name: (schema) => schema.max(255),
  description: (schema) => schema.max(2000),
  category: (schema) => schema.max(255),
}).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programsTable.$inferSelect;
