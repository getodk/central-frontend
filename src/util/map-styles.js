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

// Filters
const not = (x) => ['!', x];
const eq = (x, y) => ['==', x, y];
const ne = (x, y) => ['!=', x, y];
const all = (...xs) => ['all', ...xs];
const geometryType = (...types) => ['in', ['geometry-type'], ['literal', types]];
const isCluster = ['has', 'clusterSize'];
const getId = ['get', 'id'];
const featureVar = ['var', 'selectedId'];

// A lighter version of $color-accent-primary (magenta)
const lightColor = 'rgba(222, 142, 183, 0.6)';

// Styles
const circleStyle = {
  'circle-radius': 30,
  'circle-fill-color': lightColor,
  'circle-displacement': [0, 0]
};
const styleIcon = (length) => ({
  'icon-src': mapLocationIcon,
  'icon-width': length,
  'icon-height': length
});
const styleStroke = (width, color, fillColor = undefined) => {
  const result = { 'stroke-width': width, 'stroke-color': color };
  if (fillColor) result['fill-color'] = fillColor;
  return result;
};

export const getStyles = () => [
  // Unselected Point
  {
    filter: all(geometryType('Point'), not(isCluster), ne(getId, featureVar)),
    style: styleIcon(40)
  },
  // Selected Point
  {
    filter: all(geometryType('Point'), eq(getId, featureVar)),
    style: [circleStyle, styleIcon(50)]
  },

  // Selected LineString or Polygon
  {
    filter: all(geometryType('LineString', 'Polygon'), eq(getId, featureVar)),
    style: styleStroke(20, lightColor, 'transparent')
  },
  // Increase the clickable area of an unselected LineString.
  {
    filter: all(geometryType('LineString'), ne(getId, featureVar)),
    style: styleStroke(20, 'rgba(255, 255, 255, 0.1)')
  },
  // Any LineString or Polygon
  {
    filter: geometryType('LineString', 'Polygon'),
    style: styleStroke(3, '#b9005c', 'rgba(185, 0, 92, 0.2)')
  },

  // Cluster Point
  {
    filter: isCluster,
    style: circleStyle
  }
];

export const getTextStyles = () => {
  const style = getComputedStyle(document.body);
  return [
    {
      filter: isCluster,
      style: {
        'text-value': ['get', 'clusterSize'],
        'text-font': `500 ${style.fontSize} ${style.fontFamily}`,
        'text-fill-color': '#333',
      },
    },
  ];
};
