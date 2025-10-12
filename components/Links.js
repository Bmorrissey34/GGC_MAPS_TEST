const LINKS = [
  {
    id: 'tour',
    href: 'https://www.ggc.edu/about-ggc/maps-and-directions',
    label: 'Virtual Tour',
  },
  {
    id: 'homepage',
    href: 'https://www.ggc.edu/',
    label: "GGC's Website",
  },
  {
    id: 'original-map',
    href: 'http://ggcmaps.com/#Campus',
    label: "GGC's Original Map",
  },
];

export default function Links() {
  return (
    <div className="link-panel-body">
      {LINKS.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="link-panel-button"
        >
          <span className="link-panel-button-secondary">For {link.label}</span>
          <span className="link-panel-button-primary">Click here</span>
        </a>
      ))}
    </div>
  );
}
