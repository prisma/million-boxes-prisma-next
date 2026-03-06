import postgres from "@prisma-next/postgres/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

const queryLogger = {
  name: "query-logger",
  async beforeExecute(plan: any) {
    console.log(`\n[db] ${plan.sql}`);
    if (plan.params?.length) console.log("[db:params]", plan.params);
  },
  async afterExecute(_plan: any, result: any) {
    console.log(`[db] ${result.rowCount} rows in ${result.latencyMs}ms`);
  },
};

const queryLoggingEnabled = process.env["QUIET_DB_LOGS"] !== "1";

export const db = postgres<Contract>({
  contractJson,
  url: process.env["DATABASE_URL"],
  plugins: queryLoggingEnabled ? [queryLogger] : [],
});
