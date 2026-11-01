// @vitest-environment jsdom
import { describe, expect, it } from 'vite-plus/test';
import { G0G1Command, G2G3Command } from '../commands/command.ts';
import { convertSvgToGCode } from './converter.ts';

function svg(body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

describe('convertSvgToGCode', () => {
  describe('<path>', () => {
    it('converts a path d attribute', () => {
      const cmds = convertSvgToGCode(svg('<path d="M 0 0 L 10 20"/>'));
      expect(cmds.length).toBeGreaterThan(0);
      expect(cmds[0]).toBeInstanceOf(G0G1Command);
    });

    it('returns empty array for a path with no d attribute', () => {
      expect(convertSvgToGCode(svg('<path/>'))).toHaveLength(0);
    });

    it('processes multiple paths in document order', () => {
      const cmds = convertSvgToGCode(svg('<path d="M 0 0 L 5 0"/><path d="M 10 0 L 15 0"/>'));
      expect(cmds.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('<rect>', () => {
    it('converts a plain rectangle to G0G1 commands', () => {
      const cmds = convertSvgToGCode(svg('<rect x="0" y="0" width="100" height="50"/>'));
      expect(cmds.length).toBeGreaterThan(0);
      expect(cmds.every((c) => c instanceof G0G1Command)).toBe(true);
    });

    it('converts a rounded rect — corners produce arcs', () => {
      const cmds = convertSvgToGCode(
        svg('<rect x="0" y="0" width="100" height="50" rx="10" ry="10"/>'),
      );
      expect(cmds.some((c) => c instanceof G2G3Command)).toBe(true);
    });

    it('copies rx to ry when only rx is given', () => {
      const cmds = convertSvgToGCode(svg('<rect x="0" y="0" width="100" height="50" rx="10"/>'));
      expect(cmds.some((c) => c instanceof G2G3Command)).toBe(true);
    });

    it('copies ry to rx when only ry is given', () => {
      const cmds = convertSvgToGCode(svg('<rect x="0" y="0" width="100" height="50" ry="10"/>'));
      expect(cmds.some((c) => c instanceof G2G3Command)).toBe(true);
    });

    it('clamps corner radii to half the smaller dimension', () => {
      // rx=200 on a 100-wide rect should be clamped to 50
      const cmds = convertSvgToGCode(
        svg('<rect x="0" y="0" width="100" height="100" rx="200" ry="200"/>'),
      );
      expect(cmds.length).toBeGreaterThan(0);
    });

    it('ignores rect with zero width', () => {
      expect(convertSvgToGCode(svg('<rect x="0" y="0" width="0" height="50"/>'))).toHaveLength(0);
    });

    it('ignores rect with negative height', () => {
      expect(convertSvgToGCode(svg('<rect x="0" y="0" width="100" height="-1"/>'))).toHaveLength(0);
    });

    it('defaults x, y to 0 when omitted', () => {
      const cmds = convertSvgToGCode(svg('<rect width="10" height="10"/>'));
      const first = cmds[0] as G0G1Command;
      expect(first.x).toBeCloseTo(0);
      expect(first.y).toBeCloseTo(0);
    });
  });

  describe('<circle>', () => {
    it('converts a circle to arc commands', () => {
      const cmds = convertSvgToGCode(svg('<circle cx="50" cy="50" r="30"/>'));
      expect(cmds.some((c) => c instanceof G2G3Command)).toBe(true);
    });

    it('starts at the rightmost point (cx + r)', () => {
      const cmds = convertSvgToGCode(svg('<circle cx="10" cy="20" r="5"/>'));
      const first = cmds[0] as G0G1Command;
      expect(first.x).toBeCloseTo(15);
      expect(first.y).toBeCloseTo(20);
    });

    it('ignores circle with zero radius', () => {
      expect(convertSvgToGCode(svg('<circle cx="0" cy="0" r="0"/>'))).toHaveLength(0);
    });

    it('ignores circle with negative radius', () => {
      expect(convertSvgToGCode(svg('<circle cx="0" cy="0" r="-5"/>'))).toHaveLength(0);
    });
  });

  describe('<ellipse>', () => {
    it('converts an ellipse to arc commands', () => {
      const cmds = convertSvgToGCode(svg('<ellipse cx="50" cy="50" rx="30" ry="20"/>'));
      expect(cmds.length).toBeGreaterThan(0);
    });

    it('ignores ellipse with zero rx', () => {
      expect(convertSvgToGCode(svg('<ellipse cx="0" cy="0" rx="0" ry="10"/>'))).toHaveLength(0);
    });

    it('ignores ellipse with zero ry', () => {
      expect(convertSvgToGCode(svg('<ellipse cx="0" cy="0" rx="10" ry="0"/>'))).toHaveLength(0);
    });
  });

  describe('<line>', () => {
    it('converts a line to a move + lineto', () => {
      const cmds = convertSvgToGCode(svg('<line x1="0" y1="0" x2="10" y2="20"/>'));
      expect(cmds).toHaveLength(2);
      expect((cmds[0] as G0G1Command).rapid).toBe(true);
      expect((cmds[1] as G0G1Command).rapid).toBe(false);
    });

    it('defaults missing coordinates to 0', () => {
      const cmds = convertSvgToGCode(svg('<line x2="5" y2="5"/>'));
      expect((cmds[0] as G0G1Command).x).toBeCloseTo(0);
      expect((cmds[0] as G0G1Command).y).toBeCloseTo(0);
    });
  });

  describe('<polyline>', () => {
    it('converts a polyline to a sequence of moves', () => {
      const cmds = convertSvgToGCode(svg('<polyline points="0,0 10,0 10,10"/>'));
      expect(cmds).toHaveLength(3);
      expect((cmds[0] as G0G1Command).rapid).toBe(true);
      expect((cmds[1] as G0G1Command).rapid).toBe(false);
    });

    it('does not close the path for polyline', () => {
      const cmds = convertSvgToGCode(svg('<polyline points="0,0 10,0 10,10"/>'));
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(10);
      expect(last.y).toBeCloseTo(10);
    });

    it('returns empty for polyline with fewer than 2 points', () => {
      expect(convertSvgToGCode(svg('<polyline points="0,0"/>'))).toHaveLength(0);
    });

    it('returns empty for polyline with no points attribute', () => {
      expect(convertSvgToGCode(svg('<polyline/>'))).toHaveLength(0);
    });
  });

  describe('<polygon>', () => {
    it('converts a polygon and closes the path', () => {
      const cmds = convertSvgToGCode(svg('<polygon points="0,0 10,0 5,10"/>'));
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(0);
      expect(last.y).toBeCloseTo(0);
    });

    it('produces one more command than polyline with the same points', () => {
      const poly = convertSvgToGCode(svg('<polyline points="0,0 10,0 5,10"/>'));
      const gon = convertSvgToGCode(svg('<polygon points="0,0 10,0 5,10"/>'));
      expect(gon.length).toBe(poly.length + 1);
    });
  });

  describe('filtering', () => {
    it('skips elements inside <defs>', () => {
      const cmds = convertSvgToGCode(
        svg('<defs><path d="M 0 0 L 100 100"/></defs><path d="M 0 0 L 10 0"/>'),
      );
      expect(cmds).toHaveLength(2);
    });

    it('skips elements with display="none" attribute', () => {
      const cmds = convertSvgToGCode(
        svg('<path d="M 0 0 L 10 0" display="none"/><path d="M 0 0 L 5 0"/>'),
      );
      expect(cmds).toHaveLength(2);
    });

    it('skips elements with visibility="hidden" attribute', () => {
      const cmds = convertSvgToGCode(
        svg('<path d="M 0 0 L 10 0" visibility="hidden"/><path d="M 0 0 L 5 0"/>'),
      );
      expect(cmds).toHaveLength(2);
    });

    it('skips elements with display:none in inline style', () => {
      const cmds = convertSvgToGCode(
        svg('<path d="M 0 0 L 10 0" style="display:none"/><path d="M 0 0 L 5 0"/>'),
      );
      expect(cmds).toHaveLength(2);
    });

    it('skips elements with visibility:hidden in inline style', () => {
      const cmds = convertSvgToGCode(
        svg('<path d="M 0 0 L 10 0" style="visibility:hidden"/><path d="M 0 0 L 5 0"/>'),
      );
      expect(cmds).toHaveLength(2);
    });

    it('ignores non-shape elements (rect, text, etc. not in selector)', () => {
      const cmds = convertSvgToGCode(svg('<text>hello</text><line x1="0" y1="0" x2="5" y2="5"/>'));
      expect(cmds).toHaveLength(2);
    });

    it('returns empty array for empty SVG', () => {
      expect(convertSvgToGCode(svg(''))).toHaveLength(0);
    });
  });
});
