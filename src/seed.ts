import "dotenv/config";
import { orm, all } from "@prisma-next/sql-orm-client";
import { db } from "./prisma-next/db";

const TOTAL = 1_000_000;
const BATCH = 10_000;

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function idToColor(id: number): string {
  const hue = (id * 137.508) % 360;
  const sat = 70 + (id % 20);
  const lit = 40 + ((id * 7) % 20);
  return hslToHex(hue, sat, lit);
}

async function seed() {
  await db.connect();
  const contract = db.context.contract;
  const runtime = db.runtime();
  const client = orm({ contract, runtime, collections: {} });
  const boxes = client.box!;

  const { count } = await boxes.aggregate((agg) => ({ count: agg.count() }));
  if (count > 0) {
    console.log(`Clearing ${count.toLocaleString()} existing boxes...`);
    await boxes.where(all).deleteAll();
  }

  console.log(`Seeding ${TOTAL.toLocaleString()} boxes...`);
  const start = performance.now();

  for (let i = 0; i < TOTAL / BATCH; i++) {
    const offset = i * BATCH;
    const rows = Array.from({ length: BATCH }, (_, j) => ({
      color: idToColor(offset + j + 1),
    }));
    await boxes.createCount(rows);

    const done = offset + BATCH;
    const elapsed = ((performance.now() - start) / 1000).toFixed(1);
    console.log(
      `  batch ${i + 1}/${TOTAL / BATCH} — ${done.toLocaleString()} rows (${elapsed}s)`,
    );
  }

  const total = ((performance.now() - start) / 1000).toFixed(1);
  console.log(`Seeded ${TOTAL.toLocaleString()} boxes in ${total}s.`);
}

seed().catch(console.error);
