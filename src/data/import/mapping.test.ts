import { describe, expect, it } from "vitest";
import { mapRawCatalog } from "./mapping";

const raw = {
  shops: [
    {
      id: "shop-1",
      name: "فروشگاه نمونه",
      address: "تهران، ونک، خیابان ولیعصر، پلاک ۱۲",
      weekly_hours: {
        "شنبه": "۹:۰۰-۲۱:۰۰",
        "جمعه": [],
      },
      address_confidence: 85,
      "پرداخت توروب": "بله",
      latitude: "35.7573",
      longitude: "51.4102",
    },
  ],
  products: [
    {
      id: "product-1",
      title_fa: "گوشی موبایل سامسونگ Galaxy S24",
      brand: "Samsung",
      category: "موبایل",
      specs: { "حافظه": "۲۵۶GB", "رنگ": "مشکی" },
    },
  ],
  offers: [
    {
      id: "offer-1",
      shop_id: "shop-1",
      product_id: "product-1",
      price: "۲۵٬۰۰۰٬۰۰۰ تومان",
      price_unit: "تومان",
      last_price_change_at: "2026-10-01T10:00:00Z",
      "گارانتی": "شرکت سازنده",
      warranty_duration_months: "۱۸",
    },
  ],
};

describe("mapRawCatalog", () => {
  it("maps shops, products and offers with aliases", () => {
    const catalog = mapRawCatalog(raw);

    expect(catalog.shops).toHaveLength(1);
    expect(catalog.products).toHaveLength(1);
    expect(catalog.offers).toHaveLength(1);

    const shop = catalog.shops[0];
    expect(shop.nameNormalized).toBe("فروشگاه نمونه");
    expect(shop.addressConfidence).toBe(0.85);
    expect(shop.street).toBe("خیابان ولیعصر");
    expect(shop.unit).toBe("پلاک ۱۲");
    expect(shop.acceptsTorobPay).toBe(true);
    expect(shop.latitude).toBeCloseTo(35.7573);
    expect(shop.weeklyHours).toEqual({
      saturday: [{ open: "09:00", close: "21:00" }],
      friday: [],
    });

    const product = catalog.products[0];
    expect(product.titleFaNormalized).toBe("گوشی موبایل سامسونگ galaxy s24");
    expect(product.brandNormalized).toBe("samsung");
    expect(product.specs).toEqual({ "حافظه": "۲۵۶GB", "رنگ": "مشکی" });

    const offer = catalog.offers[0];
    expect(offer.price).toBe(25_000_000);
    expect(offer.priceUnit).toBe("TOMAN");
    expect(offer.warrantyDurationMonths).toBe(18);
    expect(offer.lastPriceChangeAt?.toISOString()).toBe("2026-10-01T10:00:00.000Z");
  });


  it("maps the real Torob CSV columns", () => {
    const catalog = mapRawCatalog({
      shops: [
        {
          shop_id: "shop-1",
          name: "فروشگاه واقعی",
          address: "خیابان جمهوری، پاساژ علالدین، طبقه ۶، واحد ۶۲۲",
          category_names: '["گوشی موبایل","لوازم جانبی موبایل"]',
          contacts:
            '[{"channel":"phone","display_number":"۰۲۱۲۶۴۶۷۱۸۰"}]',
          location_label: "شیخ هادی",
          instagram:
            '{"handle":"shop","profile_url":"https://instagram.com/shop"}',
          website_url: "https://shop.example",
          supports_fast_delivery: "true",
          payment_options:
            '[{"provider_name":"ترب‌پی","channel":"unknown"}]',
          weekly_hours:
            '{"sat":{"status":"declared","shifts":[{"start_time":"10:00:00","end_time":"19:00:00"}]},"fri":{"status":"closed","shifts":[]}}',
          lat: "35.69",
          lon: "51.40",
        },
      ],
      products: [
        {
          product_id: "product-1",
          persian_title: "گوشی موبایل سامسونگ",
          brand_name: "سامسونگ",
          category_name: "گوشی موبایل",
          image_urls: '["https://image.torob.com/a.jpg"]',
          specs:
            '[{"key":"حافظه","section":"مشخصات کلی","value":"۲۵۶GB"},{"key":"رنگ","section":"مشخصات کلی","value":"مشکی"}]',
        },
      ],
      offers: [
        {
          offer_id: "offer-1",
          shop_id: "shop-1",
          product_id: "product-1",
          price_toman: "25000000",
          last_price_changed_at: "2026-10-01T10:00:00Z",
          warranty: '{"provider":"شرکتی","period_months":18}',
        },
      ],
    });

    const shop = catalog.shops[0];
    expect(shop.activityCategory).toBe("گوشی موبایل");
    expect(shop.phone).toBe("۰۲۱۲۶۴۶۷۱۸۰");
    expect(shop.landmark).toBe("شیخ هادی");
    expect(shop.mallName).toBe("پاساژ علالدین");
    expect(shop.floor).toBe("۶");
    expect(shop.unit).toBe("واحد ۶۲۲");
    expect(shop.street).toBe("خیابان جمهوری");
    expect(shop.addressConfidence).toBeGreaterThanOrEqual(0.9);
    expect(shop.instagram).toBe("https://instagram.com/shop");
    expect(shop.website).toBe("https://shop.example");
    expect(shop.acceptsTorobPay).toBe(true);
    expect(shop.hasFastDelivery).toBe(true);
    expect(shop.weeklyHours).toEqual({
      saturday: [{ open: "10:00", close: "19:00" }],
      friday: [],
    });

    const product = catalog.products[0];
    expect(product.brand).toBe("سامسونگ");
    expect(product.category).toBe("گوشی موبایل");
    expect(product.specs).toEqual({ "حافظه": "۲۵۶GB", "رنگ": "مشکی" });

    const offer = catalog.offers[0];
    expect(offer.price).toBe(25_000_000);
    expect(offer.warrantyProvider).toBe("شرکتی");
    expect(offer.warrantyDurationMonths).toBe(18);
    expect(offer.lastPriceChangeAt?.toISOString()).toBe("2026-10-01T10:00:00.000Z");
  });

  it("defaults a missing address to a low-confidence placeholder", () => {
    const catalog = mapRawCatalog({
      shops: [{ id: "s", name: "فروشگاه" }],
      products: [],
      offers: [],
    });
    expect(catalog.shops[0].addressText).toBe("آدرس نامشخص");
    expect(catalog.shops[0].addressConfidence).toBe(0.2);
  });

  it("rejects duplicate ids and broken references", () => {
    expect(() =>
      mapRawCatalog({
        shops: [
          { id: "s", name: "الف" },
          { id: "s", name: "ب" },
        ],
      }),
    ).toThrow(/duplicate shop id/);

    expect(() =>
      mapRawCatalog({
        shops: [{ id: "s", name: "الف" }],
        products: [{ id: "p", title: "محصول" }],
        offers: [{ id: "o", shop_id: "missing", product_id: "p" }],
      }),
    ).toThrow(/unknown shop_id/);
  });

  it("rejects rows without a name or title", () => {
    expect(() => mapRawCatalog({ shops: [{ id: "s" }] })).toThrow(/missing required field/);
    expect(() => mapRawCatalog({ products: [{ id: "p" }] })).toThrow(
      /missing required field/,
    );
  });
});
