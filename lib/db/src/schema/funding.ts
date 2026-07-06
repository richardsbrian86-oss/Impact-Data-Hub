import { pgTable, serial, text, numeric, date, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fundingSourceEnum = pgEnum("funding_source", ["grants", "individual", "events", "corporate"]);

export const fundingEntriesTable = pgTable("funding_entries", {
  id: serial("id").primaryKey(),
  source: fundingSourceEnum("source").notNull(),
  donor: text("donor"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("funding_date_idx").on(table.date),
  index("funding_source_idx").on(table.source),
]);

export const insertFundingEntrySchema = createInsertSchema(fundingEntriesTable, {
  donor: (schema) => schema.max(255),
  notes: (schema) => schema.max(2000),
}).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundingEntry = z.infer<typeof insertFundingEntrySchema>;
export type FundingEntry = typeof fundingEntriesTable.$inferSelect;
