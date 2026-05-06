// eslint-disable-next-line import/prefer-default-export
export const wktToGeojson = (wkt) => {
  if (wkt == null) return null;
  const match = wkt.match(/\d+(\.\d+)?/g);
  if (match == null) return null;
  const coordinates = match.map(s => Number.parseInt(s, 10));
  return {
    type: 'Feature',
    geometry: {
      type: 'GeometryCollection',
      geometries: [{ type: 'Point', coordinates }]
    }
  };
};
