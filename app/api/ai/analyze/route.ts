import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// Sanitize user input: strip control characters and limit length
function sanitizeInput(input: unknown, maxLength: number): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export async function POST(req: Request) {
  // Authentication check
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Rate limiting: 5 requests per minute per user (fall back to IP if no user ID)
  const rateLimitKey = session.user.id
    ? `ai-analyze:user:${session.user.id}`
    : `ai-analyze:ip:${req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"}`;
  const { allowed } = checkRateLimit(rateLimitKey, { maxRequests: 5, windowMs: 60 * 1000 });
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // If no API key, return a mock analysis
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        analysis:
          "AI analysis requires an OpenAI API key. Configure OPENAI_API_KEY in your .env file to enable this feature.",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();

    // Validate and sanitize inputs
    const question = sanitizeInput(body.question, 500);
    if (!question) {
      return new Response(
        JSON.stringify({ error: "Question is required (max 500 characters)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const description = sanitizeInput(body.description, 1000);
    const yesPrice = typeof body.yesPrice === "number" ? Math.max(0, Math.min(1, body.yesPrice)) : null;
    const noPrice = typeof body.noPrice === "number" ? Math.max(0, Math.min(1, body.noPrice)) : null;
    const volume = typeof body.volume === "number" ? Math.max(0, body.volume) : null;
    const volume24h = typeof body.volume24h === "number" ? Math.max(0, body.volume24h) : null;
    const priceChange24h = typeof body.priceChange24h === "number" ? body.priceChange24h : null;
    const priceChange1w = typeof body.priceChange1w === "number" ? body.priceChange1w : null;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system:
        "You are a prediction market analyst. Provide concise, insightful analysis of prediction markets. Focus on: 1) Current probability interpretation, 2) Recent trends and what they mean, 3) Key factors that could move the market, 4) Risk assessment. Keep responses under 300 words. Be objective and data-driven. Use markdown formatting with **bold** for emphasis and bullet points for lists.",
      prompt: `Analyze this prediction market:

Question: ${question}
Current Probability: YES ${yesPrice != null ? Math.round(yesPrice * 100) : "N/A"}% / NO ${noPrice != null ? Math.round(noPrice * 100) : "N/A"}%
24h Volume: $${volume24h != null ? Number(volume24h).toLocaleString() : "N/A"}
Total Volume: $${volume != null ? Number(volume).toLocaleString() : "N/A"}
24h Price Change: ${priceChange24h != null ? (priceChange24h > 0 ? "+" : "") + (priceChange24h * 100).toFixed(1) + "%" : "N/A"}
7d Price Change: ${priceChange1w != null ? (priceChange1w > 0 ? "+" : "") + (priceChange1w * 100).toFixed(1) + "%" : "N/A"}
${description ? `Description: ${description}` : ""}

Provide a brief market analysis.`,
    });

    return result.toTextStreamResponse();
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to analyze market" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
