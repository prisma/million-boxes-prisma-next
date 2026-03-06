import type { CodecTypes } from "@prisma-next/adapter-postgres/codec-types";
import { int4Column, textColumn } from "@prisma-next/adapter-postgres/column-types";
import { defineContract } from "@prisma-next/sql-contract-ts/contract-builder";
import postgresPack from "@prisma-next/target-postgres/pack";

export const contract = defineContract<CodecTypes>()
  .target(postgresPack)
  .table("box", (t) =>
    t
      .column("id", {
        type: int4Column,
        nullable: false,
        default: { kind: "function", expression: "autoincrement()" },
      })
      .column("color", { type: textColumn, nullable: false })
      .primaryKey(["id"]),
  )
  .model("Box", "box", (m) => m.field("id", "id").field("color", "color"))
  .capabilities({
    postgres: {
      lateral: true,
      jsonAgg: true,
      returning: true,
      "defaults.now": true,
    },
  })
  .build();
