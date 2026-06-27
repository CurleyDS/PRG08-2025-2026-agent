import express from "express";
import cors from "cors";
import { callOpenAI } from "./agent.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile("public/index.html", { root: "." });
});

app.get('/api/test', async (req, res) => {
    const response = await callOpenAI("dln-01", "What is your function?");
    res.json(response);
});

app.post('/api/chat', async(req, res) => {
    const { userId, message } = req.body;
    const response = await callOpenAI(userId, message);
    res.json(response);
});

app.listen(3000, () => console.log(`Serving on http://localhost:3000`));