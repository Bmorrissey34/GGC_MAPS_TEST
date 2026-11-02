'use client';
import { useEffect, useRef, useState } from 'react';
import { sanitizeSvgMarkup, escapeSelectorId } from '../lib/svgUtils';
import { useElementSelection } from '../hooks/useElementSelection';
import { assetPath } from '../lib/constants';

export default function InlineSvg({
  src,
  className = '',
  interactiveSelector = '.building-group, .building, .room-group',
  selectedId = null,
  onSelect,
  onReady,
}) {
  const ref = useRef(null);
  const [markup, setMarkup] = useState(null);
  const [error, setError] = useState(null);
  const [, setInternalSelectedId] = useElementSelection(ref.current, markup);
  const hoverRefs = useRef(new Map()); // Track hover highlight nodes by source

  // Sync external selectedId prop with internal state
  useEffect(() => {
    setInternalSelectedId(selectedId);
  }, [selectedId, setInternalSelectedId]);

  // Fetch and sanitize the SVG content when the source changes
  useEffect(() => {
    let alive = true;
    setMarkup(null);
    setError(null);

    fetch(assetPath(src), { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then(text => {
        if (alive) setMarkup(sanitizeSvgMarkup(text));
      })
      .catch(err => {
        if (alive) setError(err.message);
      });

    // Ignore responses from an old source or an unmounted component.
    return () => { alive = false; };
  }, [src]);

  // Add interactivity and accessibility to the SVG elements
  useEffect(() => {
    if (!markup || !ref.current) return;
    const root = ref.current;

    // Shapes may inherit their identifier from a surrounding building or room group.
    const selectElement = (element) => {
      const group = element.closest('.building-group') || element.closest('.room-group') || element;
      const id = group.id || element.id;
      onSelect?.(id ? id.toLowerCase() : null, element);
    };

    const click = (e) => {
      const element = e.target.closest(interactiveSelector);
      if (element) selectElement(element);
    };

    const key = (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const element = e.target.closest(interactiveSelector);
      if (!element) return;
      e.preventDefault();
      selectElement(element);
    };

    // Enhance accessibility by adding attributes to interactive elements
    root.querySelectorAll(interactiveSelector).forEach(el => {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
      if (!el.hasAttribute('aria-label')) {
        const label = el.querySelector('text')?.textContent.trim();
        el.setAttribute('aria-label', label || el.id || 'map element');
      }
    });

    root.addEventListener('click', click);
    root.addEventListener('keydown', key);

    onReady?.();

    return () => {
      root.removeEventListener('click', click);
      root.removeEventListener('keydown', key);
    };
  }, [markup, interactiveSelector, onSelect, onReady]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const clearSource = (source) => {
      const nodes = hoverRefs.current.get(source);
      if (nodes) {
        nodes.forEach((node) => node.classList.remove('hover-highlight'));
        hoverRefs.current.delete(source);
      }
    };

    const clearAll = () => {
      hoverRefs.current.forEach((nodes) => nodes.forEach((node) => node.classList.remove('hover-highlight')));
      hoverRefs.current.clear();
    };

    const collectTargets = ({ selector, ids }) => {
      const rootEl = ref.current;
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
          const escaped = escapeSelectorId(id);
          if (!escaped) return;
          const found = rootEl.querySelector(`#${escaped}`);
          if (found) {
            collected.add(found.closest('.building-group') || found);
          }
        });
      }
      return Array.from(collected).filter(Boolean);
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
    };

    const handleHoverClear = (event) => {
      const detail = event.detail || {};
      const { source } = detail;
      if (source) {
        clearSource(source);
      } else {
        clearAll();
      }
    };

    window.addEventListener('ggcmap-hover', handleHover);
    window.addEventListener('ggcmap-hover-clear', handleHoverClear);

    return () => {
      window.removeEventListener('ggcmap-hover', handleHover);
      window.removeEventListener('ggcmap-hover-clear', handleHoverClear);
      clearAll();
    };
  }, []);

  useEffect(() => {
    hoverRefs.current.forEach((nodes) => nodes.forEach((node) => node.classList.remove('hover-highlight')));
    hoverRefs.current.clear();
  }, [markup]);

  if (error) {
    console.error('Error loading SVG:', error);
    return <div className="svg-error">Error loading SVG: {error}</div>;
  }

  return (
    <div
      ref={ref}
      className={`inline-svg ${className}`}
      dangerouslySetInnerHTML={{ __html: markup }}
      style={{ isolation: 'isolate' }}
    />
  );
}
