import type { VercelRequest, VercelResponse } from "@vercel/node";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "FIDES Wallet Catalog API",
    version: "1.0.0",
    description:
      "Public read-only API over data/aggregated.json — list wallets and fetch one wallet by org + id.",
  },
  servers: [{ url: "/api/public" }],
  paths: {
    "/wallet": {
      get: {
        summary: "List wallets",
        operationId: "listWallets",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "orgId", in: "query", schema: { type: "string" }, description: "Exact organization catalog id filter" },
          { name: "type", in: "query", schema: { type: "string" }, description: "Comma-separated: personal, organizational" },
          { name: "platforms", in: "query", schema: { type: "string" }, description: "Comma-separated platform names" },
          { name: "credentialFormats", in: "query", schema: { type: "string" }, description: "Comma-separated formats" },
          { name: "capabilities", in: "query", schema: { type: "string" } },
          { name: "interoperabilityProfiles", in: "query", schema: { type: "string" } },
          { name: "protocols", in: "query", schema: { type: "string" }, description: "Comma-separated issuance/presentation protocol names" },
          { name: "openSource", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "status", in: "query", schema: { type: "string" }, description: "Comma-separated statuses" },
          { name: "sort", in: "query", schema: { type: "string", default: "displayName" } },
          { name: "direction", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "asc" } },
          { name: "page", in: "query", schema: { type: "integer", default: 0 } },
          { name: "size", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": {
            description: "Paginated wallets",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WalletPage" },
              },
            },
          },
        },
      },
    },
    "/wallet/{orgId}/{walletId}": {
      get: {
        summary: "Get one wallet by organization id and wallet id",
        operationId: "getWallet",
        parameters: [
          { name: "orgId", in: "path", required: true, schema: { type: "string" }, description: "URL-encoded org id (e.g. org%3Aanimo)" },
          { name: "walletId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Wallet object",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Wallet" },
              },
            },
          },
          "404": { description: "Not found" },
        },
      },
    },
  },
  components: {
    schemas: {
      WalletPage: {
        type: "object",
        properties: {
          content: { type: "array", items: { $ref: "#/components/schemas/Wallet" } },
          totalElements: { type: "integer" },
          totalPages: { type: "integer" },
          number: { type: "integer" },
          size: { type: "integer" },
          lastUpdated: { type: "string" },
        },
      },
      Wallet: {
        type: "object",
        additionalProperties: true,
        description: "Normalized wallet row from aggregated.json",
      },
    },
  },
};

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600");
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(spec);
}
