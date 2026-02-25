export interface BetWithEvent {
  id: string;
  choice: string;
  amount: number;
  payout: number | null;
  createdAt: string;
  event: {
    id: string;
    title: string;
    status: string;
    result: string | null;
    endDate: string;
    category: string;
  };
}
