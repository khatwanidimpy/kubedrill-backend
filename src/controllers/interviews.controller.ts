import { Request, Response, NextFunction } from "express";
import { Prisma, QuestionType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";

const categories = [
  "Kubernetes",
  "Docker",
  "Helm",
  "CI/CD",
  "Networking",
  "Monitoring",
  "Linux",
  "Terraform",
] as const;

const answerSchema = z.object({
  questionId: z.string().min(1),
  value: z.union([z.string(), z.number()]),
});

const questionSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["MCQ", "CODE"]),
    category: z.enum(categories),
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).optional(),
    correctIndex: z.number().int().min(0).optional(),
    starterCode: z.string().optional(),
    expectedAnswer: z.string().optional(),
  })
  .superRefine((question, ctx) => {
    if (question.type === "MCQ") {
      if (!question.options || question.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "MCQ questions need at least two options",
        });
      }
      if (
        question.correctIndex === undefined ||
        (question.options && question.correctIndex >= question.options.length)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correctIndex"],
          message: "Correct option index is invalid",
        });
      }
    }
  });

const interviewSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  durationMinutes: z.number().int().min(1).max(480),
  category: z.enum(categories),
  published: z.boolean().default(false),
  questions: z.array(questionSchema).min(1),
});

const submitSchema = z.object({
  answers: z.array(answerSchema),
});

type InterviewWithQuestions = Prisma.InterviewGetPayload<{
  include: { questions: { orderBy: { order: "asc" } } };
}>;

function toInterview(interview: InterviewWithQuestions) {
  return {
    id: interview.id,
    title: interview.title,
    description: interview.description,
    difficulty: interview.difficulty,
    durationMinutes: interview.duration_minutes,
    category: interview.category,
    published: interview.published,
    questions: interview.questions.map((question) => ({
      id: question.id,
      type: question.type,
      category: question.category,
      prompt: question.prompt,
      options: Array.isArray(question.options)
        ? (question.options as string[])
        : undefined,
      correctIndex: question.correct_index ?? undefined,
      starterCode: question.starter_code ?? undefined,
      expectedAnswer: question.expected_answer ?? undefined,
    })),
  };
}

function toResult(
  attempt: Prisma.AttemptGetPayload<{ include: { interview: true } }>,
) {
  return {
    id: attempt.id,
    interviewId: attempt.interview_id,
    interviewTitle: attempt.interview.title,
    score: attempt.score,
    total: attempt.total,
    correct: attempt.correct,
    submittedAt: attempt.submitted_at.toISOString(),
    answers: attempt.answers,
  };
}

function questionInput(question: z.infer<typeof questionSchema>, order: number) {
  return {
    id: question.id,
    type: question.type as QuestionType,
    category: question.category,
    prompt: question.prompt,
    options: question.type === "MCQ" ? question.options ?? [] : Prisma.JsonNull,
    correct_index: question.type === "MCQ" ? question.correctIndex ?? 0 : null,
    starter_code: question.type === "CODE" ? question.starterCode ?? "" : null,
    expected_answer: question.type === "CODE" ? question.expectedAnswer ?? "" : null,
    order,
  };
}

export async function listInterviews(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const where = req.user?.role === "ADMIN" ? {} : { published: true };
    const interviews = await prisma.interview.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    res.json({ interviews: interviews.map(toInterview) });
  } catch (e) {
    next(e);
  }
}

export async function getInterview(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const interview = await prisma.interview.findUnique({
      where: { id: req.params.id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!interview) return res.status(404).json({ error: "Interview not found" });
    if (!interview.published && req.user?.role !== "ADMIN") {
      return res.status(404).json({ error: "Interview not found" });
    }
    res.json({ interview: toInterview(interview) });
  } catch (e) {
    next(e);
  }
}

export async function createInterview(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = interviewSchema.parse(req.body);
    const interview = await prisma.interview.create({
      data: {
        id: data.id,
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        duration_minutes: data.durationMinutes,
        category: data.category,
        published: data.published,
        questions: {
          create: data.questions.map((question, index) =>
            questionInput(question, index),
          ),
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    res.status(201).json({ interview: toInterview(interview) });
  } catch (e) {
    next(e);
  }
}

export async function updateInterview(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = interviewSchema.parse({ ...req.body, id: req.params.id });
    const exists = await prisma.interview.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: "Interview not found" });

    const interview = await prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { interview_id: req.params.id } });
      return tx.interview.update({
        where: { id: req.params.id },
        data: {
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          duration_minutes: data.durationMinutes,
          category: data.category,
          published: data.published,
          questions: {
            create: data.questions.map((question, index) =>
              questionInput(question, index),
            ),
          },
        },
        include: { questions: { orderBy: { order: "asc" } } },
      });
    });

    res.json({ interview: toInterview(interview) });
  } catch (e) {
    next(e);
  }
}

export async function deleteInterview(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await prisma.interview.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Interview not found" });
    }
    next(e);
  }
}

export async function submitInterview(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { answers } = submitSchema.parse(req.body);
    const interview = await prisma.interview.findUnique({
      where: { id: req.params.id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!interview || (!interview.published && req.user?.role !== "ADMIN")) {
      return res.status(404).json({ error: "Interview not found" });
    }

    const byQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
    let correct = 0;

    for (const question of interview.questions) {
      const answer = byQuestion.get(question.id);
      if (!answer) continue;
      if (question.type === "MCQ" && answer.value === question.correct_index) {
        correct++;
      }
      if (
        question.type === "CODE" &&
        typeof answer.value === "string" &&
        question.expected_answer &&
        answer.value.trim() === question.expected_answer.trim()
      ) {
        correct++;
      }
    }

    const total = interview.questions.length;
    const attempt = await prisma.attempt.create({
      data: {
        interview_id: interview.id,
        user_id: req.user!.sub,
        score: total ? Math.round((correct / total) * 100) : 0,
        total,
        correct,
        answers,
      },
      include: { interview: true },
    });

    res.status(201).json({ result: toResult(attempt) });
  } catch (e) {
    next(e);
  }
}

export async function listResults(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const attempts = await prisma.attempt.findMany({
      where: { user_id: req.user!.sub },
      orderBy: { submitted_at: "desc" },
      include: { interview: true },
    });
    res.json({ results: attempts.map(toResult) });
  } catch (e) {
    next(e);
  }
}

export async function getResult(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const attempt = await prisma.attempt.findFirst({
      where: { id: req.params.id, user_id: req.user!.sub },
      include: { interview: true },
    });
    if (!attempt) return res.status(404).json({ error: "Result not found" });
    res.json({ result: toResult(attempt) });
  } catch (e) {
    next(e);
  }
}
