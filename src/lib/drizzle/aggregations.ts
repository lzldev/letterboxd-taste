import { sql, type SQLWrapper, type SQL } from "drizzle-orm";
import type { AnyPgTable, PgColumn, PgTable } from "drizzle-orm/pg-core";

export function json_agg<TTable extends PgTable>(col: TTable) {
  return sql<TTable["$inferSelect"][]>`coalesce(json_agg(${col}),'[]')`;
}

export function array_agg<TCol extends PgColumn>(col: TCol) {
  return sql<
    TCol["_"]["data"][]
  >`coalesce(array_agg(${col}),ARRAY[]::${sql.raw(col.getSQLType())}[])`;
}

export function json_object_agg<
  TCol1 extends SQLWrapper,
  TCol2 extends SQLWrapper,
>(col1: TCol1, col2: TCol2) {
  return sql<
    Record<
      string,
      TCol2 extends PgColumn
        ? TCol2["_"]["data"]
        : TCol2 extends AnyPgTable
          ? TCol2["$inferSelect"]
          : TCol2 extends SQL<infer T>
            ? T
            : never
    >
  >`coalesce(json_object_agg(${col1},${col2}),'{}')`;
}

export function json_build_object<const T extends Record<string, SQLWrapper>>(
  json: T,
) {
  const start = sql`json_build_object(`;
  const end = sql`)`;

  const values = Object.entries(json).map(([k, value], idx, arr) => {
    return sql`'${sql.raw(k)}',${value} ${sql.raw(idx === arr.length - 1 ? "" : ",")}`;
  });

  return sql.join([start, ...values, end]) as SQL<{
    [key in keyof T]: T[key] extends PgColumn
      ? T[key]["_"]["data"]
      : T[key] extends AnyPgTable
        ? T[key]["$inferSelect"]
        : T[key] extends SQL<infer T>
          ? T
          : never;
  }>;
}
