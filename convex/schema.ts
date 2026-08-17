import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  user_backups: defineTable({
    anonymousId: v.string(),
    data: v.any(), // the whole app state: theme, schedule, tasks, timer, savings, projects
    lastUpdated: v.number(),
  }).index("by_anonymousId", ["anonymousId"]),
});
