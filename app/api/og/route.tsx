// Requires: npm install @vercel/og
import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "Prediction Market";
  const yesRaw = searchParams.get("yes") ?? "50";
  const noRaw = searchParams.get("no") ?? "50";
  const type = searchParams.get("type") ?? "market";

  const yes = Math.min(100, Math.max(0, parseInt(yesRaw, 10) || 50));
  const no = Math.min(100, Math.max(0, parseInt(noRaw, 10) || 50));

  const bgColor = "#0b0e11";
  const fgColor = "#e5e7eb";
  const mutedColor = "#9ca3af";
  const yesColor = "#22c55e";
  const noColor = "#ef4444";
  const primaryColor = "#6366f1";
  const surfaceColor = "#151a21";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: bgColor,
          padding: "48px 56px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* BarChart3 icon approximation */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
          </svg>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: fgColor,
              letterSpacing: "-0.5px",
            }}
          >
            PredictFlow
          </span>
          <span
            style={{
              fontSize: "16px",
              color: mutedColor,
              marginLeft: "8px",
            }}
          >
            {type === "predict" ? "Community Prediction" : "Market Analysis"}
          </span>
        </div>

        {/* Middle: Title */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: title.length > 80 ? "36px" : title.length > 50 ? "42px" : "48px",
              fontWeight: 700,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.3,
              maxWidth: "1000px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>
        </div>

        {/* Probability Bar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Percentage numbers */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span
                style={{
                  fontSize: "56px",
                  fontWeight: 800,
                  color: yesColor,
                  lineHeight: 1,
                }}
              >
                {yes}%
              </span>
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  color: yesColor,
                  opacity: 0.8,
                }}
              >
                Yes
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  color: noColor,
                  opacity: 0.8,
                }}
              >
                No
              </span>
              <span
                style={{
                  fontSize: "56px",
                  fontWeight: 800,
                  color: noColor,
                  lineHeight: 1,
                }}
              >
                {no}%
              </span>
            </div>
          </div>

          {/* Bar */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "20px",
              borderRadius: "10px",
              overflow: "hidden",
              backgroundColor: surfaceColor,
            }}
          >
            <div
              style={{
                width: `${yes}%`,
                height: "100%",
                backgroundColor: yesColor,
                borderRadius: yes === 100 ? "10px" : "10px 0 0 10px",
              }}
            />
            <div
              style={{
                width: `${no}%`,
                height: "100%",
                backgroundColor: noColor,
                borderRadius: no === 100 ? "10px" : "0 10px 10px 0",
              }}
            />
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "4px",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                color: mutedColor,
                opacity: 0.6,
              }}
            >
              {new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://predictflow.app").hostname}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
