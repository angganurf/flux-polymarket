import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "polymarket-upload.s3.us-east-2.amazonaws.com" },
      { protocol: "https", hostname: "*.polymarket.com" },
    ],
  },
  async headers() {
    return [
      {
        // Security headers for all non-embed routes
        source: "/((?!embed).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://polymarket-upload.s3.us-east-2.amazonaws.com https://*.polymarket.com",
              "font-src 'self'",
              "connect-src 'self' https://gamma-api.polymarket.com https://clob.polymarket.com https://data-api.polymarket.com wss://ws-subscriptions-clob.polymarket.com https://vitals.vercel-insights.com https://*.vercel-analytics.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      {
        // Embed routes: allow framing from any origin
        source: "/embed/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
