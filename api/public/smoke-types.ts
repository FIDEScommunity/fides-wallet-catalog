import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { WalletType } from "../types/wallet";

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  const t: WalletType = "personal";
  res.status(200).json({ t });
}
