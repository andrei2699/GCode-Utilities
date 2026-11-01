import { parsePathData } from './parser.ts';
import type { GCodeCommand } from '../commands/command.ts';

const domParser = new DOMParser();

export function convertSvgToGCode(svgContent: string): GCodeCommand[] {
  const svg = domParser.parseFromString(svgContent, 'image/svg+xml');

  const paths = extractPathData(svg as unknown as SVGSVGElement);

  return paths.flatMap((path) => {
    const d = path.getAttribute('d');
    if (d) {
      return parsePathData(d);
    }
    return [];
  });
}

function extractPathData(svg: SVGSVGElement): SVGPathElement[] {
  const paths: SVGPathElement[] = [];
  const pathElements = svg.querySelectorAll('path');

  pathElements.forEach((path) => {
    paths.push(path);
  });

  return paths;
}
