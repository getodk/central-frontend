import useQueryRef from './query-ref';

/**
 * @param {number[]} pageSizeOptions - An array of exactly three numbers representing
 *   the available page size options in ascending order (e.g., [250, 500, 1000]).
 */
export default (pageSizeOptions) => {
  const pageNumber = useQueryRef({
    fromQuery: (query) => {
      const num = Number.parseInt(query['page-number'], 10);
      if (!num || num < 1) return 0;
      return num - 1;
    },
    toQuery: (value) => ({ 'page-number': value === 0 ? null : value + 1 })
  });

  const pageSize = useQueryRef({
    fromQuery: (query) => {
      const size = Number.parseInt(query['page-size'], 10);

      if (!size || size < pageSizeOptions[0]) return pageSizeOptions[0];
      if (size >= pageSizeOptions[2]) return pageSizeOptions[2];
      if (size >= pageSizeOptions[1]) return pageSizeOptions[1];
      return pageSizeOptions[0];
    },
    toQuery: (value) => ({ 'page-size': value })
  });

  return {
    pageNumber,
    pageSize
  };
};
