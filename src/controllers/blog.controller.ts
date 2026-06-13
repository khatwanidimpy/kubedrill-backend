import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";

const blogSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(180),
  slug: z
    .string()
    .min(1)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  excerpt: z.string().min(1).max(500),
  content: z.string().min(1).max(20000),
  category: z.string().min(1).max(80),
  published: z.boolean().default(false),
});

type BlogWithAuthor = Prisma.BlogPostGetPayload<{
  include: { author: { select: { name: true } } };
}>;

function toBlogPost(post: BlogWithAuthor) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    published: post.published,
    authorName: post.author.name,
    createdAt: post.created_at.toISOString(),
    updatedAt: post.updated_at.toISOString(),
    publishedAt: post.published_at?.toISOString() ?? null,
  };
}

function publishDate(published: boolean, current?: Date | null) {
  if (!published) return null;
  return current ?? new Date();
}

export async function listBlogPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const where = req.user?.role === "ADMIN" ? {} : { published: true };
    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: [{ published_at: "desc" }, { created_at: "desc" }],
      include: { author: { select: { name: true } } },
    });
    res.json({ posts: posts.map(toBlogPost) });
  } catch (e) {
    next(e);
  }
}

export async function getBlogPost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug },
      include: { author: { select: { name: true } } },
    });
    if (!post || (!post.published && req.user?.role !== "ADMIN")) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    res.json({ post: toBlogPost(post) });
  } catch (e) {
    next(e);
  }
}

export async function createBlogPost(req: Request, res: Response, next: NextFunction) {
  try {
    const data = blogSchema.parse(req.body);
    const post = await prisma.blogPost.create({
      data: {
        id: data.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        published: data.published,
        published_at: publishDate(data.published),
        author_id: req.user!.sub,
      },
      include: { author: { select: { name: true } } },
    });
    res.status(201).json({ post: toBlogPost(post) });
  } catch (e) {
    next(e);
  }
}

export async function updateBlogPost(req: Request, res: Response, next: NextFunction) {
  try {
    const data = blogSchema.parse({ ...req.body, id: req.params.id });
    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Blog post not found" });

    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        published: data.published,
        published_at: publishDate(data.published, existing.published_at),
      },
      include: { author: { select: { name: true } } },
    });
    res.json({ post: toBlogPost(post) });
  } catch (e) {
    next(e);
  }
}

export async function deleteBlogPost(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return res.status(404).json({ error: "Blog post not found" });
    }
    next(e);
  }
}
