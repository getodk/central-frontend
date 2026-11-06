import { BrowserContext } from '@playwright/test';

const getRoadWidth = (zoom: number) => {
  const START_WIDENING_AT_ZOOM = 11;
  const WIDTH_PER_ZOOM_LEVEL = 3;
  const MIN_ROAD_WIDTH = 3;
  const MAX_ROAD_WIDTH = 16;

  const roadWidth = (zoom - START_WIDENING_AT_ZOOM) * WIDTH_PER_ZOOM_LEVEL;
  return Math.min(MAX_ROAD_WIDTH, Math.max(MIN_ROAD_WIDTH, roadWidth));
};

// Draws a tile with a pond, a park and two roads that continue into the neighbouring tiles.
// The road width and the label change with the zoom level, so screenshots show which zoom level is displayed.
const drawTile = (zoom: number) => {
  const ROAD_OUTLINE_SIDES = 2;

  const roadWidth = getRoadWidth(zoom);
  const roadOutlineWidth = roadWidth + ROAD_OUTLINE_SIDES;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
  <rect width="256" height="256" fill="#f2efe9" />
  <ellipse cx="72" cy="176" rx="36" ry="24" fill="#aad3df" />
  <path d="M152 24 L232 40 L216 112 L144 96 Z" fill="#cdebb0" />
  <path d="M0 96 H256 M160 0 V256" stroke="#c6c3bc" stroke-width="${roadOutlineWidth}" />
  <path d="M0 96 H256 M160 0 V256" stroke="#ffffff" stroke-width="${roadWidth}" />
  <text x="8" y="248" font-family="sans-serif" font-size="12" fill="#9c9a94">zoom: ${zoom}</text>
</svg>`;
};

// Replaces live map tiles with generated ones so screenshots never depend on map data or network.
export const stubMapTiles = (context: BrowserContext) => {
  const TILE_SERVER = 'https://tile.openstreetmap.org/';

  return context.route(`${TILE_SERVER}**`, async (route) => {
    const [zoom] = route.request().url().slice(TILE_SERVER.length).split('/');
    await route.fulfill({ body: drawTile(Number(zoom)), contentType: 'image/svg+xml' });
  });
};
