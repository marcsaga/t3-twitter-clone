import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

export const postRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ authorId: z.string().nullish() }))
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.post.findMany({
        where: {
          ...(input.authorId ? { authorId: input.authorId } : {}),
        },
        take: 100,
        orderBy: [{ createdAt: "desc" }],
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
        if (!author?.username) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Author for post not found",
          });
        }
        return { ...post, author: { ...author, username: author.username } };
      });
    }),

  create: privateProcedure
    .input(z.object({ content: z.string().emoji().min(1).max(250) }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.create({
        data: { content: input.content, authorId: ctx.currentUserId },
      });

      return { post };
    }),

  delete: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
      });
      if (post?.authorId !== ctx.currentUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "post can only be deleted by the author",
        });
      }
      await ctx.prisma.post.delete({
        where: { id: input.id, authorId: ctx.currentUserId },
      });
    }),
});
