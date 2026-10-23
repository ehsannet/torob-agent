import type { QueryResultRow } from "pg";
import { getPool } from "@/lib/db";
import { parseWeeklyHours, type WeeklyHours } from "@/lib/hours";
import { getOpenStatus, type OpenStatus } from "@/lib/opening-hours";
import type { CatalogOffer } from "./search-query";
import {
  loadOfferRowById,
  loadShopOfferRows,
} from "./search-query";
import { mapOffer } from "./search-results";
import { buildVisitPlan, type VisitPlan } from "@/lib/visit-plan";

type ShopRecord = QueryResultRow & {
  id: string;
  name: string;
  activity_category: string | null;
  description: string | null;
  address_text: string;
  mall_name: string | null;
  floor: string | null;
  unit: string | null;
  street: string | null;
  landmark: string | null;
  address_confidence: number;
  latitude: number | null;
  longitude: number | null;
  weekly_hours: WeeklyHours | string | null;
  confirmed_hours: WeeklyHours | string | null;
  hours_confirmed_at: Date | null;
  phone: string | null;
  instagram: string | null;
  website: string | null;
  accepts_torob_pay: boolean;
  offers_installments: boolean;
  accepts_kalabarg: boolean;
  has_fast_delivery: boolean;
};

export type ShopFeatures = {
  torobPay: boolean;
  installments: boolean;
  kalabarg: boolean;
  fastDelivery: boolean;
};

export type ShopDetail = {
  id: string;
  name: string;
  activityCategory: string | null;
  description: string | null;
  addressText: string;
  mallName: string | null;
  floor: string | null;
  unit: string | null;
  street: string | null;
  landmark: string | null;
  addressConfidence: number;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  instagram: string | null;
  website: string | null;
  features: ShopFeatures;
  openStatus: OpenStatus;
  weeklyHours: WeeklyHours | null;
  hoursConfirmedAt: string | null;
  plan: VisitPlan;
  offers: CatalogOffer[];
  totalOffers: number;
};

const SHOP_SELECT = `
  select
    s.id,
    s.name,
    s.activity_category,
    s.description,
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
    s.phone,
    s.instagram,
    s.website,
    s.accepts_torob_pay,
    s.offers_installments,
    s.accepts_kalabarg,
    s.has_fast_delivery,
    shop_obs.confirmed_hours,
    shop_obs.confirmed_at as hours_confirmed_at
  from shops s
  left join lateral (
    select so.confirmed_hours, so.confirmed_at
    from shop_observations so
    where so.shop_id = s.id and so.confirmed_hours is not null
    order by so.confirmed_at desc
    limit 1
  ) shop_obs on true
`;

async function loadShopRecord(shopId: string): Promise<ShopRecord | null> {
  const result = await getPool().query<ShopRecord>(
    `${SHOP_SELECT} where s.id = $1 limit 1`,
    [shopId],
  );
  return result.rows[0] ?? null;
}

type PlanShopRecord = Pick<
  ShopRecord,
  | "id"
  | "name"
  | "address_text"
  | "mall_name"
  | "floor"
  | "unit"
  | "street"
  | "landmark"
  | "address_confidence"
  | "latitude"
  | "longitude"
>;

function recordToPlanInput(row: PlanShopRecord, openStatus: OpenStatus) {
  return {
    shopId: row.id,
    shopName: row.name,
    addressText: row.address_text,
    mallName: row.mall_name,
    floor: row.floor,
    unit: row.unit,
    street: row.street,
    landmark: row.landmark,
    addressConfidence: Number(row.address_confidence),
    latitude: row.latitude,
    longitude: row.longitude,
    openStatus,
  };
}

export async function getShopDetail(shopId: string): Promise<ShopDetail | null> {
  const [record, offerRows, countResult] = await Promise.all([
    loadShopRecord(shopId),
    loadShopOfferRows(shopId),
    getPool().query<QueryResultRow & { count: number }>(
      "select count(*)::int as count from offers where shop_id = $1",
      [shopId],
    ),
  ]);
  if (!record) return null;

  const now = new Date();
  const hours = parseWeeklyHours(record.confirmed_hours ?? record.weekly_hours);
  const hoursConfirmedAt = record.hours_confirmed_at
    ? record.hours_confirmed_at.toISOString()
    : null;
  const openStatus = getOpenStatus(hours, now);
  const offers = offerRows.map((row) => mapOffer(row, now, null));
  const hasStalePrice = offers.some(({ offer }) => offer.stalePrice);

  return {
    id: record.id,
    name: record.name,
    activityCategory: record.activity_category,
    description: record.description,
    addressText: record.address_text,
    mallName: record.mall_name,
    floor: record.floor,
    unit: record.unit,
    street: record.street,
    landmark: record.landmark,
    addressConfidence: Number(record.address_confidence),
    latitude: record.latitude,
    longitude: record.longitude,
    phone: record.phone,
    instagram: record.instagram,
    website: record.website,
    features: {
      torobPay: record.accepts_torob_pay,
      installments: record.offers_installments,
      kalabarg: record.accepts_kalabarg,
      fastDelivery: record.has_fast_delivery,
    },
    openStatus,
    weeklyHours: hours,
    hoursConfirmedAt,
    plan: buildVisitPlan({
      ...recordToPlanInput(record, openStatus),
      stalePrice: hasStalePrice,
      hoursConfirmedAt,
    }),
    offers,
    totalOffers: Number(countResult.rows[0]?.count ?? 0),
  };
}

export async function getVisitPlanForOffer(
  offerId: string,
): Promise<VisitPlan | null> {
  const row = await loadOfferRowById(offerId);
  if (!row) return null;
  const item = mapOffer(row, new Date(), null);
  return buildVisitPlan({
    shopId: item.offer.shopId,
    shopName: item.offer.shopName,
    addressText: item.offer.addressText,
    mallName: item.offer.mallName,
    floor: item.offer.floor,
    unit: item.offer.unit,
    street: item.offer.street,
    landmark: item.offer.landmark,
    addressConfidence: item.offer.addressConfidence,
    latitude: item.offer.latitude,
    longitude: item.offer.longitude,
    openStatus: item.offer.openStatus,
    stockStatus: item.offer.stockStatus,
    stalePrice: item.offer.stalePrice,
    hoursConfirmedAt: item.offer.hoursConfirmedAt,
    priceToman: item.offer.confirmedPriceToman ?? item.offer.priceToman,
    productTitle: item.product.titleFa,
    offerId: item.offer.id,
  });
}

export async function getVisitPlanForShop(
  shopId: string,
): Promise<VisitPlan | null> {
  const detail = await getShopDetail(shopId);
  if (!detail) return null;
  const chosen =
    detail.offers.find(({ offer }) => offer.stockStatus === "in_stock") ??
    detail.offers[0];

  return buildVisitPlan({
    shopId: detail.id,
    shopName: detail.name,
    addressText: detail.addressText,
    mallName: detail.mallName,
    floor: detail.floor,
    unit: detail.unit,
    street: detail.street,
    landmark: detail.landmark,
    addressConfidence: detail.addressConfidence,
    latitude: detail.latitude,
    longitude: detail.longitude,
    openStatus: detail.openStatus,
    stockStatus: chosen?.offer.stockStatus ?? null,
    stalePrice: chosen?.offer.stalePrice ?? false,
    hoursConfirmedAt: detail.hoursConfirmedAt,
    priceToman: chosen?.offer.confirmedPriceToman ?? chosen?.offer.priceToman ?? null,
    productTitle: chosen?.product.titleFa ?? null,
    offerId: chosen?.offer.id ?? null,
  });
}
