import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

// load pdf-files
const guide1Loader = new PDFLoader("./public/Building_Worlds_Document_Blauw_Films.pdf");
const guide2Loader = new PDFLoader("./public/The_KOBOLD_Guide_to_Worldbuilding.pdf");

const guide1Docs = await guide1Loader.load();
const guide2Docs = await guide2Loader.load();

const docs = [
    ...guide1Docs,
    ...guide2Docs
];

// split to chunks
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
});
const chunks = await splitter.splitDocuments(docs);

// log
console.log(`Er zijn ${chunks.length} chunks. De eerste chunk is:`);
console.log(chunks[0]);

const vectorStore = new FaissStore(embeddings, {});

// add documents to vectorStore
await vectorStore.addDocuments(chunks);
console.log("✅ vector store created!");

// save documents
await vectorStore.save("./documents");
console.log("✅ vector store saved!");