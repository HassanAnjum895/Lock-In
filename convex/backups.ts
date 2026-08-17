import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveBackup = mutation({
  args: {
    anonymousId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_backups")
      .withIndex("by_anonymousId", (q) => q.eq("anonymousId", args.anonymousId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("user_backups", {
        anonymousId: args.anonymousId,
        data: args.data,
        lastUpdated: Date.now(),
      });
    }
  },
});

export const getBackup = query({
  args: {
    anonymousId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user_backups")
      .withIndex("by_anonymousId", (q) => q.eq("anonymousId", args.anonymousId))
      .unique();
  },
});
