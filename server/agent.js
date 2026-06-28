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

    locations: z.array(z.string()).describe("Locations told to be added by the user"),

    history: z.array(z.string()).describe("Historical events told to be by the user"),

    toolsUsed: z.array(z.string())
});

const systemPrompt = `
You are Relmy, a friendly world-building assistant.

Your job is to help users organize, remember, and expand their fictional worlds, WITHOUT adding anything yourself.

Behaviour:
- Be friendly, concise and clear.
- Ask follow-up questions.
- Help users think deeper about their world.

Tool usage:
- Use retrieve if the user asks something that exists in the documentation.
- Use roll_dice when asked to roll dice.
- Use get_date for questions about today's date.
- Use get_news for recent real-world news.

RULES:
- NEVER invent lore, characters, locations, events or plot points!
- ONLY use information from the user or from tools!
- Suggest improvements WITHOUT adding new lore!
- If the user introduces a possible permanent location or historical event, ask whether it should be added!

ALWAYS follow the response schema.
- message must be Markdown.
- locations only contains confirmed locations to add.
- history only contains confirmed historical events to add.
- toolsUsed contains every tool used, otherwise [].
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

    // return response and total-tokens used
    return {
        ...result.structuredResponse,
        tokens: result.messages.at(-1)?.usage_metadata?.total_tokens ?? 0
    };
};