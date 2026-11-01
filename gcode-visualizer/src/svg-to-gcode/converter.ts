import { parsePathData } from './parser.ts';
import type { GCodeCommand } from '../commands/command.ts';

const domParser = new DOMParser();

export function convertSvgToGCode(svgContent: string): GCodeCommand[] {
  const doc = domParser.parseFromString(svgContent, 'image/svg+xml');
  return extractPathStrings(doc.documentElement).flatMap((d) => parsePathData(d));
}

function extractPathStrings(root: Element): string[] {
  const results: string[] = [];

  for (const el of root.querySelectorAll<SVGElement>(
    'path, rect, circle, ellipse, line, polyline, polygon',
  )) {
    if (el.closest('defs')) {
      continue;
    }

    const style = el.getAttribute('style') ?? '';
    if (
      el.getAttribute('display') === 'none' ||
      el.getAttribute('visibility') === 'hidden' ||
      /\bdisplay\s*:\s*none\b/.test(style) ||
      /\bvisibility\s*:\s*hidden\b/.test(style)
    ) {
      continue;
    }

    const d = elementToPathData(el);
    if (d) results.push(d);
  }

  return results;
}

function elementToPathData(el: Element): string | null {
  switch (el.tagName.toLowerCase()) {
    case 'path':
      return el.getAttribute('d');
    case 'rect':
      return rectToPathData(el);
    case 'circle':
      return circleToPathData(el);
    case 'ellipse':
      return ellipseToPathData(el);
    case 'line':
      return lineToPathData(el);
    case 'polyline':
      return polylineToPathData(el, false);
    case 'polygon':
      return polylineToPathData(el, true);
    default:
      return null;
  }
}

function attr(el: Element, name: string, fallback = 0): number {
  return parseFloat(el.getAttribute(name) ?? String(fallback));
}

function rectToPathData(el: Element): string | null {
  const x = attr(el, 'x');
  const y = attr(el, 'y');
  const w = attr(el, 'width');
  const h = attr(el, 'height');

  if (w <= 0 || h <= 0) return null;

  let rx = attr(el, 'rx', -1);
  let ry = attr(el, 'ry', -1);
  if (rx < 0 && ry < 0) {
    rx = 0;
    ry = 0;
  } else if (rx < 0) rx = ry;
  else if (ry < 0) ry = rx;
  rx = Math.min(rx, w / 2);
  ry = Math.min(ry, h / 2);

  if (rx === 0 || ry === 0) {
    return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
  }

  return [
    `M ${x + rx} ${y}`,
    `H ${x + w - rx}`,
    `A ${rx} ${ry} 0 0 1 ${x + w} ${y + ry}`,
    `V ${y + h - ry}`,
    `A ${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}`,
    `H ${x + rx}`,
    `A ${rx} ${ry} 0 0 1 ${x} ${y + h - ry}`,
    `V ${y + ry}`,
    `A ${rx} ${ry} 0 0 1 ${x + rx} ${y}`,
    `Z`,
  ].join(' ');
}

function circleToPathData(el: Element): string | null {
  const cx = attr(el, 'cx');
  const cy = attr(el, 'cy');
  const r = attr(el, 'r');

  if (r <= 0) {
    return null;
  }

  return [
    `M ${cx + r} ${cy}`,
    `A ${r} ${r} 0 0 1 ${cx - r} ${cy}`,
    `A ${r} ${r} 0 0 1 ${cx + r} ${cy}`,
    `Z`,
  ].join(' ');
}

function ellipseToPathData(el: Element): string | null {
  const cx = attr(el, 'cx');
  const cy = attr(el, 'cy');
  const rx = attr(el, 'rx');
  const ry = attr(el, 'ry');

  if (rx <= 0 || ry <= 0) {
    return null;
  }

  return [
    `M ${cx + rx} ${cy}`,
    `A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy}`,
    `A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`,
    `Z`,
  ].join(' ');
}

function lineToPathData(el: Element): string | null {
  return `M ${attr(el, 'x1')} ${attr(el, 'y1')} L ${attr(el, 'x2')} ${attr(el, 'y2')}`;
}

function polylineToPathData(el: Element, close: boolean): string | null {
  const pointsAttr = el.getAttribute('points');
  if (!pointsAttr) {
    return null;
  }

  const numbers = pointsAttr.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g)?.map(Number);
  if (!numbers || numbers.length < 4) {
    return null;
  }

  const parts = Array.from(
    { length: Math.floor(numbers.length / 2) },
    (_, i) => `${i === 0 ? 'M' : 'L'} ${numbers[i * 2]} ${numbers[i * 2 + 1]}`,
  );
  if (close) {
    parts.push('Z');
  }

  return parts.join(' ');
}
