/*
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import mapLocationIcon from '../assets/images/geojson-map/map-location.svg';

const DEFAULT_POINT_STYLE = {
  'icon-src': mapLocationIcon,
  'icon-width': 40,
  'icon-height': 40,
};

const DEFAULT_LINE_STYLE = {
  'stroke-width': 6,
  'stroke-color': '#3E9FCC',
};

const DEFAULT_POLYGON_STYLE = {
  'fill-color': 'rgba(233, 248, 255, 0.8)',
  'stroke-width': 6,
  'stroke-color': '#3E9FCC',
};

const SCALE_POINT_STYLE = {
  'icon-src': mapLocationIcon,
  'icon-width': 50,
  'icon-height': 50,
};

const SCALE_LINE_STYLE = {
  'stroke-width': 10,
  'stroke-color': '#3E9FCC',
};

const SCALE_POLYGON_STYLE = {
  'stroke-width': 10,
};

const GLOW_POINT_STYLE = {
  'circle-radius': 30,
  'circle-fill-color': 'rgba(148, 224, 237, 0.7)',
  'circle-displacement': [0, 0],
};

const GLOW_LINE_STYLE = {
  'stroke-width': 20,
  'stroke-color': 'rgba(148, 224, 237, 0.7)',
};

const GLOW_POLYGON_STYLE = {
  'stroke-width': 20,
  'stroke-color': 'rgba(148, 224, 237, 0.7)',
  'fill-color': 'transparent',
};

export const getUnselectedStyles = () => {
  const makeFilter = (type) => [
    'all',
    ['!', ['has', 'clusterSize']],
    ['match', ['geometry-type'], type, true, false],
    ['!=', ['get', 'id'], ['var', 'selectedId']],
  ];

  return [
    {
      filter: ['has', 'clusterSize'],
      style: GLOW_POINT_STYLE,
    },
    {
      filter: makeFilter('Point'),
      style: DEFAULT_POINT_STYLE,
    },
    {
      filter: makeFilter('LineString'),
      style: DEFAULT_LINE_STYLE,
    },
    {
      filter: makeFilter('Polygon'),
      style: DEFAULT_POLYGON_STYLE,
    },
  ];
};

export const getSelectedStyles = () => {
  const makeFilter = (type) => [
    'all',
    ['!', ['has', 'clusterSize']],
    ['match', ['geometry-type'], type, true, false],
    ['==', ['get', 'id'], ['var', 'selectedId']],
  ];

  return [
    {
      filter: makeFilter('Point'),
      style: [GLOW_POINT_STYLE, DEFAULT_POINT_STYLE, SCALE_POINT_STYLE],
    },
    {
      filter: makeFilter('LineString'),
      style: [GLOW_LINE_STYLE, DEFAULT_LINE_STYLE, SCALE_LINE_STYLE],
    },
    {
      filter: makeFilter('Polygon'),
      style: [GLOW_POLYGON_STYLE, DEFAULT_POLYGON_STYLE, SCALE_POLYGON_STYLE],
    },
  ];
};

export const getClusterSizeStyles = () => {
  const style = getComputedStyle(document.body);
  return [
    {
      filter: ['has', 'clusterSize'],
      style: {
        'text-value': ['get', 'clusterSize'],
        'text-font': `500 ${style.fontSize} ${style.fontFamily}`,
        'text-fill-color': style.color,
      },
    },
  ];
};
