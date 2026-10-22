import type { QueryResultRow } from "pg";
import { getPool } from "@/lib/db";
import type { WeeklyHours } from "@/lib/hours";
import { getTehranClock } from "@/lib/opening-hours";
import { tokenizePersian } from "@/lib/persian";
import { getDistrict } from "@/lib/tehran";
import type {
  OfferView,
  ProductSummary,
  SearchFilters,
  StockStatus,
} from "@/lib/search-types";

export type OfferRow = QueryResultRow & {
  product_id: string;
  title_fa: string;
  title_en: string | null;
  brand: string | null;
  category: string;
  specs: Record<string, string> | null;
  images: string[] | null;
  offer_id: string;
  recorded_price: number | null;
  price_unit: string;
  last_price_change_at: Date | null;
  warranty_provider: string | null;
  warranty_duration_months: number | null;
  shop_id: string;
  shop_name: string;
  address_text: string;
  mall_name: string | null;
  floor: string | null;
  unit: string | null;
  street: string | null;
  landmark: string | null;
  address_confidence: number | null;
  latitude: number | null;
  longitude: number | null;
  weekly_hours: WeeklyHours | string | null;
  accepts_torob_pay: boolean;
  offers_installments: boolean;
  accepts_kalabarg: boolean;
  has_fast_delivery: boolean;
  stock_status: StockStatus | null;
  confirmed_price: number | null;
  confirmed_at: Date | null;
};

export type CatalogOffer = {
  offer: OfferView;
  product: ProductSummary;
};

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

const SEARCH_ALIASES: Record<string, string[]> = {
  "ایفون": ["iphone"],
  "ایرپاد": ["airpods"],
  "مکبوک": ["macbook"],
  "مک": ["macbook"],
  "پلی": ["playstation"],
  "استیشن": ["playstation"],
  "ایکسباکس": ["xbox"],
  "اکسباکس": ["xbox"],
};

function queryTokens(q: string): string[] {
  return tokenizePersian(q)
    .map((token) => token.replace(/[^\p{L}\p{N}]+/gu, ""))
    .filter(Boolean)
    .slice(0, 6);
}

function buildWhere(
  filters: SearchFilters,
  productIds: string[] | undefined,
  values: unknown[],
): string {
  const conditions: string[] = [];

  const add = (value: unknown): string => {
    values.push(value);
    return `$${values.length}`;
  };

  if (filters.q) {
    const tokens = queryTokens(filters.q);
    if (tokens.length === 0) {
      conditions.push("1 = 0");
    }
    for (const token of tokens) {
      const variants = [token, ...(SEARCH_ALIASES[token] ?? [])];
      const clauses = variants.map((variant) => {
        const placeholder = add(`%${escapeLikePattern(variant)}%`);
        return `(p.title_fa_normalized like ${placeholder} or coalesce(p.brand_normalized, '') like ${placeholder} or coalesce(o.seller_title_normalized, '') like ${placeholder})`;
      });
      conditions.push(`(${clauses.join(" or ")})`);
    }
  }

  if (filters.category) {
    conditions.push(`p.category = ${add(filters.category)}`);
  }

  if (filters.minPrice !== null) {
    conditions.push(
      `(o.price::numeric / case when o.price_unit = 'RIAL' then 10 else 1 end) >= ${add(filters.minPrice)}`,
    );
  }

  if (filters.maxPrice !== null) {
    conditions.push(
      `(o.price::numeric / case when o.price_unit = 'RIAL' then 10 else 1 end) <= ${add(filters.maxPrice)}`,
    );
  }

  if (filters.district) {
    const district = getDistrict(filters.district);
    if (district) {
      const exact = add(district.name);
      const partial = add(`%${escapeLikePattern(district.name)}%`);
      conditions.push(
        `(s.landmark = ${exact} or s.address_text like ${partial})`,
      );
    }
  }

  if (filters.lat !== null && filters.lng !== null) {
    const latDelta = filters.radiusKm / 111;
    const lngDelta =
      filters.radiusKm / (111 * Math.max(Math.cos((filters.lat * Math.PI) / 180), 0.1));
    conditions.push(
      `(s.latitude between ${add(filters.lat - latDelta)} and ${add(filters.lat + latDelta)})`,
    );
    conditions.push(
      `(s.longitude between ${add(filters.lng - lngDelta)} and ${add(filters.lng + lngDelta)})`,
    );
  }

  if (filters.openNow) {
    const clock = getTehranClock();
    const days = [
      "saturday",
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ] as const;
    const dayIndex = days.indexOf(clock.weekday);
    const previousDay = days[(dayIndex + 6) % 7];
    const time = add(clock.time);
    conditions.push(`(
      s.weekly_hours is not null and (
        exists (
          select 1 from jsonb_array_elements(coalesce(s.weekly_hours -> ${add(clock.weekday)}, '[]'::jsonb)) r
          where ((r ->> 'close') > (r ->> 'open') and ${time} >= (r ->> 'open') and ${time} < (r ->> 'close'))
             or ((r ->> 'close') <= (r ->> 'open') and ${time} >= (r ->> 'open'))
        )
        or exists (
          select 1 from jsonb_array_elements(coalesce(s.weekly_hours -> ${add(previousDay)}, '[]'::jsonb)) r
          where (r ->> 'close') < (r ->> 'open') and ${time} < (r ->> 'close')
        )
      )
    )`);
  }

  if (filters.torobPay) conditions.push("s.accepts_torob_pay = true");
  if (filters.installments) conditions.push("s.offers_installments = true");
  if (filters.kalabarg) conditions.push("s.accepts_kalabarg = true");
  if (filters.fastDelivery) conditions.push("s.has_fast_delivery = true");

  if (productIds) {
    conditions.push(`p.id = any(${add(productIds)}::text[])`);
  }

  return conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";
}

export type GroupedProductPage = {
  productIds: string[];
  totalGroups: number;
  totalOffers: number;
};

export async function loadGroupedProductPage(
  filters: SearchFilters,
  limit: number,
): Promise<GroupedProductPage> {
  const values: unknown[] = [];
  const where = buildWhere(filters, undefined, values);
  const offset = (filters.page - 1) * filters.limit;
  values.push(limit, offset);
  const limitPlaceholder = `$${values.length - 1}`;
  const offsetPlaceholder = `$${values.length}`;
  const order =
    filters.sort === "price"
      ? "g.min_price asc nulls last, g.product_id asc"
      : filters.sort === "newest"
        ? "g.latest desc nulls last, g.product_id asc"
        : "g.offer_count desc, g.min_price asc nulls last, g.product_id asc";

  const result = await getPool().query<
    QueryResultRow & {
      product_id: string;
      total_groups: number;
      total_offers: number;
    }
  >(
    `
    with filtered as (
      select o.product_id, o.price, o.last_price_change_at
      from offers o
      join products p on p.id = o.product_id
      join shops s on s.id = o.shop_id
      ${where}
    ),
    grouped as (
      select
        product_id,
        count(*)::int as offer_count,
        min(price) filter (where price is not null) as min_price,
        max(last_price_change_at) as latest
      from filtered
      group by product_id
    )
    select
      g.product_id,
      (select count(*)::int from grouped) as total_groups,
      (select coalesce(sum(offer_count), 0)::int from grouped) as total_offers
    from grouped g
    order by ${order}
    limit ${limitPlaceholder} offset ${offsetPlaceholder}
  `,
    values,
  );

  return {
    productIds: result.rows.map((row) => row.product_id),
    totalGroups: Number(result.rows[0]?.total_groups ?? 0),
    totalOffers: Number(result.rows[0]?.total_offers ?? 0),
  };
}

export async function loadOfferRows(
  filters: SearchFilters,
  productIds?: string[],
): Promise<OfferRow[]> {
  const values: unknown[] = [];
  const where = buildWhere(filters, productIds, values);
  const sql = `
    select
      p.id as product_id,
      p.title_fa,
      p.title_en,
      p.brand,
      p.category,
      p.specs,
      p.images,
      o.id as offer_id,
      o.price as recorded_price,
      o.price_unit,
      o.last_price_change_at,
      o.warranty_provider,
      o.warranty_duration_months,
      s.id as shop_id,
      s.name as shop_name,
      s.address_text,
      s.mall_name,
      s.floor,
      s.unit,
      s.street,
      s.landmark,
      s.address_confidence,
      s.latitude,
      s.longitude,
      s.weekly_hours,
      s.accepts_torob_pay,
      s.offers_installments,
      s.accepts_kalabarg,
      s.has_fast_delivery,
      obs.stock_status,
      obs.confirmed_price,
      obs.confirmed_at
    from offers o
    join products p on p.id = o.product_id
    join shops s on s.id = o.shop_id
    left join lateral (
      select oo.stock_status, oo.confirmed_price, oo.confirmed_at
      from offer_observations oo
      where oo.offer_id = o.id
      order by oo.confirmed_at desc
      limit 1
    ) obs on true
    ${where}
    order by p.id asc, o.price asc nulls last, s.id asc
  `;

  const result = await getPool().query<OfferRow>(sql, values);
  return result.rows;
}
