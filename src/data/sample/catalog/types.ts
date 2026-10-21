export type BrandCatalog = {
  brand: string;
  brandFa: string;
  priceFactor: number;
  models: readonly string[];
};

export type CategoryCatalog = {
  key: string;
  labelFa: string;
  prefix: string;
  priceRange: readonly [number, number];
  brands: readonly BrandCatalog[];
  variants: readonly string[];
  variantSpecKey: string;
  specOptions: Record<string, readonly string[]>;
};
