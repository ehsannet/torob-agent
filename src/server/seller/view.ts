import { getPool } from "@/lib/db";
import type { SellerCheckView } from "@/lib/seller-types";
import { loadOfferRows } from "../search-query";
import { mapOffer } from "../search-results";
import { loadSellerAlternatives } from "./alternatives";
import { isDemoMode, sellerChannel } from "./channel";
import {
  BASE_FILTERS,
  iso,
  latestObservation,
  loadContext,
  type CheckContextRow,
} from "./context";
import { advanceSimulatedCheck } from "./simulator";
import { buildSellerTimeline, sellerChannelForToken } from "./tokens";

async function expireIfNeeded(row: CheckContextRow): Promise<CheckContextRow> {
  if (row.status !== "sent" || !row.expires_at) return row;
  if (row.expires_at.getTime() > Date.now()) return row;
  await getPool().query(
    `update seller_checks set status = 'expired'
     where token = $1 and status in ('created', 'sent')`,
    [row.token],
  );
  return (await loadContext(row.token)) ?? { ...row, status: "expired" };
}

export async function getSellerCheckView(
  token: string,
): Promise<SellerCheckView | null> {
  await advanceSimulatedCheck(token);
  let row = await loadContext(token);
  if (!row) return null;
  row = await expireIfNeeded(row);

  const offerItems = await loadOfferRows(BASE_FILTERS, [row.product_id]);
  const item = offerItems
    .map((offer) => mapOffer(offer, new Date(), null))
    .find((mapped) => mapped.offer.id === row.offer_id);
  if (!item) return null;

  const observation = await latestObservation(item.offer.id);
  const needsAlternatives =
    row.status === "expired" || item.offer.stockStatus === "out_of_stock";
  const alternatives = needsAlternatives
    ? await loadSellerAlternatives(item.offer, item.product).catch(() => [])
    : [];
  const kind = sellerChannelForToken(token);

  return {
    token,
    status: row.status,
    simulated: kind === "simulator",
    demoMode: isDemoMode(),
    createdAt: row.created_at.toISOString(),
    sentAt: iso(row.sent_at),
    viewedAt: iso(row.viewed_at),
    answeredAt: iso(row.answered_at),
    expiresAt: iso(row.expires_at),
    shop: {
      id: item.offer.shopId,
      name: item.offer.shopName,
      addressText: item.offer.addressText,
      mallName: item.offer.mallName,
      floor: item.offer.floor,
      unit: item.offer.unit,
      street: item.offer.street,
      landmark: item.offer.landmark,
      latitude: item.offer.latitude,
      longitude: item.offer.longitude,
    },
    product: {
      id: item.product.id,
      titleFa: item.product.titleFa,
      brand: item.product.brand,
      category: item.product.category,
      images: item.product.images,
    },
    offer: {
      id: item.offer.id,
      priceToman: item.offer.priceToman,
      priceUnit: item.offer.priceUnit,
      lastPriceChangeAt: item.offer.lastPriceChangeAt,
      stockStatus: item.offer.stockStatus,
      confirmedPriceToman: item.offer.confirmedPriceToman,
      stockConfirmedAt: item.offer.stockConfirmedAt,
      openState: item.offer.openStatus.state,
      openLabel: item.offer.openStatus.label,
      closesAt: item.offer.openStatus.closesAt,
      hoursConfirmedAt: item.offer.hoursConfirmedAt,
      warrantyProvider: item.offer.warrantyProvider,
      warrantyDurationMonths: item.offer.warrantyDurationMonths,
    },
    questions: row.questions,
    timeline: buildSellerTimeline({
      status: row.status,
      createdAt: row.created_at.toISOString(),
      sentAt: iso(row.sent_at),
      viewedAt: iso(row.viewed_at),
      answeredAt: iso(row.answered_at),
      expiresAt: iso(row.expires_at),
    }),
    latestObservation: observation,
    alternatives,
    linkPath: sellerChannel(kind).sellerPath(token),
  };
}
