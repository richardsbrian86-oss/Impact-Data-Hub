import { pgTable, serial, text, numeric, boolean, date, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const donorTierEnum = pgEnum("donor_tier", ["major", "mid_level", "grassroots"]);

export const donorsTable = pgTable("donors", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  tier: donorTierEnum("tier").notNull(),
  totalGiven: numeric("total_given", { precision: 14, scale: 2 }).notNull().default("0"),
  lastGiftAmount: numeric("last_gift_amount", { precision: 14, scale: 2 }),
  lastGiftDate: date("last_gift_date"),
  firstGiftDate: date("first_gift_date"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("donors_tier_idx").on(table.tier),
  index("donors_is_recurring_idx").on(table.isRecurring),
  index("donors_first_gift_date_idx").on(table.firstGiftDate),
  index("donors_last_gift_date_idx").on(table.lastGiftDate),
]);

export const insertDonorSchema = createInsertSchema(donorsTable, {
  firstName: (schema) => schema.max(255),
  lastName: (schema) => schema.max(255),
  email: (schema) => schema.max(255),
  notes: (schema) => schema.max(2000),
}).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDonor = z.infer<typeof insertDonorSchema>;
export type Donor = typeof donorsTable.$inferSelect;
