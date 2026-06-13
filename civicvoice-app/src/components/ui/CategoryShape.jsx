// ============================================================
// CategoryShape — renders the iconic category shape
// ============================================================
// The design uses CSS clip-path shapes as a "signage system":
//   Road       = diamond  (red)
//   Water      = circle   (ink/dark)
//   Garbage    = triangle (green)
//   Streetlight = octagon (amber)
//
// Props:
//   category  - 'road' | 'water' | 'garbage' | 'light'
//   size      - pixel size (default 12)
// ============================================================

// Maps category names to their CSS class (defined in index.css)
const SHAPE_CLASSES = {
  road:    'shape shape-road',
  water:   'shape shape-water',
  garbage: 'shape shape-garbage',
  light:   'shape shape-light',
}

export default function CategoryShape({ category = 'road', size = 12 }) {
  const cls = SHAPE_CLASSES[category?.toLowerCase()] ?? SHAPE_CLASSES.road

  return (
    <span
      className={cls}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}
