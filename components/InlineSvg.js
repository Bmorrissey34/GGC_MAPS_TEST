'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// Sanitize the SVG content to remove potentially harmful scripts and attributes
function sanitize(t) {
  return t
    .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove script tags
    .replace(/\son\w+="[^"]*"/gi, '') // Remove inline event handlers (double quotes)
    .replace(/\son\w+='[^']*'/gi, '') // Remove inline event handlers (single quotes)
    .replace(/\s(xlink:)?href=["']\s*javascript:[^"']*["']/gi, ' '); // Remove JavaScript hrefs
}

// Infer the type of an SVG element based on its class
function inferKind(el) {
  const cls = (el.className && el.className.baseVal) || el.getAttribute('class') || '';
  const c = cls.toLowerCase();
  if (c.includes('room')) return 'room';
  if (c.includes('building')) return 'building';
  if (c.includes('parking')) return 'parking';
  if (c.includes('poi') || c.includes('store') || c.includes('dining')) return 'poi';
  return 'poi';
}

const STUDENT_HOUSING_MESSAGE = 'Student Housing: No Floor Plan Availability';
const STUDENT_HOUSING_CLASS = 'student-housing';
const POINTER_SOURCE = 'pointer:student';

// InlineSvg component renders an SVG file and adds interactivity
export default function InlineSvg({
  src, // Path to the SVG file
  className = '', // Additional CSS classes for styling
  interactiveSelector = '.building-group, .building, .room-group', // Selector for interactive elements
  selectedId = null, // ID of the currently selected element
  onSelect, // Callback for when an element is selected
  onReady, // Callback for when the SVG is ready
}) {
  const containerRef = useRef(null); // Outer wrapper for the SVG and overlays
  const svgContainerRef = useRef(null); // Holds the injected SVG markup
  const [markup, setMarkup] = useState(null); // State to store the sanitized SVG markup
  const [error, setError] = useState(null); // State to store any loading errors
  const prev = useRef(null); // Reference to the previously selected element
  const hoverRefs = useRef(new Map()); // Track hover highlight nodes by source
  const pointerTargetRef = useRef(null); // Track the current student housing node under the pointer
  const [tooltipState, setTooltipState] = useState({
    visible: false,
    top: 0,
    left: 0,
  });

  const showTooltip = useCallback((node) => {
    const container = containerRef.current;
    if (!container || !node || typeof node.getBoundingClientRect !== 'function') return;

    const containerRect = container.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();

    if (!containerRect || !nodeRect || (nodeRect.width === 0 && nodeRect.height === 0)) return;

    const top = nodeRect.top - containerRect.top;
    const left = nodeRect.left - containerRect.left + nodeRect.width / 2;

    setTooltipState({
      visible: true,
      top,
      left,
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipState((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  const updateTooltipFromRefs = useCallback(() => {
    const pointerNodes = hoverRefs.current.get(POINTER_SOURCE);
    const pointerTarget = pointerNodes?.find(
      (node) => node && node.classList && node.classList.contains(STUDENT_HOUSING_CLASS)
    );
    if (pointerTarget) {
      showTooltip(pointerTarget);
      return;
    }

    let studentNode = null;
    hoverRefs.current.forEach((nodes, source) => {
      if (source === POINTER_SOURCE || studentNode) return;
      studentNode = nodes?.find(
        (node) => node && node.classList && node.classList.contains(STUDENT_HOUSING_CLASS)
      );
    });

    if (studentNode) {
      showTooltip(studentNode);
    } else {
      hideTooltip();
    }
  }, [hideTooltip, showTooltip]);


  // Fetch and sanitize the SVG content when the source changes
  useEffect(() => {
    let alive = true; // Flag to track component lifecycle
    setMarkup(null); // Reset markup state
    setError(null); // Reset error state
    fetch(src, { cache: 'no-store' }) // Fetch the SVG file
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); }) // Check response status
      .then(t => { if (alive) setMarkup(sanitize(t)); }) // Set sanitized markup
      .catch(err => { if (alive) setError(err.message); }); // Handle errors
    return () => { alive = false; }; // Cleanup function
  }, [src]);

  // Add interactivity and accessibility to the SVG elements
  useEffect(() => {
    if (!markup || !svgContainerRef.current) return; // Ensure markup and ref are available
    const root = svgContainerRef.current; // Reference to the SVG root element

    const resolveInteractiveElement = (start) => {
      if (!(start instanceof Element)) return null;
      if (start.id) {
        return start;
      }
      const withId = start.closest('[id]');
      if (!withId || !root.contains(withId)) {
        return null;
      }
      if (withId.matches(interactiveSelector)) {
        return withId;
      }
      const interactiveAncestor = withId.closest(interactiveSelector);
      if (interactiveAncestor && root.contains(interactiveAncestor) && interactiveAncestor.id) {
        return interactiveAncestor;
      }
      return withId.id ? withId : null;
    };

    const interactiveNodes = new Set();
    root.querySelectorAll(interactiveSelector).forEach((node) => {
      const resolved = resolveInteractiveElement(node);
      if (resolved) {
        interactiveNodes.add(resolved);
      }
    });
    root.querySelectorAll('.student-housing[id]').forEach((node) => interactiveNodes.add(node));

    interactiveNodes.forEach((el) => {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0'); // Make elements focusable
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button'); // Add a button role
      if (!el.hasAttribute('aria-label')) {
        const t = el.querySelector('text'); // Get text content for aria-label
        el.setAttribute('aria-label', (t && t.textContent.trim()) || el.id || 'map element'); // Set aria-label
      }
    });

    const dispatchSelection = (target, { normalize = true, forceHousing = false } = {}) => {
      if (!target) return;
      const id = target.id ? (normalize ? target.id.toLowerCase() : target.id) : null;
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[InlineSvg] dispatchSelection', { id, target });
      }
      onSelect?.(id, target); // Call onSelect callback
      if (forceHousing || target.classList?.contains(STUDENT_HOUSING_CLASS)) {
        window.dispatchEvent(
          new CustomEvent('ggcmap-student-housing-click', {
            detail: { id: target.id || null },
          })
        );
      }
    };

    const resolveCandidate = (start) => {
      if (!start) return null;
      let candidate = start.closest(interactiveSelector);
      if (!candidate) {
        candidate = start.closest('.student-housing[id], [id]');
      }
      return resolveInteractiveElement(candidate);
    };

    // Handle click events on interactive elements
    const click = (e) => {
      const target = resolveCandidate(e.target);
      if (!target) return;
      dispatchSelection(target);
    };

    // Handle keyboard events for accessibility
    const key = (e) => {
      const candidate = e.target.closest(interactiveSelector);
      if (!candidate) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const target = resolveCandidate(candidate);
        if (!target) return;
        dispatchSelection(target, { normalize: false });
      }
    };

    const pointerUpCapture = (e) => {
      const target = resolveCandidate(e.target);
      if (!target || !target.classList?.contains(STUDENT_HOUSING_CLASS)) return;
      dispatchSelection(target, { forceHousing: true });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('ggcmap-zoom-cancel'));
      }
      const viewport = containerRef.current
        ? containerRef.current.closest('.map-viewport')
        : null;
      if (viewport && typeof viewport.releasePointerCapture === 'function') {
        try {
          if (typeof viewport.hasPointerCapture !== 'function' || viewport.hasPointerCapture(e.pointerId)) {
            viewport.releasePointerCapture(e.pointerId);
          }
        } catch {
          // ignore failures; this is best-effort
        }
      }
    };

    const pointerOver = (e) => {
      const hovered = e.target.closest(`.${STUDENT_HOUSING_CLASS}`);
      if (!hovered || !root.contains(hovered)) return;
      const base = hovered.closest('.building-group') || hovered;
      if (pointerTargetRef.current === base) return;
      pointerTargetRef.current = base;
      hoverRefs.current.set(POINTER_SOURCE, [base]);
      updateTooltipFromRefs();
    };

    const pointerOut = (e) => {
      const hovered = e.target.closest(`.${STUDENT_HOUSING_CLASS}`);
      if (!hovered || !root.contains(hovered)) return;
      const currentBase = hovered.closest('.building-group') || hovered;
      const related = e.relatedTarget;
      if (related && currentBase.contains(related)) return;
      if (pointerTargetRef.current === currentBase) {
        pointerTargetRef.current = null;
      }
      hoverRefs.current.delete(POINTER_SOURCE);
      updateTooltipFromRefs();
    };

    const pointerMove = (e) => {
      const hovered = e.target.closest(`.${STUDENT_HOUSING_CLASS}`);
      if (hovered && root.contains(hovered)) return;
      if (hoverRefs.current.has(POINTER_SOURCE)) {
        pointerTargetRef.current = null;
        hoverRefs.current.delete(POINTER_SOURCE);
        updateTooltipFromRefs();
      }
    };

    root.addEventListener('click', click); // Add click event listener
    root.addEventListener('keydown', key); // Add keydown event listener
    root.addEventListener('pointerup', pointerUpCapture, true);
    root.addEventListener('pointerover', pointerOver);
    root.addEventListener('pointerout', pointerOut);
    root.addEventListener('pointermove', pointerMove);

    // Report the IDs of interactive elements to the parent component
    if (onReady) {
      const items = Array.from(interactiveNodes)
        .filter(el => el.id && String(el.id).trim().length > 0) // Filter elements with valid IDs
        .map(el => {
          const label = el.querySelector('text')?.textContent?.trim() || ''; // Get label text
          return {
            id: el.id, // Element ID
            kind: inferKind(el), // Inferred type of the element
            name: label, // Label text (if available)
            svg: src, // Source of the SVG
          };
        });
      onReady(items); // Call onReady callback with items
    }

    return () => {
      root.removeEventListener('click', click); // Cleanup click event listener
      root.removeEventListener('keydown', key); // Cleanup keydown event listener
      root.removeEventListener('pointerup', pointerUpCapture, true);
      root.removeEventListener('pointerover', pointerOver);
      root.removeEventListener('pointerout', pointerOut);
      root.removeEventListener('pointermove', pointerMove);
      hoverRefs.current.delete(POINTER_SOURCE);
      pointerTargetRef.current = null;
      updateTooltipFromRefs();
    };
  }, [markup, interactiveSelector, onSelect, onReady, src, updateTooltipFromRefs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const escapeSelector = (value) => {
      if (value === null || value === undefined) return '';
      if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
        return CSS.escape(value);
      }
      return String(value).replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`);
    };

    const collectTargets = ({ selector, ids }) => {
      const rootEl = svgContainerRef.current;
      if (!rootEl) return [];
      const collected = new Set();
      if (selector) {
        rootEl.querySelectorAll(selector).forEach((el) => {
          collected.add(el.closest('.building-group') || el);
        });
      }
      if (Array.isArray(ids)) {
        ids.forEach((id) => {
          if (!id) return;
          const escaped = escapeSelector(id);
          if (!escaped) return;
          const found = rootEl.querySelector(`#${escaped}`);
          if (found) {
            collected.add(found.closest('.building-group') || found);
          }
        });
      }
      return Array.from(collected).filter(Boolean);
    };

    const removeHighlight = (nodes) => {
      nodes?.forEach((node) => node.classList.remove('hover-highlight'));
    };

    const clearSource = (source) => {
      const nodes = hoverRefs.current.get(source);
      if (nodes) {
        removeHighlight(nodes);
        hoverRefs.current.delete(source);
      }
    };

    const clearAll = () => {
      hoverRefs.current.forEach(removeHighlight);
      hoverRefs.current.clear();
      updateTooltipFromRefs();
    };

    const handleHover = (event) => {
      const detail = event.detail || {};
      const { source } = detail;
      if (!source) return;
      clearSource(source);
      const targets = collectTargets(detail);
      if (targets.length) {
        targets.forEach((node) => node.classList.add('hover-highlight'));
        hoverRefs.current.set(source, targets);
      }
      updateTooltipFromRefs();
    };

    const handleHoverClear = (event) => {
      const detail = event.detail || {};
      const { source } = detail;
      if (source) {
        clearSource(source);
      } else {
        clearAll();
        return;
      }
      updateTooltipFromRefs();
    };

    window.addEventListener('ggcmap-hover', handleHover);
    window.addEventListener('ggcmap-hover-clear', handleHoverClear);

    return () => {
      window.removeEventListener('ggcmap-hover', handleHover);
      window.removeEventListener('ggcmap-hover-clear', handleHoverClear);
      clearAll();
    };
  }, [updateTooltipFromRefs]);

  useEffect(() => {
    hoverRefs.current.forEach((nodes) => nodes.forEach((node) => node.classList.remove('hover-highlight')));
    hoverRefs.current.clear();
    updateTooltipFromRefs();
  }, [markup, updateTooltipFromRefs]);

  useEffect(() => {
    const root = svgContainerRef.current;
    if (!root) return;

    const clearPointerTooltip = () => {
      if (hoverRefs.current.has(POINTER_SOURCE)) {
        hoverRefs.current.delete(POINTER_SOURCE);
      }
      pointerTargetRef.current = null;
      updateTooltipFromRefs();
    };

    root.addEventListener('pointerleave', clearPointerTooltip);
    root.addEventListener('pointercancel', clearPointerTooltip);

    return () => {
      root.removeEventListener('pointerleave', clearPointerTooltip);
      root.removeEventListener('pointercancel', clearPointerTooltip);
    };
  }, [updateTooltipFromRefs]);

  // Highlight the selected element and remove highlighting from the previous one
  useEffect(() => {
    const root = svgContainerRef.current; // Reference to the SVG root element
    if (!root) return; // Exit if root is not available
    if (prev.current) {
      const p = root.querySelector(`#${CSS.escape(prev.current)}`); // Find previous element
      if (p) { 
        p.classList.remove('active-room'); // Remove active class
        p.setAttribute('aria-selected','false'); // Update aria-selected attribute
      }
    }
    if (selectedId) {
      const el = root.querySelector(`#${CSS.escape(selectedId)}`); // Find currently selected element
      if (el) { 
        el.classList.add('active-room'); // Add active class
        el.setAttribute('aria-selected','true'); // Update aria-selected attribute
      }
      prev.current = selectedId; // Update previous ID
    } else {
      prev.current = null; // Reset previous ID
    }
  }, [selectedId]);

  // Error handling: log the error and display a fallback UI
  if (error) {
    console.error('Error loading SVG:', error); // Log error
    return <div className="svg-error">Error loading SVG: {error}</div>; // Display error message
  }

  return (
    <div
      ref={containerRef} // Reference to the outer wrapper
      className={`inline-svg ${className}`} // Apply class names
      style={{ isolation: 'isolate', position: 'relative' }} // Contain the shadow DOM and anchor overlays
    >
      <div
        ref={svgContainerRef} // Reference to the SVG container
        className="inline-svg__content"
        dangerouslySetInnerHTML={{ __html: markup || '' }} // Set inner HTML to sanitized markup
      />
      <div
        className={`map-tooltip student-housing-tooltip${tooltipState.visible ? ' is-visible' : ''}`}
        style={{
          top: tooltipState.top,
          left: tooltipState.left,
        }}
        role="status"
        aria-live="polite"
        aria-hidden={tooltipState.visible ? 'false' : 'true'}
      >
        {STUDENT_HOUSING_MESSAGE}
      </div>
    </div>
  );
}
