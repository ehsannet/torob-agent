import type { QueryResultRow } from "pg";
import { getPool } from "@/lib/db";
import { toToman } from "@/lib/price";
import type {
  SellerCheckCreateResult,
  SellerCheckSummary,
  SellerResponseInput,
  SubmitSellerResponse,
} from "@/lib/seller-types";
import { getSellerChannel, isDemoMode, sellerChannel } from "./channel";
import {
  iso,
  loadContext,
  type CheckOfferRow,
} from "./context";
import { insertShopHours } from "./observations";
import { advanceSimulatedCheck } from "./simulator";
import {
  buildSellerQuestions,
  sellerChannelForToken,
  simulationPlan,
} from "./tokens";

function sessionId(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && /^[a-zA-Z0-9_-]{8,80}$/.test(trimmed) ? trimmed : null;
}

export async function createSellerChecks(
  offerIds: string[],
  requestedSessionId?: string,
): Promise<SellerCheckCreateResult> {
  const unique = Array.from(
    new Set(offerIds.map((id) => id.trim()).filter(Boolean)),
  ).slice(0, 5);
  if (unique.length === 0) throw new Error("offer_ids_required");

  const result = await getPool().query<CheckOfferRow>(
    `select o.id, o.shop_id, o.product_id, o.price, o.price_unit,
            o.warranty_provider, o.warranty_duration_months,
            s.name as shop_name, s.weekly_hours, p.title_fa as product_title
     from offers o
     join shops s on s.id = o.shop_id
     join products p on p.id = o.product_id
     where o.id = any($1::text[])`,
    [unique],
  );
  const byId = new Map(result.rows.map((row) => [row.id, row]));
  const channel = getSellerChannel();
  const now = Date.now();
  const session = sessionId(requestedSessionId);
  const checks: SellerCheckSummary[] = [];
  const skipped: string[] = [];
  const client = await getPool().connect();

  try {
    await client.query("begin");
    for (const offerId of unique) {
      const offer = byId.get(offerId);
      if (!offer) {
        skipped.push(offerId);
        continue;
      }
      const token = channel.createToken();
      const plan = channel.kind === "simulator" ? simulationPlan(token) : null;
      const expiresAt =
        plan?.outcome === "no_answer"
          ? new Date(now + plan.delayMs + 2_000)
          : new Date(now + (channel.automatic ? 3 : 7) * 24 * 60 * 60 * 1000);
      const questions = buildSellerQuestions({
        hasHours: Boolean(offer.weekly_hours),
        warrantyProvider: offer.warranty_provider,
      });
      await client.query(
        `insert into seller_checks
          (token, shop_id, offer_id, questions, status, session_id, sent_at, expires_at)
         values ($1, $2, $3, $4::jsonb, 'sent', $5, now(), $6)`,
        [
          token,
          offer.shop_id,
          offer.id,
          JSON.stringify(questions),
          session,
          expiresAt,
        ],
      );
      checks.push({
        token,
        status: "sent",
        simulated: channel.automatic,
        createdAt: new Date(now).toISOString(),
        answeredAt: null,
        shopName: offer.shop_name,
        productTitle: offer.product_title,
        offerId: offer.id,
        priceToman: toToman(offer.price, offer.price_unit),
        linkPath: channel.sellerPath(token),
      });
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  if (checks.length === 0) throw new Error("no_offers_found");
  const deliveries = await Promise.all(
    checks.map((check) => channel.send({ token: check.token })),
  );
  deliveries.forEach((delivery, index) => {
    checks[index].linkPath = delivery.linkPath;
  });
  return { checks, skipped, demoMode: isDemoMode() };
}

export async function respondToSellerCheck(
  token: string,
  input: SellerResponseInput,
): Promise<SubmitSellerResponse> {
  const row = await loadContext(token);
  if (!row) {
    return { ok: false, code: "not_found", error: "درخواست پیدا نشد." };
  }
  if (row.status !== "created" && row.status !== "sent") {
    return {
      ok: false,
      code: "closed",
      error: "این درخواست قبلاً پاسخ داده شده یا منقضی شده است.",
    };
  }
  if (row.expires_at && row.expires_at.getTime() <= Date.now()) {
    await getPool().query(
      `update seller_checks set status = 'expired'
       where token = $1 and status in ('created', 'sent')`,
      [token],
    );
    return {
      ok: false,
      code: "closed",
      error: "مهلت این درخواست به پایان رسیده است.",
    };
  }
  const price =
    input.stockStatus === "out_of_stock"
      ? null
      : input.confirmedPriceToman === undefined ||
          input.confirmedPriceToman === null
        ? null
        : input.confirmedPriceToman;
  const maxPriceToman = row.price_unit === "RIAL" ? 200_000_000 : 2_000_000_000;
  if (
    price !== null &&
    (!Number.isInteger(price) || price < 0 || price > maxPriceToman)
  ) {
    return {
      ok: false,
      code: "invalid",
      error: "قیمت تأییدشده در بازهٔ مجاز نیست.",
    };
  }
  const storedPrice =
    price === null ? null : row.price_unit === "RIAL" ? price * 10 : price;
  const noteParts = [input.note?.trim().slice(0, 260)];
  if (input.warrantyConfirmed) noteParts.push("گارانتی ثبت‌شده تأیید شد.");
  const note = noteParts.filter(Boolean).join(" ") || null;
  const source =
    sellerChannelForToken(token) === "simulator"
      ? "simulator"
      : "seller_response";
  const client = await getPool().connect();

  try {
    await client.query("begin");
    const locked = await client.query<{ status: string }>(
      "select status from seller_checks where token = $1 for update",
      [token],
    );
    const status = locked.rows[0]?.status;
    if (status !== "created" && status !== "sent") {
      await client.query("rollback");
      return {
        ok: false,
        code: "closed",
        error: "این درخواست قبلاً پاسخ داده شده یا منقضی شده است.",
      };
    }
    const inserted = await client.query<
      QueryResultRow & {
        stock_status: "in_stock" | "out_of_stock";
        confirmed_price: number | null;
        confirmed_at: Date;
        source: "seller_response" | "simulator";
        note: string | null;
      }
    >(
      `insert into offer_observations
        (offer_id, confirmed_price, stock_status, note, source)
       values ($1, $2, $3, $4, $5)
       returning stock_status, confirmed_price, confirmed_at, source, note`,
      [row.offer_id, storedPrice, input.stockStatus, note, source],
    );
    if (input.hoursConfirmed) {
      await insertShopHours(client, row, note ?? "ساعت کاری تأیید شد.");
    }
    await client.query(
      `update seller_checks
       set status = 'answered', answered_at = now(),
           viewed_at = coalesce(viewed_at, now())
       where token = $1`,
      [token],
    );
    await client.query("commit");
    const observation = inserted.rows[0];
    return {
      ok: true,
      status: "answered",
      observation: observation
        ? {
            stockStatus: observation.stock_status,
            confirmedPriceToman: toToman(
              observation.confirmed_price,
              row.price_unit,
            ),
            confirmedAt: observation.confirmed_at.toISOString(),
            source: observation.source,
            note: observation.note,
          }
        : null,
      linkPath: sellerChannel(sellerChannelForToken(token)).sellerPath(token),
    };
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function listSellerChecks(
  requestedSessionId: string,
): Promise<SellerCheckSummary[]> {
  const session = sessionId(requestedSessionId);
  if (!session) return [];
  const active = await getPool().query<{ token: string }>(
    `select token from seller_checks
     where session_id = $1 and status in ('created', 'sent')
       and token like 'sim\\_%'
     order by created_at desc limit 12`,
    [session],
  );
  await Promise.all(
    active.rows.map((row) =>
      advanceSimulatedCheck(row.token).catch(() => undefined),
    ),
  );
  const result = await getPool().query<
    QueryResultRow & {
      token: string;
      status: "created" | "sent" | "answered" | "expired";
      created_at: Date;
      answered_at: Date | null;
      shop_name: string;
      product_title: string;
      offer_id: string;
      price: number | null;
      price_unit: string;
    }
  >(
    `select c.token, c.status, c.created_at, c.answered_at,
            s.name as shop_name, p.title_fa as product_title,
            c.offer_id, o.price, o.price_unit
     from seller_checks c
     join shops s on s.id = c.shop_id
     left join offers o on o.id = c.offer_id
     left join products p on p.id = o.product_id
     where c.session_id = $1
     order by c.created_at desc
     limit 24`,
    [session],
  );
  return result.rows.map((row) => {
    const kind = sellerChannelForToken(row.token);
    return {
      token: row.token,
      status: row.status,
      simulated: kind === "simulator",
      createdAt: row.created_at.toISOString(),
      answeredAt: iso(row.answered_at),
      shopName: row.shop_name,
      productTitle: row.product_title ?? "محصول",
      offerId: row.offer_id,
      priceToman: toToman(row.price, row.price_unit),
      linkPath: sellerChannel(kind).sellerPath(row.token),
    };
  });
}
