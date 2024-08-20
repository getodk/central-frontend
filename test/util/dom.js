// Returns the text in a Vue Test Utils wrapper, excluding text in elements
// selected by `selector`.
export const textWithout = (wrapper, selector) => {
  const without = wrapper.element.cloneNode(true);
  for (const element of without.querySelectorAll(selector)) element.remove();
  return without.textContent.trim();
};

// Searches a component for a nav tab whose text matches the specified text. The
// component must contain a PageBody component.
export const findTab = (component, text) => {
  // The component may contain multiple .nav-tabs.
  const navs = component.findAll('.nav-tabs');
  const pageBody = component.get('#page-body').element;
  // Get the parent element of the PageBody component. We're looking for
  // .nav-tabs that are in the parent, but aren't in PageBody. On many pages,
  // these .nav-tabs will be in PageHead.
  const parent = pageBody.parentNode;
  const headNavs = navs.filter(({ element }) =>
    parent.contains(element) && !pageBody.contains(element));
  for (const tab of headNavs.map(nav => nav.findAll(':scope > li')).flat()) {
    const node = tab.get('a').element.firstChild;
    // Only match on the text node in order to ignore elements like .badge.
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === text)
      return tab;
  }
  // Return a wrapper that does not exist.
  return component.find('div:not(div)');
};
