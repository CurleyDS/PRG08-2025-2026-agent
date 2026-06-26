import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

// vector store laden
const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
})

const vectorStore = await FaissStore.load("./documents", embeddings);
console.log("✅ vector store loaded!")

// zoek relevante documenten
const relevantDocs = await vectorStore.similaritySearch("What is Blanca?", 1);
const context = relevantDocs.map(doc => doc.pageContent).join("\n\n")
console.log("✅ found relevant documents!")

// vraag stellen aan chatGPT4.1
const model = new AzureChatOpenAI({ temperature: 0.2 })
const response = await model.invoke(`
Question:
What is Blanca?

Context:
${context}

Answer ONLY using the context.
`);

console.log(result.content)