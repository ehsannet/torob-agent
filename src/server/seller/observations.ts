import type { PoolClient } from "pg";
import { sellerChannelForToken } from "./tokens";
import type { CheckContextRow } from "./context";

export async function insertShopHours(
  client: Pick<PoolClient, "query">,
  row: CheckContextRow,
  note: string,
): Promise<void> {
  if (!row.weekly_hours) return;
  const source =
    sellerChannelForToken(row.token) === "simulator"
      ? "simulator"
      : "seller_response";
  await client.query(
    `insert into shop_observations (shop_id, confirmed_hours, note, source)
     values ($1, $2::jsonb, $3, $4)`,
    [row.shop_id, JSON.stringify(row.weekly_hours), note, source],
  );
}
