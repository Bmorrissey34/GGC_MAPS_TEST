/**
 * Mock for Next.js <Image> component
 * This prevents React warnings about unsupported attributes like `priority`
 * when running Jest tests.
 */

import React from 'react';

export default function Image(props) {
  // Destructure Next.js-specific props that shouldn't reach the DOM
  const { priority, placeholder, fill, loader, blurDataURL, quality, ...rest } = props;
  
  // Return a plain <img> element with the remaining props
  return <img {...rest} />;
}
