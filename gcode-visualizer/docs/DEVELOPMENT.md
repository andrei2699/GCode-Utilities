# UI styling reference

The shared theme and component styles live in `src/style.css`. Prefer the existing CSS classes and color variables when building UI so components stay consistent in light and dark themes.

## Theme colors

Use the CSS variables instead of hard-coding colors:

| Variable                                                                                 | Use                                      |
| ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| `--color-canvas`                                                                         | Page background                          |
| `--color-surface`                                                                        | Panels, sidebars, and header             |
| `--color-surface-raised`                                                                 | Inputs and secondary controls            |
| `--color-surface-hover`                                                                  | Hovered surfaces                         |
| `--color-border`, `--color-border-strong`                                                | Dividers and control outlines            |
| `--color-text`, `--color-text-muted`, `--color-text-subtle`                              | Primary, secondary, and quiet text       |
| `--color-accent`, `--color-accent-hover`, `--color-accent-soft`, `--color-accent-border` | Primary actions and selected UI          |
| `--color-accent-text`                                                                    | Text on an accent-filled control         |
| `--color-success`, `--color-warning`, `--color-danger`                                   | Status and feedback colors               |
| `--color-toolpath`, `--color-travel`, `--color-selection`                                | G-code path visualization                |
| `--color-viewport`, `--color-grid-fine`, `--color-grid-strong`                           | Viewport background and grid             |
| `--color-overlay`, `--color-dropzone`                                                    | Viewport overlays and file-drop surfaces |
| `--font-mono`                                                                            | G-code, coordinates, and numeric values  |
| `--radius-sm`, `--radius-md`, `--radius-lg`                                              | Consistent corner radii                  |
| `--shadow-panel`                                                                         | Floating panel shadow                    |

Light mode is the default. The system color preference selects dark mode automatically; to force a theme, set `data-theme` on the root element:

```html
<html data-theme="dark"></html>
```

Use `data-theme="light"` to force light mode, or remove the attribute to follow the system preference.

## Layout classes

| Class                                                                    | Use                                                                              |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `.topbar`                                                                | Application header                                                               |
| `.brand`, `.brand-mark`                                                  | Header identity                                                                  |
| `.topbar-actions`, `.toolbar`, `.button-group`                           | Horizontal groups of actions                                                     |
| `.workspace`                                                             | Main three-column workspace grid                                                 |
| `.sidebar`, `.sidebar-left`, `.sidebar-right`                            | Workspace sidebars; the right sidebar hides below 900px and the left below 620px |
| `.viewport`                                                              | G-code preview surface with a grid                                               |
| `.viewport-toolbar`, `.viewport-toolbar-top`, `.viewport-toolbar-bottom` | Controls overlaid on the viewport                                                |
| `.viewport-overlay`                                                      | Readable translucent viewport control surface                                    |

## Components

| Class                                                            | Use                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| `.panel`, `.panel-header`, `.panel-body`, `.panel-title`         | Reusable bordered panel and its sections                           |
| `.button`                                                        | Standard button or link styled as a button                         |
| `.button-primary`                                                | Primary action; use with `.button`                                 |
| `.button-quiet`                                                  | Low-emphasis action; use with `.button`                            |
| `.button-icon`                                                   | Square icon-only button; use with `.button`                        |
| `.field`, `.select`                                              | Text input and select control                                      |
| `.field-row`, `.field-stack`                                     | Arrange a field with an adjacent control, or stack label and input |
| `.status`                                                        | Neutral status pill                                                |
| `.status-ready`, `.status-warning`, `.status-error`              | Semantic status variants; use with `.status`                       |
| `.divider`                                                       | Horizontal separator                                               |
| `.file-row`, `.list-row`                                         | Interactive file or list item                                      |
| `.file-row-active`                                               | Selected file row; use with `.file-row`                            |
| `.file-name`                                                     | Truncated monospace filename                                       |
| `.metric-row`, `.metric-value`, `.coordinate`                    | Measurements and machine coordinates                               |
| `.layer-control`, `.range`                                       | Layer selection controls                                           |
| `.layer-colors`, `.color-key`, `.color-swatch`                   | Legend for plotted path types                                      |
| `.color-swatch-travel`, `.color-swatch-selection`                | Travel and selected-path legend swatches                           |
| `.dropzone`, `.dropzone-active`                                  | File upload/drop area and its drag-active state                    |
| `.empty-state`, `.empty-state-title`, `.empty-state-description` | No-content placeholder                                             |

## Text utilities

Use `.text-mono` for monospace text and `.text-muted` or `.text-subtle` for reduced emphasis. `.text-accent`, `.text-warning`, and `.text-danger` communicate semantic emphasis. Prefer the status classes for full status indicators.

## Examples

```html
<section class="panel">
  <header class="panel-header">
    <h2 class="panel-title">Print settings</h2>
    <span class="status status-ready">Ready</span>
  </header>
  <div class="panel-body">
    <label class="field-stack">
      <span class="label">Layer height</span>
      <input class="field" value="0.2 mm" />
    </label>
    <button class="button button-primary" type="button">Apply</button>
  </div>
</section>
```

```html
<div class="metric-row">
  <span>Current position</span>
  <span class="coordinate">X 12.40&nbsp; Y 8.00&nbsp; Z 1.20</span>
</div>
```

Add new component styles to `src/style.css`, use the existing variables, and add responsive rules where the component needs to adapt to the workspace breakpoints.
