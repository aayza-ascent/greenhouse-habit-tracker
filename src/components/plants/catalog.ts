// Per-species shop metadata: price + flavor description. Kept separate from
// flowers-v2.ts (which is render-only) so balance changes don't churn the
// sprite data. Three species are 0-cost starters handed out at onboarding.

import type { FlowerType } from "./flowers-v2";

export type CatalogEntry = {
  price: number;
  desc: string;
  starter?: boolean;
};

export const PLANT_CATALOG: Record<FlowerType, CatalogEntry> = {
  rose: { price: 120, desc: "Tend with patience" },
  tulip: { price: 0, desc: "Classic spring bulb", starter: true },
  sunflower: { price: 60, desc: "Reaches for the light", starter: true },
  daisy: { price: 20, desc: "Cheerful little face", starter: true },
  lavender: { price: 55, desc: "Calming purple spires" },
  lily: { price: 90, desc: "Trumpet, orange" },
  poppy: { price: 75, desc: "Fern leaf, scarlet" },
  bluebell: { price: 65, desc: "Hanging cluster" },
  marigold: { price: 45, desc: "Layered orange" },
  iris: { price: 130, desc: "Rare. Ruffled purple" },
};

export const STARTER_TYPES = (Object.entries(PLANT_CATALOG) as [FlowerType, CatalogEntry][])
  .filter(([, c]) => c.starter)
  .map(([t]) => t);
