import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const orgProfileTable = pgTable("org_profile", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mission: text("mission").notNull(),
  founded: integer("founded").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  website: text("website"),
  annualBudget: numeric("annual_budget", { precision: 14, scale: 2 }).notNull(),
  fiscalYearStart: text("fiscal_year_start").notNull().default("01-01"),
  programPct: integer("program_pct").notNull().default(78),
  adminPct: integer("admin_pct").notNull().default(14),
  fundraisingPct: integer("fundraising_pct").notNull().default(8),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrgProfileSchema = createInsertSchema(orgProfileTable, {
  name: (schema) => schema.max(255),
  mission: (schema) => schema.max(2000),
  city: (schema) => schema.max(255),
  state: (schema) => schema.max(255),
  website: (schema) => schema.max(255),
}).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrgProfile = z.infer<typeof insertOrgProfileSchema>;
export type OrgProfile = typeof orgProfileTable.$inferSelect;
