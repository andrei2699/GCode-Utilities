# GCode Utilities

A browser-based toolset for working with G-code files.

**Live site:** https://andrei2699.github.io/GCode-Utilities

## Tools

**G-code Visualizer** — paste or load a G-code file and see the toolpath rendered on a canvas. Supports G0/G1 linear moves and G2/G3 arcs (I/J offsets and R radius format).

**SVG to G-code** — drop in an SVG and get G-code back. Handles all SVG path commands including Bézier curves (linearized) and elliptical arcs.

## Development

```bash
vp install       # install dependencies
vp dev           # start dev server
vp test --run    # run unit tests
vp check         # lint + type-check
vp build         # production build → gcode-visualizer/dist
```

Requires [Vite+](https://vite.plus) (`vp`) installed globally.
