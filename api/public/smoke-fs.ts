import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.status(200).json({ readFileSync: typeof fs.readFileSync });
}
