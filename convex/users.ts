import { query } from "./_generated/server";

/** Profile info for the signed-in user, for showing in the account panel. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return {
      name: identity.name ?? null,
      email: identity.email ?? null,
      pictureUrl: identity.pictureUrl ?? null,
    };
  },
});
