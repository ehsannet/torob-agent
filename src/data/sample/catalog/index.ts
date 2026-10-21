import { applianceCategory } from "./appliance";
import { cameraCategory } from "./camera";
import { consoleCategory } from "./console";
import { headphonesCategory } from "./headphones";
import { laptopCategory } from "./laptop";
import { mobileCategory } from "./mobile";
import { smartwatchCategory } from "./smartwatch";
import { tvCategory } from "./tv";
import type { CategoryCatalog } from "./types";

export const CATEGORIES: readonly CategoryCatalog[] = [
  mobileCategory,
  laptopCategory,
  headphonesCategory,
  smartwatchCategory,
  consoleCategory,
  tvCategory,
  cameraCategory,
  applianceCategory,
];

export type { BrandCatalog, CategoryCatalog } from "./types";
