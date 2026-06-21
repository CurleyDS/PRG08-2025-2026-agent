import { AzureChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import * as z from "zod";

const baseModel = new AzureChatOpenAI({ temperature: 0.2 });

const Builder = z.object({
    message: z.string().describe("Markdown formatted assistant response (with possible follow-up question)"),

    locations: z.array(z.string()).describe("Locations mentioned by the user"),

    history: z.array(z.string()).describe("Historical events mentioned by the user"),
});

const model = baseModel.withStructuredOutput(
    Builder,
    {
        includeRaw: true
    }
);

const userChats = new Map();

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

STRICT RULES:
- DO NOT:
    - Invent story events.
    - Invent plot points or narrative arcs.
    - Create characters.
    - Create locations or history UNLESS the user explicitly provides them.
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
    "history": []
}
`;

// Kijk of er al een chat history is voor die user, zo niet maak er eentje
function getUserChat(userId) {
    if (!userChats.has(userId)) {
        userChats.set(userId, [new SystemMessage(systemPrompt)]);
    }
    return userChats.get(userId);
}

export function getChatHistory(userId) {
    const messages = getUserChat(userId);

    // Format de chat history van de gebruiker
    const formatted = messages.filter(msg => msg.content).map(msg => ({
        text: msg.content,
        sender:
            msg._getType() === "human"
            ? "user"
            : msg._getType() === "ai"
                ? "bot"
                : "system"
    }));
    
    // Verander het 'systemPrompt' naar een introductie-bericht
    formatted[0] = {
        text: `## Hey, I'm Relmy!\nI help with world-building.`,
        sender: "bot"
    };

    // Check chat history
    console.log(`User ${userId}:`, messages);

    return formatted;
}

export async function callAssistant(userId, prompt) {
    const messages = getUserChat(userId);

    // De vraag van de gebruiker toevoegen aan de chat history
    messages.push(new HumanMessage(prompt));

    // AI antwoord ophalen en toevoegen aan chat history
    const result = await model.invoke(messages);
    messages.push(new AIMessage(result.parsed.message));

    // Check chat history
    console.log(`User ${userId}:`, messages);

    result.parsed.tokens = result.raw.usage_metadata.total_tokens;

    return result.parsed;
}