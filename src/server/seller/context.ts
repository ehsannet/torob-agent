import type { QueryResultRow } from "pg";
import { getPool } from "@/lib/db";
import type { WeeklyHours } from "@/lib/hours";
import type {
  SellerObservationView,
  SellerQuestionView,
} from "@/lib/seller-types";
import type { SearchFilters } from "@/lib/search-types";

export const BASE_FILTERS: SearchFilters = {
  q: "",
  category: null,
  minPrice: null,
  maxPrice: null,
  district: null,
  lat: null,
  lng: null,
  radiusKm: 5,
  openNow: false,
  torobPay: false,
  installments: false,
  kalabarg: false,
  fastDelivery: false,
  sort: "relevance",
  page: 1,
  limit: 24,
};

export type CheckContextRow = QueryResultRow & {
  token: string;
  status: "created" | "sent" | "answered" | "expired";
  session_id: string | null;
  questions: SellerQuestionView[];
  created_at: Date;
  sent_at: Date | null;
  viewed_at: Date | null;
  answered_at: Date | null;
  expires_at: Date | null;
  shop_id: string;
  offer_id: string | null;
  product_id: string;
  shop_name: string;
  address_text: string;
  mall_name: string | null;
  floor: string | null;
  unit: string | null;
  street: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  weekly_hours: WeeklyHours | string | null;
  price: number | null;
  price_unit: string;
  warranty_provider: string | null;
  warranty_duration_months: number | null;
};

export type CheckOfferRow = QueryResultRow & {
  id: string;
  shop_id: string;
  product_id: string;
  product_title: string;
  price: number | null;
  price_unit: string;
  warranty_provider: string | null;
  warranty_duration_months: number | null;
  shop_name: string;
  weekly_hours: WeeklyHours | string | null;
};

const CHECK_SELECT = `
  select
    c.token, c.status, c.session_id, c.questions,
    c.created_at, c.sent_at, c.viewed_at, c.answered_at, c.expires_at,
    c.shop_id, c.offer_id,
    s.name as shop_name, s.address_text, s.mall_name, s.floor, s.unit,
    s.street, s.landmark, s.latitude, s.longitude, s.weekly_hours,
    o.product_id, o.price, o.price_unit, o.warranty_provider,
    o.warranty_duration_months
  from seller_checks c
  join shops s on s.id = c.shop_id
  join offers o on o.id = c.offer_id
  where c.token = $1
`;

export function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export async function loadContext(token: string): Promise<CheckContextRow | null> {
  const result = await getPool().query<CheckContextRow>(CHECK_SELECT, [token]);
  return result.rows[0] ?? null;
}

export async function latestObservation(
  offerId: string,
): Promise<SellerObservationView | null> {
  const result = await getPool().query<
    QueryResultRow & {
      stock_status: "in_stock" | "out_of_stock" | "unknown";
      confirmed_price: number | null;
      confirmed_at: Date;
      source: "seller_response" | "simulator";
      note: string | null;
      price_unit: string;
    }
  >(
    `select obs.stock_status, obs.confirmed_price, obs.confirmed_at,
            obs.source, obs.note, o.price_unit
     from offer_observations obs
     join offers o on o.id = obs.offer_id
     where obs.offer_id = $1
     order by obs.confirmed_at desc
     limit 1`,
    [offerId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    stockStatus: row.stock_status,
    confirmedPriceToman:
      row.confirmed_price === null
        ? null
        : row.price_unit === "RIAL"
          ? Math.round(row.confirmed_price / 10)
          : row.confirmed_price,
    confirmedAt: row.confirmed_at.toISOString(),
    source: row.source,
    note: row.note,
  };
}
