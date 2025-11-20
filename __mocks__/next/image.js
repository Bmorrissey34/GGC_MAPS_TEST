const React = require('react');

module.exports = {
  __esModule: true,
  default: (props) => {
    // Strip Next.js-only props like "priority" to avoid React warnings
    const { priority, ...rest } = props;
    return React.createElement('img', {
      ...rest,
      alt: rest.alt ?? '',
    });
  },
};
