import { BrowserContext, Page, Route } from '@playwright/test';

const ROADMAP_LAND_COLOR = '#f2efe9';
const SATELLITE_LAND_COLOR = '#5b7553';
const GOOGLE_SERVERS = 'https://*.googleapis.com/**';
const GOOGLE_PLACE_SEARCH_SERVER = 'https://geocode.googleapis.com/**';
const GOOGLE_TILES_PATH = '/v1/2dtiles/';

// Close to the features of the test form, so the map jumps to the place without a long animation.
const PLACE = {
  formattedAddress: 'Coober Pedy SA 5723, Australia',
  viewport: {
    low: { latitude: -29.06, longitude: 134.7 },
    high: { latitude: -28.97, longitude: 134.8 },
  },
  granularity: 'APPROXIMATE',
};

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
const drawTile = (zoom: number, label = `zoom: ${zoom}`, landColor = ROADMAP_LAND_COLOR) => {
  const ROAD_OUTLINE_SIDES = 2;

  const roadWidth = getRoadWidth(zoom);
  const roadOutlineWidth = roadWidth + ROAD_OUTLINE_SIDES;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
  <rect width="256" height="256" fill="${landColor}" />
  <ellipse cx="72" cy="176" rx="36" ry="24" fill="#aad3df" />
  <path d="M152 24 L232 40 L216 112 L144 96 Z" fill="#cdebb0" />
  <path d="M0 96 H256 M160 0 V256" stroke="#c6c3bc" stroke-width="${roadOutlineWidth}" />
  <path d="M0 96 H256 M160 0 V256" stroke="#ffffff" stroke-width="${roadWidth}" />
  <text x="8" y="248" font-family="sans-serif" font-size="12" fill="#9c9a94">${label}</text>
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

const fulfillGoogleTile = (route: Route, url: URL) => {
  const [zoom] = url.pathname.slice(GOOGLE_TILES_PATH.length).split('/');
  const mapType = url.searchParams.get('session');
  const landColor = mapType === 'satellite' ? SATELLITE_LAND_COLOR : ROADMAP_LAND_COLOR;
  const body = drawTile(Number(zoom), `${mapType} zoom: ${zoom}`, landColor);
  return route.fulfill({ body, contentType: 'image/svg+xml' });
};

const fulfillGoogleData = (route: Route) => {
  const sessionRequest = route.request().postDataJSON() as { mapType: string } | null;
  const expiry = String(Math.floor(Date.now() / 1000) + 24 * 60 * 60);
  return route.fulfill({
    json: {
      session: sessionRequest?.mapType,
      expiry,
      tileWidth: 256,
      tileHeight: 256,
      copyright: 'Map data ©2026 Stubbed',
      results: [PLACE],
    },
  });
};

const fulfillGoogleRequest = (route: Route) => {
  const url = new URL(route.request().url());
  if (url.pathname.startsWith(GOOGLE_TILES_PATH)) {
    return fulfillGoogleTile(route, url);
  }
  return fulfillGoogleData(route);
};

export const stubGoogleMaps = (context: BrowserContext) => {
  return context.route(GOOGLE_SERVERS, fulfillGoogleRequest);
};

export const stubPlaceSearchFailure = (page: Page) => {
  return page.route(GOOGLE_PLACE_SEARCH_SERVER, (route: Route) => route.abort());
};
