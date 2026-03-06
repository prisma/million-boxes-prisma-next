import "dotenv/config";
import { orm } from "@prisma-next/sql-orm-client";
import { db } from "./prisma-next/db";

const DEFAULT_PORT = Number(process.env["PORT"] || "3002");

function clampInt(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.floor(value), min), max);
}

function getLimit(url: URL): number {
  return clampInt(
    Number(url.searchParams.get("limit") || "1000000"),
    1,
    1_000_000,
    1_000_000,
  );
}

export async function startServer({ port = DEFAULT_PORT } = {}) {
  await db.connect();
  const client = orm({
    contract: db.context.contract,
    runtime: db.runtime(),
    collections: {},
  });

  return Bun.serve({
    port,
    idleTimeout: 60,
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/") {
        return new Response(Bun.file(import.meta.dir + "/index.html"));
      }

      if (url.pathname === "/api/stream") {
        const limit = getLimit(url);

        return new Response(
          //@ts-ignore bun types are not up-to-date
          async function* () {
            for await (const row of client.box!.take(limit).all()) {
              yield `${row.color}\n`;
            }
          },
          { headers: { "Content-Type": "text/plain" } },
        );
      }

      if (url.pathname === "/api/fetch") {
        const limit = getLimit(url);
        const rows: string[] = [];

        for await (const row of client.box!.take(limit).all()) {
          rows.push(row.color);
        }

        return new Response(rows.join("\n") + "\n", {
          headers: { "Content-Type": "text/plain" },
        });
      }

      return new Response("Not Found", { status: 404 });
    },
  });
}

if (import.meta.main) {
  const server = await startServer();
  console.log(`Started: http://localhost:${server.port}`);
}
