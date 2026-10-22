import type { QueryResultRow } from "pg";
import { getPool } from "@/lib/db";
import { loadContext } from "./context";
import { insertShopHours } from "./observations";
import { sellerChannelForToken, simulationPlan } from "./tokens";

export async function advanceSimulatedCheck(token: string): Promise<void> {
  if (sellerChannelForToken(token) !== "simulator") return;
  const row = await loadContext(token);
  if (!row || (row.status !== "sent" && row.status !== "created")) return;
  const plan = simulationPlan(token);
  const base = row.sent_at ?? row.created_at;
  if (Date.now() - base.getTime() < plan.delayMs) return;

  if (plan.outcome === "no_answer") {
    await getPool().query(
      `update seller_checks set status = 'expired'
       where token = $1 and status in ('created', 'sent')`,
      [token],
    );
    return;
  }

  const stockStatus = plan.outcome === "in_stock" ? "in_stock" : "out_of_stock";
  const offer = await getPool().query<
    QueryResultRow & { price: number | null; price_unit: string }
  >("select price, price_unit from offers where id = $1", [row.offer_id]);
  const price = offer.rows[0]?.price ?? null;
  const confirmedPrice = stockStatus === "in_stock" ? price : null;
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const updated = await client.query(
      `update seller_checks
       set status = 'answered', answered_at = now(),
           viewed_at = coalesce(viewed_at, now()),
           sent_at = coalesce(sent_at, now())
       where token = $1 and status in ('created', 'sent')
       returning id`,
      [token],
    );
    if ((updated.rowCount ?? 0) === 0) {
      await client.query("rollback");
      return;
    }
    await client.query(
      `insert into offer_observations
        (offer_id, confirmed_price, stock_status, note, source)
       values ($1, $2, $3, $4, 'simulator')`,
      [
        row.offer_id,
        confirmedPrice,
        stockStatus,
        stockStatus === "in_stock"
          ? "پاسخ خودکار دمو: موجودی تأیید شد."
          : "پاسخ خودکار دمو: فروشنده اعلام کرد ناموجود است.",
      ],
    );
    await insertShopHours(client, row, "ساعت کاری در دمو تأیید شد.");
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
