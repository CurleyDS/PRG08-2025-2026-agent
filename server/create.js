import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { AzureOpenAIEmbeddings } from "@langchain/openai";
// import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

// laad tekstbestand
const loader = new TextLoader("./public/worldlore.txt");
const docs = await loader.load();

// opsplitsen
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 50,
    chunkOverlap: 10
    // chunkSize: 1000,
    // chunkOverlap: 200
});
const chunks = await splitter.splitDocuments(docs);

// log
console.log(`Er zijn ${chunks.length} chunks. De eerste chunk is:`);
console.log(chunks[0]);

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

// const vectorStore = new MemoryVectorStore(embeddings);
const vectorStore = new FaissStore(embeddings, {});

await vectorStore.addDocuments(chunks);
console.log("✅ vector store created!")

await vectorStore.save("./documents");   // directory name
console.log("✅ vector store saved!")

const prompt = "What is Blanca?"
const relevantDocs = await vectorStore.similaritySearch(prompt);
const context = relevantDocs.map(doc => doc.pageContent).join("\n\n")

console.log(`Found ${relevantDocs.length} relevant documents`)
console.log(context)