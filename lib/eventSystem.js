/**
 * Event System - Centralized custom event dispatching
 * Handles hover events, selection events, and other component communication
 */

/**
 * Dispatches a custom event on the window object
 * Used for component-to-component communication without prop drilling
 * @param {string} type - The event type (e.g., 'ggcmap-hover', 'ggcmap-hover-clear')
 * @param {string} source - The source identifier (e.g., 'sidebar:building-a', 'legend:parking')
 * @param {Object} detail - Additional detail payload to attach to the event
 */
export const dispatchHoverEvent = (type, source, detail) => {
  if (typeof window === 'undefined') return;
  const eventDetail = { source, ...(detail ?? {}) };
  window.dispatchEvent(new CustomEvent(type, { detail: eventDetail }));
};

/**
 * Creates hover event handlers (mouseEnter, mouseLeave, focus, blur)
 * Standardizes hover behavior across components
 * @param {string} source - The source identifier for these handlers
 * @param {Object} detail - The detail payload (selector or ids) for the hover event
 * @returns {Object} An object with onMouseEnter, onMouseLeave, onFocus, onBlur handlers
 */
export const createHoverHandlers = (source, detail) => ({
  onMouseEnter: () => detail && dispatchHoverEvent('ggcmap-hover', source, detail),
  onMouseLeave: () => dispatchHoverEvent('ggcmap-hover-clear', source),
  onFocus: () => detail && dispatchHoverEvent('ggcmap-hover', source, detail),
  onBlur: () => dispatchHoverEvent('ggcmap-hover-clear', source),
});

/**
 * Clears a specific hover source or all hover sources
 * @param {string} source - The source identifier to clear (optional)
 */
export const clearHoverEvents = (source) => {
  if (typeof window === 'undefined') return;
  if (source) {
    dispatchHoverEvent('ggcmap-hover-clear', source);
  } else {
    window.dispatchEvent(new CustomEvent('ggcmap-hover-clear', { detail: {} }));
  }
};
