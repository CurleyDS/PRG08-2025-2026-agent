import { tool } from "langchain";

export const rollDice = tool(
    ({ sides }) => {
        console.log(`🔧  Ik rol een ${sides}-sided dobbelsteen!`)
        const result = Math.floor(Math.random() * sides) +1
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
        },
    },
)

export const getDate = tool(
    () => {
        const today = new Date();
        const readableDate = today.toLocaleDateString("nl-NL", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        console.log(readableDate)
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
        },
    },
)

export const getWeather = tool(
    async ({ city }) => {
        console.log(`🔧 De weather tool wordt uitgevoerd!`)
        const apiKey = process.env.MY_WEATHER_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
        if (data.weather) {
            return `Het is ${data.weather[0].description} en ${data.main.temp}°C in ${city}.`;
        }
        
        return `Sorry, ik kon het weer voor ${city} niet ophalen.`;
    },
    {
        name: "get_weather",
        description: "Get the weather for a given city",
        schema: {
            type: "object",
            properties: {
                city: { type: "string" },
            },
            required: ["city"],
            additionalProperties: false
        },
    },
);

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
                search_depth: "basic",         // or "advanced" for deeper results
                include_answer: true,          // Tavily summarizes the results for you
            }),
        });

        const data = await res.json();
        return data;
        // if (data.weather) {
        //     return `Het is ${data.weather[0].description} en ${data.main.temp}°C in ${city}.`;
        // }

        // return `Sorry, ik kon het weer voor ${city} niet ophalen.`;
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