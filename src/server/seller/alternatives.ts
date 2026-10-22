import { getPool } from "@/lib/db";
import type { OfferView, ProductSummary, SearchFilters } from "@/lib/search-types";
import { OPEN_LABELS } from "@/lib/ui-labels";
import type { SellerAlternative } from "@/lib/seller-types";
import { loadOfferRows } from "../search-query";
import { groupCatalogOffers, mapOffer } from "../search-results";

const BASE_FILTERS: SearchFilters = {
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

function openRank(offer: OfferView): number {
  if (offer.openStatus.state === "open") return 0;
  if (offer.openStatus.state === "closing_soon") return 1;
  if (offer.openStatus.state === "unknown") return 2;
  return 3;
}

function toAlternative(
  offer: OfferView,
  product: ProductSummary,
  reason: string,
): SellerAlternative {
  return {
    kind: reason.includes("همین محصول") ? "same_product" : "similar",
    offerId: offer.id,
    productId: product.id,
    productTitle: product.titleFa,
    shopId: offer.shopId,
    shopName: offer.shopName,
    addressText: offer.addressText,
    priceToman: offer.priceToman,
    stockStatus: offer.stockStatus,
    openState: offer.openStatus.state,
    openLabel: OPEN_LABELS[offer.openStatus.state],
    distanceKm: offer.distanceKm,
    reason,
  };
}

async function loadSameProduct(
  offer: OfferView,
  product: ProductSummary,
): Promise<SellerAlternative[]> {
  const rows = await loadOfferRows(BASE_FILTERS, [product.id]);
  return rows
    .map((row) => mapOffer(row, new Date(), null))
    .filter(
      (item) =>
        item.offer.id !== offer.id &&
        item.offer.shopId !== offer.shopId &&
        item.offer.stockStatus !== "out_of_stock",
    )
    .sort((a, b) => {
      const byOpen = openRank(a.offer) - openRank(b.offer);
      if (byOpen !== 0) return byOpen;
      const aPrice = a.offer.priceToman ?? Number.MAX_SAFE_INTEGER;
      const bPrice = b.offer.priceToman ?? Number.MAX_SAFE_INTEGER;
      return aPrice - bPrice;
    })
    .slice(0, 3)
    .map((item) =>
      toAlternative(item.offer, item.product, "همین محصول در فروشگاه دیگر"),
    );
}

async function loadSimilarProducts(
  offer: OfferView,
  product: ProductSummary,
): Promise<SellerAlternative[]> {
  if (product.category === "نامشخص" || offer.priceToman === null) return [];
  const min = Math.max(1_000, Math.floor(offer.priceToman * 0.6));
  const max = Math.min(2_000_000_000, Math.ceil(offer.priceToman * 1.6));
  const result = await getPool().query<{ product_id: string }>(
    `select o.product_id
     from offers o
     join products p on p.id = o.product_id
     where p.category = $1
       and o.product_id <> $2
       and o.shop_id <> $3
       and o.price is not null
       and (o.price::numeric / case when o.price_unit = 'RIAL' then 10 else 1 end)
           between $4 and $5
       and ($6::text is null or p.brand_normalized = $6)
     group by o.product_id
     order by min(o.price) asc
     limit 8`,
    [
      product.category,
      product.id,
      offer.shopId,
      min,
      max,
      product.brand ?? null,
    ],
  );
  const ids = result.rows.map((row) => row.product_id);
  if (ids.length === 0) return [];
  const rows = await loadOfferRows(BASE_FILTERS, ids);
  const items = rows.map((row) => mapOffer(row, new Date(), null));
  return groupCatalogOffers(items)
    .filter((group) => group.bestOffer !== null)
    .slice(0, 3)
    .map((group) =>
      toAlternative(
        group.bestOffer as OfferView,
        group.product,
        "محصول مشابه در همان دسته و بازهٔ قیمت",
      ),
    );
}

export async function loadSellerAlternatives(
  offer: OfferView,
  product: ProductSummary,
): Promise<SellerAlternative[]> {
  const sameProduct = await loadSameProduct(offer, product);
  if (sameProduct.length >= 3) return sameProduct;
  const similar = await loadSimilarProducts(offer, product);
  const seen = new Set(sameProduct.map((item) => item.offerId));
  return [
    ...sameProduct,
    ...similar.filter((item) => !seen.has(item.offerId)),
  ].slice(0, 4);
}

export async function loadAlternativesForOffer(
  offerId: string,
): Promise<SellerAlternative[]> {
  const result = await getPool().query<{ product_id: string }>(
    "select product_id from offers where id = $1",
    [offerId],
  );
  const productId = result.rows[0]?.product_id;
  if (!productId) return [];
  const rows = await loadOfferRows(BASE_FILTERS, [productId]);
  const item = rows
    .map((row) => mapOffer(row, new Date(), null))
    .find((mapped) => mapped.offer.id === offerId);
  if (!item) return [];
  return loadSellerAlternatives(item.offer, item.product);
}
