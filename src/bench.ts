import "dotenv/config";

process.env["QUIET_DB_LOGS"] = "1";

type Mode = "stream" | "fetch";

type Options = {
  limit: number;
  port: number;
  modes: Mode[];
};

type Result = {
  label: string;
  rows: number;
  bytes: number;
  headersMs: number | null;
  firstDataMs: number | null;
  totalMs: number;
  chunks: number | null;
  notes: string;
};

function parseArgs(argv: string[]): Options {
  const modeMap = new Set<Mode>(["stream", "fetch"]);
  const options: Options = {
    limit: 1_000_000,
    port: 3102,
    modes: ["stream", "fetch"],
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      console.log(`Usage: bun run src/bench.ts [--limit=1000000] [--port=3102] [--mode=all|stream|fetch]

Examples:
  bun run src/bench.ts
  bun run src/bench.ts --limit=100000 --mode=stream
  bun run src/bench.ts --limit=100000 --mode=fetch`);
      process.exit(0);
    }

    const [flag, rawValue] = arg.split("=", 2);
    if (!rawValue) continue;

    if (flag === "--limit") options.limit = clampInt(Number(rawValue), 1, 1_000_000, options.limit);
    if (flag === "--port") options.port = clampInt(Number(rawValue), 1024, 65535, options.port);

    if (flag === "--mode") {
      if (rawValue === "all") continue;
      if (!modeMap.has(rawValue as Mode)) {
        throw new Error(`Unknown mode: ${rawValue}`);
      }
      options.modes = [rawValue as Mode];
    }
  }

  return options;
}

function clampInt(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.floor(value), min), max);
}

function countNewlines(bytes: Uint8Array) {
  let count = 0;
  for (const byte of bytes) {
    if (byte === 10) count++;
  }
  return count;
}

function formatDuration(ms: number | null) {
  if (ms == null) return "-";
  return `${(ms / 1000).toFixed(ms >= 10_000 ? 1 : 3)}s`;
}

function formatRowsPerSecond(rows: number, totalMs: number) {
  return Math.round((rows / totalMs) * 1000).toLocaleString();
}

function formatMiBPerSecond(bytes: number, totalMs: number) {
  const mib = bytes / (1024 * 1024);
  return (mib / (totalMs / 1000)).toFixed(2);
}

function renderTable(results: Result[]) {
  const headers = ["Mode", "Rows", "Headers", "First", "Total", "Rows/s", "MiB/s", "Chunks", "Notes"];
  const rows = results.map((result) => [
    result.label,
    result.rows.toLocaleString(),
    formatDuration(result.headersMs),
    formatDuration(result.firstDataMs),
    formatDuration(result.totalMs),
    formatRowsPerSecond(result.rows, result.totalMs),
    formatMiBPerSecond(result.bytes, result.totalMs),
    result.chunks == null ? "-" : result.chunks.toLocaleString(),
    result.notes,
  ]);

  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index].length)),
  );

  const printRow = (row: string[]) =>
    row.map((cell, index) => cell.padEnd(widths[index])).join("  ");

  console.log(printRow(headers));
  console.log(widths.map((width) => "-".repeat(width)).join("  "));
  for (const row of rows) console.log(printRow(row));
}

async function benchHttpStream(baseUrl: string, limit: number): Promise<Result> {
  const t0 = performance.now();
  const res = await fetch(`${baseUrl}/api/stream?limit=${limit}`);
  const headersMs = performance.now() - t0;

  if (!res.body) throw new Error("Stream response has no body");

  const reader = res.body.getReader();
  let firstDataMs: number | null = null;
  let rows = 0;
  let bytes = 0;
  let chunks = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks++;
    if (firstDataMs == null) firstDataMs = performance.now() - t0;
    rows += countNewlines(value);
    bytes += value.byteLength;
  }

  return {
    label: "http-stream",
    rows,
    bytes,
    headersMs,
    firstDataMs,
    totalMs: performance.now() - t0,
    chunks,
    notes: "stream response",
  };
}

async function benchHttpFetch(baseUrl: string, limit: number): Promise<Result> {
  const t0 = performance.now();
  const res = await fetch(`${baseUrl}/api/fetch?limit=${limit}`);
  const headersMs = performance.now() - t0;
  const body = new Uint8Array(await res.arrayBuffer());

  return {
    label: "http-fetch",
    rows: countNewlines(body),
    bytes: body.byteLength,
    headersMs,
    firstDataMs: null,
    totalMs: performance.now() - t0,
    chunks: null,
    notes: "buffer full body, then parse",
  };
}

function printSummary(results: Result[]) {
  const fastestTotal = [...results].sort((a, b) => a.totalMs - b.totalMs)[0];
  const fastestFirst = results
    .filter((result) => result.firstDataMs != null)
    .sort((a, b) => (a.firstDataMs! - b.firstDataMs!))[0];

  console.log("");
  console.log(`Fastest total: ${fastestTotal.label} in ${formatDuration(fastestTotal.totalMs)}`);
  if (fastestFirst) {
    console.log(`Fastest first data: ${fastestFirst.label} in ${formatDuration(fastestFirst.firstDataMs)}`);
  }
}

async function main() {
  const options = parseArgs(Bun.argv.slice(2));
  const { startServer } = await import("./server");
  const { db } = await import("./prisma-next/db");

  const server = await startServer({ port: options.port });
  const baseUrl = `http://127.0.0.1:${server.port}`;
  const results: Result[] = [];

  try {
    console.log(`Million Boxes True Power Benchmark`);
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Rows: ${options.limit.toLocaleString()}`);
    console.log("");

    for (const mode of options.modes) {
      if (mode === "stream") results.push(await benchHttpStream(baseUrl, options.limit));
      if (mode === "fetch") results.push(await benchHttpFetch(baseUrl, options.limit));
    }

    renderTable(results);
    printSummary(results);
  } finally {
    await server.stop(true);
    await (db as { close?: () => Promise<void> }).close?.();
  }
}

await main();
