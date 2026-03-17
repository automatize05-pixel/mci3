import { vi, describe, it, expect, beforeEach } from "vitest";

// Mocking the streamChat function or its dependencies is complex because it's in the same file as the component usually,
// but in MCI it's defined in AIRecipes.tsx. We'll attempt to test the logic by mocking the global fetch.

const CHAT_URL = "https://mock-supabase.supabase.co/functions/v1/ai-chef";

// Helper to simulate streamChat logic (extracted from AIRecipes.tsx)
async function streamChatLogic({ messages, onDelta, onDone, onError }: any) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  
  if (!resp.ok) {
    onError("Erro " + resp.status);
    return;
  }
  
  const reader = resp.body?.getReader();
  const decoder = new TextDecoder();
  
  if (!reader) {
    onError("Sem reader");
    return;
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch (e) {}
      }
    }
  }
  onDone();
}

describe("streamChat Logic", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should stream content correctly", async () => {
    const mockResponse = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Olá"}}]}\n'));
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":" mundo"}}]}\n'));
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n'));
        controller.close();
      },
    });

    (fetch as any).mockResolvedValue({
      ok: true,
      body: mockResponse,
    });

    const onDelta = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await streamChatLogic({
      messages: [{ role: "user", content: "oi" }],
      onDelta,
      onDone,
      onError,
    });

    expect(onDelta).toHaveBeenCalledWith("Olá");
    expect(onDelta).toHaveBeenCalledWith(" mundo");
    expect(onDone).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("should handle server errors", async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const onDelta = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await streamChatLogic({
      messages: [{ role: "user", content: "oi" }],
      onDelta,
      onDone,
      onError,
    });

    expect(onError).toHaveBeenCalledWith("Erro 500");
    expect(onDelta).not.toHaveBeenCalled();
  });
});
