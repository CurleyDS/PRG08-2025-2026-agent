import { useState, useEffect } from "react";
import { micromark } from "micromark";
import DOMPurify from "dompurify";

function App() {
    const [userId, setUserId] = useState("");
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [world, setWorld] = useState({
        locations: [],
        history: [],
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let storedUserId = localStorage.getItem("userid");

        if (!storedUserId) {
            storedUserId = crypto.randomUUID();
            localStorage.setItem("userid", storedUserId);
        };

        setUserId(storedUserId);

        setMessages([
            {
                text: `
## Hey, I'm Relmy!
I help with world-building.

If you need help from guides, I have access to the following documents:

* Building Worlds by Blauw Films
* The KOBOLD Guide to Worldbuilding
`,
                sender: "bot"
            }
        ]);
    }, []);

    const changeMessage = (e) => {
        setMessage(e.target.value);
    };

    const sendMessage = async () => {
        setLoading(true);

        if (!message.trim()) {
            setLoading(false);
            return;
        };

        const newMessages = [
            ...messages,
            { text: message, sender: "user" },
            { text: "Generating...", sender: "bot" }
        ];

        setMessages(newMessages);

        try {
            const response = await fetch("http://localhost:3000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ userId, message })
            });

            const data = await response.json();
            
            console.log(data);

            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    text: data.message,
                    sender: "bot",
                    tokens: data.tokens,
                    toolsUsed: data.toolsUsed
                };
                return updated;
            });

            setWorld({
                locations: data.locations ?? [],
                history: data.history ?? [],
            });
        } catch (err) {
            console.error(err);

            setMessages(prev => {
                const updated = [...prev];

                updated[updated.length - 1] = {
                    text: "Something went wrong.",
                    sender: "bot",
                };

                return updated;
            });
        }

        setMessage("");

        setLoading(false);
    };

    return (
        <div className="max-w-xl mx-auto">
            <h1 className="p-4 font-bold text-2xl">Relmy</h1>

            {/* Chat-box */}
            <div className="p-4 space-y-2">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={(
                            msg.sender === "user"
                            ? "text-right bg-blue-500"
                            : "text-left bg-gray-800"
                        ) + " p-3 rounded-lg"}
                    >
                      <div
                          className="text-white [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-4 [&>li]:mb-1"
                          dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(micromark(msg.text))
                          }}
                      />

                      {msg.tokens && (
                        <p
                            className={(
                                msg.sender === "user"
                                ? "text-left"
                                : "text-right"
                            ) + " text-sm"}
                        >
                            Tokens: {msg.tokens}
                        </p>
                      )}

                      {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                        <p
                            className={(
                                msg.sender === "user"
                                ? "text-left"
                                : "text-right"
                            ) + " text-sm"}
                        >
                            Tools: {msg.toolsUsed.join(", ")}
                        </p>
                      )}
                    </div>
                ))}
            </div>

            {/* Chat-message */}
            <div className="flex p-4">
                <input type="text" className="flex-1 p-2 border rounded" placeholder="Type something..." value={message} onChange={changeMessage} onKeyDown={(e) => { if (e.key === "Enter" && !loading) { sendMessage(); } }}/>
                <button className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 ml-2" onClick={sendMessage} disabled={loading}>SEND</button>
            </div>
            
            {/* World */}
            <h1 className="p-4 font-bold text-2xl">World</h1>

            <div className="p-4 text-left">
                <div>
                    <p>Locations:</p>
                    <ul className="list-disc p-4 ">
                        {world.locations.map((loc, index) => (
                            <li key={index}>{loc}</li>
                        ))}
                    </ul>
                </div>
                
                <div>
                    <p>History:</p>
                    <ul className="list-disc p-4 ">
                        {world.history.map((event, index) => (
                            <li key={index}>{event}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default App;