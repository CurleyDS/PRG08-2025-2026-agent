import { AzureChatOpenAI } from "@langchain/openai"
import { MemorySaver } from "@langchain/langgraph";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import * as z from "zod";
import { createAgent } from "langchain";
import { retrieve, rollDice, getDate, getNews } from "./tools.js";

const checkpointer = new MemorySaver();
// const baseModel = new AzureChatOpenAI({
//     model: "gpt-4.1",
//     temperature: 0.2,
//     maxTokens: undefined,
//     maxRetries: 2,
// });

const myToolResponse = z.object({
    message: z.string().describe("Markdown formatted assistant response (with possible follow-up question)"),

    locations: z.array(z.string()).describe("Locations mentioned by the user"),

    history: z.array(z.string()).describe("Historical events mentioned by the user"),

    toolsUsed: z.array(z.string())
});

// const model = baseModel.withStructuredOutput(
//     Builder,
//     {
//         includeRaw: true
//     }
// );

const model = new AzureChatOpenAI({
    model: "gpt-4.1",
    temperature: 0.2,
    maxTokens: undefined,
    maxRetries: 2,
});

// const userChats = new Map();

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

// (OLD) Kijk of er al een chat history is voor die user, zo niet maak er eentje
// function getUserChat(userId) {
//     if (!userChats.has(userId)) {
//         userChats.set(userId, [new SystemMessage(systemPrompt)]);
//     }
//     return userChats.get(userId);
// }

// export function getChatHistory(userId) {
//     const messages = getUserChat(userId);

//     // Format de chat history van de gebruiker
//     const formatted = messages.filter(msg => msg.content).map(msg => ({
//         text: msg.content,
//         sender:
//             msg._getType() === "human"
//             ? "user"
//             : msg._getType() === "ai"
//                 ? "bot"
//                 : "system"
//     }));
    
//     // Verander het 'systemPrompt' naar een introductie-bericht
//     formatted[0] = {
//         text: `## Hey, I'm Relmy!\nI help with world-building.`,
//         sender: "bot"
//     };

//     // Check chat history
//     console.log(`User ${userId}:`, messages);

//     return formatted;
// }

const agent = createAgent({
    model,
    tools: [retrieve, rollDice, getDate, getNews],
    responseFormat: myToolResponse,
    checkpointer,
    systemPrompt,
});

// export async function callAgent(userId, prompt) {
//     const messages = getUserChat(userId);

//     // De vraag van de gebruiker toevoegen aan de chat history
//     messages.push(new HumanMessage(prompt));

//     // AI antwoord ophalen en toevoegen aan chat history
//     const result = await agent.invoke(messages);
//     messages.push(new AIMessage(result.parsed.message));

//     // Check chat history
//     console.log(`User ${userId}:`, messages);

//     result.parsed.tokens = result.raw.usage_metadata.total_tokens;

//     return result.parsed;
// }

export async function callAgent(userId, prompt) {
    const result = await agent.invoke(
        { messages: [{ role: "user", content: prompt }] },
        { configurable: {thread_id: userId} }
    );

    console.log(result);

    return result.structuredResponse;
}