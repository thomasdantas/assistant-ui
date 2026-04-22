import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const getChatModel = () =>
    openai(process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini");
