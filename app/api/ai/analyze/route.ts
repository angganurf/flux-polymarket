import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const {
    question,
    yesPrice,
    noPrice,
    volume,
    volume24h,
    priceChange24h,
    priceChange1w,
    description,
  } = await req.json();

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

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system:
      "You are a prediction market analyst. Provide concise, insightful analysis of prediction markets. Focus on: 1) Current probability interpretation, 2) Recent trends and what they mean, 3) Key factors that could move the market, 4) Risk assessment. Keep responses under 300 words. Be objective and data-driven. Use markdown formatting with **bold** for emphasis and bullet points for lists.",
    prompt: `Analyze this prediction market:

Question: ${question}
Current Probability: YES ${Math.round((yesPrice ?? 0) * 100)}% / NO ${Math.round((noPrice ?? 0) * 100)}%
24h Volume: $${volume24h != null ? Number(volume24h).toLocaleString() : "N/A"}
Total Volume: $${volume != null ? Number(volume).toLocaleString() : "N/A"}
24h Price Change: ${priceChange24h != null ? (priceChange24h > 0 ? "+" : "") + (priceChange24h * 100).toFixed(1) + "%" : "N/A"}
7d Price Change: ${priceChange1w != null ? (priceChange1w > 0 ? "+" : "") + (priceChange1w * 100).toFixed(1) + "%" : "N/A"}
${description ? `Description: ${description}` : ""}

Provide a brief market analysis.`,
  });

  return result.toTextStreamResponse();
}
