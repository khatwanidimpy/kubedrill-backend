import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { env } from "../config/env";

const createSessionSchema = z.object({
  trackId: z.string().min(1),
  mode: z.enum(["MOCK_EXAM", "PRACTICE_LAB", "PLAYGROUND"]),
});

export async function createSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const payload = createSessionSchema.parse(req.body);

    if (!env.K8S_PROVISIONER_URL) {
      return res.status(503).json({
        error: "Kubernetes session provisioner is not configured",
        details: {
          requiredEnv: "K8S_PROVISIONER_URL",
          expectedResponse: {
            id: "session id",
            namespace: "user sandbox namespace",
            terminalUrl: "browser terminal websocket/http URL",
            expiresAt: "ISO timestamp",
          },
        },
      });
    }

    const response = await fetch(`${env.K8S_PROVISIONER_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization ?? "",
      },
      body: JSON.stringify({
        ...payload,
        userId: req.user!.sub,
        role: req.user!.role,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(201).json({ session: data.session ?? data });
  } catch (e) {
    next(e);
  }
}

export async function getSession(req: Request, res: Response, next: NextFunction) {
  try {
    if (!env.K8S_PROVISIONER_URL) {
      return res.status(503).json({
        error: "Kubernetes session provisioner is not configured",
      });
    }

    const response = await fetch(`${env.K8S_PROVISIONER_URL}/sessions/${req.params.id}`, {
      headers: { Authorization: req.headers.authorization ?? "" },
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({ session: data.session ?? data });
  } catch (e) {
    next(e);
  }
}
