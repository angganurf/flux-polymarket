import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Top prediction market traders ranked by profit and volume.",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
