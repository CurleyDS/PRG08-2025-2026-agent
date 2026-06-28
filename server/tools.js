import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

import { tool } from "langchain";

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

// load documents from vectorStore
const vectorStore = await FaissStore.load("./documents", embeddings);
console.log("✅ vector store loaded!");

// retrieve documents
export const retrieve = tool(
    async ({ query }) => {
        console.log("🔧 Now searching the document store!");
        const relevantDocs = await vectorStore.similaritySearch(query, 2);
        const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");
        return context;
    },
    {
        name: "retrieve",
        description: "Searches the world lore documents.",
        schema: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
            additionalProperties: false
        }
    }
);

// rolls dice
export const rollDice = tool(
    ({ sides }) => {
        console.log(`🔧 I roll a ${sides}-sided die!`);
        const result = Math.floor(Math.random() * sides) + 1;
        return `Ik gooide een ${result}`;
    },
    {
        name: "roll_dice",
        description: "Roll a dice with a given amount of sides",
        schema: {
            type: "object",
            properties: {
                sides: { type: "string" },
            },
            required: ["sides"],
            additionalProperties: false
        }
    }
);

// get date
export const getDate = tool(
    () => {
        console.log(`🔧 Getting the date!`);
        const today = new Date();
        const readableDate = today.toLocaleDateString("nl-NL", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        return readableDate;
    },
    {
        name: "get_date",
        description: "Get the date",
        schema: {
            type: "object",
            properties: {},
            required: [],
            additionalProperties: false
        }
    }
);

// get news
export const getNews = tool(
    async ({ query }) => {
        console.log(`🔧 Het nieuws wordt opgehaald!`)
        const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.TAVILY_API_KEY}`,
            },
            body: JSON.stringify({
                query: query,
                search_depth: "basic",  // "advanced" for deeper results
                include_answer: true,   // Tavily summarizes the results
            }),
        });
        const data = await res.json();
        return data;
    },
    {
        name: "get_news",
        description: "Get the news based on the query",
        schema: {
            type: "object",
            properties: {
                query: { type: "string" },
            },
            required: ["query"],
            additionalProperties: false
        },
    },
);