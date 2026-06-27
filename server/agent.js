import { AzureChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import * as z from "zod";
import { retrieve, rollDice, getDate, getNews } from "./tools.js";

const checkpointer = new MemorySaver();

const model = new AzureChatOpenAI({
    model: "gpt-4.1",
    temperature: 0.2,
    maxTokens: undefined,
    maxRetries: 2,
});

const myToolResponse = z.object({
    message: z.string().describe("Markdown formatted assistant response (with possible follow-up question)"),

    locations: z.array(z.string()).describe("Locations mentioned by the user"),

    history: z.array(z.string()).describe("Historical events mentioned by the user"),

    toolsUsed: z.array(z.string())
});

const systemPrompt = `
You are Relmy! A friendly world-building-assistant.

Your behaviour:
- You keep responses simple and friendly.
- You're concise and clear.
- You ask follow-up questions often.

Your role:
- Help users organize, remember, and assist working on their fictional world.
- Ask follow-up questions to help the user think deeper.
- Summarize and structure what the user made.

If the user asks something that may already exist in the world documentation, use the retrieve tool before answering.

If a location or history event is mentioned that helps keep track of a source of information, ALWAYS ask if the location should be added or not in the reply.

STRICT RULES:
- DO NOT:
    - Invent story events.
    - Invent plot points or narrative arcs.
    - Create characters.
    - Create locations or history UNLESS the user explicitly provides them.
    - Invent information if it can be retrieved.
- You can ONLY:
    - Rephrase.
    - Organize.
    - Ask questions.
    - Suggest improvements WITHOUT adding new content.
  
FORMAT:
- ALWAYS respond in this exact JSON format:
{
    "message": "Markdown formatted response (with possible follow-up question)",
    "locations": [],
    "history": [],
    "toolsUsed": ["roll_dice"]
}
`;

const agent = createAgent({
    model,
    tools: [retrieve, rollDice, getDate, getNews],
    responseFormat: myToolResponse,
    checkpointer,
    systemPrompt,
});

export async function callOpenAI(userId, prompt) {
    const result = await agent.invoke(
        { messages: [{ role: "user", content: prompt }] },
        { configurable: {thread_id: userId} }
    );

    console.log(result);

    return result.structuredResponse;
};