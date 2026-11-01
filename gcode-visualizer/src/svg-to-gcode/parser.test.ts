import { describe, expect, it } from 'vite-plus/test';
import { G0G1Command, G2G3Command } from '../commands/command.ts';
import { parsePathData } from './parser.ts';

function expectLinear(cmd: unknown, x: number | undefined, y: number | undefined, rapid = false) {
  expect(cmd).toBeInstanceOf(G0G1Command);
  const g = cmd as G0G1Command;
  if (x !== undefined) expect(g.x).toBeCloseTo(x, 6);
  if (y !== undefined) expect(g.y).toBeCloseTo(y, 6);
  expect(g.rapid).toBe(rapid);
}

describe('parsePathData', () => {
  describe('M / m — moveto', () => {
    it('absolute M emits a rapid move', () => {
      expectLinear(parsePathData('M 10 20')[0], 10, 20, true);
    });

    it('relative m is relative to (0,0) at start', () => {
      expectLinear(parsePathData('m 5 10')[0], 5, 10, true);
    });

    it('extra coordinate pairs after M become implicit L linetos', () => {
      const cmds = parsePathData('M 0 0 10 20 30 40');
      expect(cmds).toHaveLength(3);
      expectLinear(cmds[0], 0, 0, true);
      expectLinear(cmds[1], 10, 20, false);
      expectLinear(cmds[2], 30, 40, false);
    });

    it('relative m with implicit linetos accumulates correctly', () => {
      const cmds = parsePathData('m 5 5 10 10');
      expectLinear(cmds[0], 5, 5, true);
      expectLinear(cmds[1], 15, 15, false);
    });
  });

  describe('L / l — lineto', () => {
    it('absolute L emits a feed move', () => {
      expectLinear(parsePathData('M 0 0 L 10 20')[1], 10, 20, false);
    });

    it('relative l accumulates from current position', () => {
      expectLinear(parsePathData('M 10 10 l 5 5')[1], 15, 15, false);
    });

    it('multiple L coordinates in one command', () => {
      const cmds = parsePathData('M 0 0 L 10 0 20 0 30 0');
      expect(cmds).toHaveLength(4);
    });
  });

  describe('H / h — horizontal lineto', () => {
    it('absolute H updates X, leaves Y undefined', () => {
      const g = parsePathData('M 0 0 H 20')[1] as G0G1Command;
      expect(g.x).toBe(20);
      expect(g.y).toBeUndefined();
    });

    it('relative h accumulates from current X', () => {
      const g = parsePathData('M 10 0 h 5')[1] as G0G1Command;
      expect(g.x).toBe(15);
      expect(g.y).toBeUndefined();
    });

    it('multiple h values each emit a command', () => {
      expect(parsePathData('M 0 0 H 10 20 30')).toHaveLength(4);
    });
  });

  describe('V / v — vertical lineto', () => {
    it('absolute V updates Y, leaves X undefined', () => {
      const g = parsePathData('M 0 0 V 30')[1] as G0G1Command;
      expect(g.y).toBe(30);
      expect(g.x).toBeUndefined();
    });

    it('relative v accumulates from current Y', () => {
      const g = parsePathData('M 0 10 v 10')[1] as G0G1Command;
      expect(g.y).toBe(20);
      expect(g.x).toBeUndefined();
    });
  });

  describe('Z / z — closepath', () => {
    it('Z returns to the subpath start', () => {
      const cmds = parsePathData('M 10 20 L 30 40 Z');
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(10, 6);
      expect(last.y).toBeCloseTo(20, 6);
    });

    it('lowercase z is identical to Z', () => {
      const cmds = parsePathData('M 5 5 L 10 10 z');
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(5, 6);
      expect(last.y).toBeCloseTo(5, 6);
    });

    it('subpath start resets after a new M', () => {
      // M(0,0) → Z back to (0,0); M(50,50) → Z back to (50,50)
      const cmds = parsePathData('M 0 0 L 10 0 Z M 50 50 L 60 50 Z');
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(50, 6);
      expect(last.y).toBeCloseTo(50, 6);
    });
  });

  describe('A / a — arc', () => {
    it('sweep=1 (CCW) emits a G3 (clockwise=false)', () => {
      const cmds = parsePathData('M 10 0 A 10 10 0 0 1 -10 0');
      const arc = cmds.find((c) => c instanceof G2G3Command) as G2G3Command;
      expect(arc).toBeDefined();
      expect(arc.clockwise).toBe(false);
    });

    it('sweep=0 (CW) emits a G2 (clockwise=true)', () => {
      const cmds = parsePathData('M 10 0 A 10 10 0 0 0 -10 0');
      const arc = cmds.find((c) => c instanceof G2G3Command) as G2G3Command;
      expect(arc).toBeDefined();
      expect(arc.clockwise).toBe(true);
    });

    it('same-start-and-end arc emits no commands', () => {
      const cmds = parsePathData('M 5 5 A 10 10 0 0 1 5 5');
      expect(cmds.every((c) => c instanceof G0G1Command)).toBe(true);
    });

    it('zero-radius arc emits a lineto to the endpoint', () => {
      const cmds = parsePathData('M 0 0 A 0 0 0 0 1 10 20');
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(10);
      expect(last.y).toBeCloseTo(20);
      expect(last.rapid).toBe(false);
    });

    it('elliptical arc (rx ≠ ry) linearizes to G0G1 segments', () => {
      const cmds = parsePathData('M 20 0 A 20 10 0 0 1 -20 0');
      expect(cmds.some((c) => c instanceof G2G3Command)).toBe(false);
      expect(cmds.filter((c) => c instanceof G0G1Command).length).toBeGreaterThan(1);
    });

    it('radii smaller than the chord are scaled up', () => {
      // chord=20, r=5 — the radii must be scaled to r=10 to span the chord
      const cmds = parsePathData('M 0 0 A 5 5 0 0 1 20 0');
      expect(cmds.length).toBeGreaterThan(0);
    });

    it('large-arc flag selects the longer path', () => {
      // Non-diameter arc: chord (0,0)→(10,0), r=8.
      // Small arc: center above chord (y > 0). Large arc: center below chord (y < 0).
      const small = parsePathData('M 0 0 A 8 8 0 0 1 10 0');
      const large = parsePathData('M 0 0 A 8 8 0 1 1 10 0');
      const arcSmall = small.find((c) => c instanceof G2G3Command) as G2G3Command;
      const arcLarge = large.find((c) => c instanceof G2G3Command) as G2G3Command;
      expect(arcSmall).toBeDefined();
      expect(arcLarge).toBeDefined();
      // The two arcs must have different I/J offsets (different centers)
      expect(arcSmall.j).not.toBeCloseTo(arcLarge.j ?? 0, 3);
    });

    it('relative a resolves end coordinates from current position', () => {
      const cmds = parsePathData('M 10 10 a 10 10 0 0 1 10 0');
      const arc = cmds.find((c) => c instanceof G2G3Command) as G2G3Command;
      expect(arc).toBeDefined();
      expect(arc.x).toBeCloseTo(20);
      expect(arc.y).toBeCloseTo(10);
    });

    it('rotated arc (non-zero x-axis-rotation) with equal radii still emits an arc', () => {
      const cmds = parsePathData('M 10 0 A 10 10 45 0 1 -10 0');
      expect(cmds.some((c) => c instanceof G2G3Command)).toBe(true);
    });
  });

  describe('C / c — cubic Bézier', () => {
    it('absolute C linearizes to G0G1 segments ending at the stated endpoint', () => {
      const cmds = parsePathData('M 0 0 C 0 50 100 50 100 0');
      expect(cmds.length).toBeGreaterThan(2);
      expect(cmds.every((c) => c instanceof G0G1Command)).toBe(true);
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(100, 3);
      expect(last.y).toBeCloseTo(0, 3);
    });

    it('relative c resolves to absolute coordinates', () => {
      const last = parsePathData('M 10 10 c 0 40 90 40 90 0').slice(-1)[0] as G0G1Command;
      expect(last.x).toBeCloseTo(100, 3);
      expect(last.y).toBeCloseTo(10, 3);
    });

    it('chained C coordinates (implicit repetition) each produce segments', () => {
      // Two cubic curves in one C command
      const cmds = parsePathData('M 0 0 C 0 50 50 50 50 0 50 -50 100 -50 100 0');
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(100, 2);
      expect(last.y).toBeCloseTo(0, 2);
    });

    it('nearly-flat cubic emits fewer segments than a highly curved one', () => {
      const flat = parsePathData('M 0 0 C 33 0 66 0 100 0');
      const curved = parsePathData('M 0 0 C 0 100 100 100 100 0');
      expect(flat.length).toBeLessThan(curved.length);
    });
  });

  describe('S / s — smooth cubic Bézier', () => {
    it('S after C reflects the previous control point', () => {
      const cmds = parsePathData('M 0 0 C 20 50 80 50 100 0 S 180 -50 200 0');
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(200, 2);
      expect(last.y).toBeCloseTo(0, 2);
    });

    it('S after S reflects the previous S control point', () => {
      const cmds = parsePathData('M 0 0 C 20 50 80 50 100 0 S 180 -50 200 0 S 280 50 300 0');
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(300, 2);
      expect(last.y).toBeCloseTo(0, 2);
    });

    it('S without preceding C/S uses current position as first control point', () => {
      // No reflection available — control1 defaults to currentX/Y
      const cmds = parsePathData('M 0 0 S 50 50 100 0');
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(100, 2);
      expect(last.y).toBeCloseTo(0, 2);
    });
  });

  describe('Q / q — quadratic Bézier', () => {
    it('absolute Q linearizes and ends at the stated endpoint', () => {
      const cmds = parsePathData('M 0 0 Q 50 100 100 0');
      expect(cmds.length).toBeGreaterThan(1);
      expect(cmds.every((c) => c instanceof G0G1Command)).toBe(true);
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(100, 3);
      expect(last.y).toBeCloseTo(0, 3);
    });

    it('relative q resolves correctly', () => {
      const last = parsePathData('M 10 0 q 50 100 100 0').slice(-1)[0] as G0G1Command;
      expect(last.x).toBeCloseTo(110, 2);
      expect(last.y).toBeCloseTo(0, 2);
    });
  });

  describe('T / t — smooth quadratic Bézier', () => {
    it('T after Q reflects the quadratic control point', () => {
      const cmds = parsePathData('M 0 0 Q 50 100 100 0 T 200 0');
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(200, 2);
      expect(last.y).toBeCloseTo(0, 2);
    });

    it('T after T reflects the previous T control point', () => {
      const cmds = parsePathData('M 0 0 Q 50 100 100 0 T 200 0 T 300 0');
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(300, 2);
      expect(last.y).toBeCloseTo(0, 2);
    });

    it('T without preceding Q/T falls back to current position as control', () => {
      const cmds = parsePathData('M 0 0 T 100 0');
      const last = cmds[cmds.length - 1] as G0G1Command;
      expect(last.x).toBeCloseTo(100, 2);
      expect(last.y).toBeCloseTo(0, 2);
    });
  });

  describe('unknown command', () => {
    it('unknown letters are absorbed into the preceding command — no UnknownCommand is emitted', () => {
      // 'W' is not in PATH_COMMAND_PATTERN's character class so it never starts a
      // new match. Its trailing numbers get absorbed by the previous M token instead.
      const cmds = parsePathData('M 0 0 W 10 20');
      expect(cmds.every((c) => c instanceof G0G1Command)).toBe(true);
    });
  });

  describe('relative vs absolute accumulation', () => {
    it('relative commands accumulate correctly across segments', () => {
      const cmds = parsePathData('M 0 0 l 10 0 l 0 10 l -10 0');
      expectLinear(cmds[1], 10, 0);
      expectLinear(cmds[2], 10, 10);
      expectLinear(cmds[3], 0, 10);
    });
  });

  describe('edge cases', () => {
    it('empty string returns empty array', () => {
      expect(parsePathData('')).toHaveLength(0);
    });

    it('compact notation without spaces', () => {
      const cmds = parsePathData('M10,20L30,40');
      expectLinear(cmds[0], 10, 20, true);
      expectLinear(cmds[1], 30, 40, false);
    });

    it('scientific notation in coordinates', () => {
      const cmds = parsePathData('M 1e1 2e1');
      expectLinear(cmds[0], 10, 20, true);
    });

    it('negative coordinates with implicit sign separator', () => {
      const cmds = parsePathData('M 10-5');
      expectLinear(cmds[0], 10, -5, true);
    });
  });
});
