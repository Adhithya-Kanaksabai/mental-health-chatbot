export const streamAIReply = async (
  messages: any[],
  onToken: (token: string) => void,
  onComplete?: () => void,
  abortSignal?: AbortSignal
) => {
  try {
    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
      signal: abortSignal,
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");

    let done = false;
    let buffer = "";

    while (!done && reader) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;

      const chunk = decoder.decode(value);
      buffer += chunk;

      const lines = buffer.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line === "data: [DONE]") {
          onComplete?.();
          return;
        }

        if (line.startsWith("data: ")) {
          try {
            const json = JSON.parse(line.replace("data: ", ""));
            const token = json.token;
            if (token) {
              onToken(token);
            }
          } catch (err) {
            console.error("Error parsing token JSON:", err);
          }
        }
      }

      buffer = ""; // Clear after each batch
    }

    onComplete?.();
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.warn("❌ Request aborted");
    } else {
      console.error("❌ Stream error:", error);
    }
    onComplete?.();
  }
};
