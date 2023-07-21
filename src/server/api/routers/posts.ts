import { clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

function filterUserForClient(user: User) {
  return {
    id: user.id,
    firstName: user.firstName,
    profileImageUrl: user.profileImageUrl,
  };
}

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
    });

    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map((post) => post.authorId),
        limit: 100,
      })
    ).map(filterUserForClient);

    const userById = new Map(users.map((user) => [user.id, user]));

    return posts.map(({ authorId, ...post }) => {
      const author = userById.get(authorId);
      if (!author?.firstName) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Author for post not found",
        });
      }
      return { ...post, author: { ...author, firstName: author.firstName } };
    });
  }),
});
