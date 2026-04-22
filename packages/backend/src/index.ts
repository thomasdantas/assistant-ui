import "dotenv/config";
import cors from "cors";
import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import { streamText } from "ai";
import { z } from "zod";
import { getChatModel } from "./agents/aiModels";

export const app = express();
const port = Number(process.env.PORT ?? 3000);

const chatMessageSchema = z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
});

const questionBodySchema = z
    .object({
        messages: z.array(chatMessageSchema).min(1),
    })
    .refine((data) => data.messages[data.messages.length - 1]?.role === "user", {
        message: "Last message must be from user",
    });

const SYSTEM_PROMPT =
    "You are a helpful assistant. Reply in the same language as the user's message.";

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
});

app.post(
    "/question",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = questionBodySchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ message: "Invalid request body" });
                return;
            }

            const result = streamText({
                model: getChatModel(),
                system: SYSTEM_PROMPT,
                messages: parsed.data.messages,
            });

            result.pipeTextStreamToResponse(res);
        } catch (error) {
            next(error);
        }
    },
);

app.use(
    (_error: unknown, _req: Request, res: Response, _next: NextFunction) => {
        res.status(500).json({ status: "error" });
    },
);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
