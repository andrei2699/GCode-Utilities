import { describe, expect, it } from 'vite-plus/test';
import { G0G1Command, G2G3Command } from '../commands/command.ts';
import { parsePathData } from './parser.ts';

function expectLinear(
  cmd: unknown,
  x: number | undefined,
  y: number | undefined,
  rapid = false,
): void {
  expect(cmd).toBeInstanceOf(G0G1Command);
  const g = cmd as G0G1Command;
  if (x !== undefined) expect(g.x).toBeCloseTo(x, 6);
  if (y !== undefined) expect(g.y).toBeCloseTo(y, 6);
  expect(g.rapid).toBe(rapid);
}

describe('parsePathData', () => {
  it('M (absolute moveto) emits a rapid G0', () => {
    const [cmd] = parsePathData('M 10 20');
    expectLinear(cmd, 10, 20, true);
  });

  it('m (relative moveto) is relative to current position (starts at 0,0)', () => {
    const [cmd] = parsePathData('m 5 10');
    expectLinear(cmd, 5, 10, true);
  });

  it('M with implicit lineto points after the first', () => {
    // "M 0 0 10 20 30 40" = move to (0,0), lineto (10,20), lineto (30,40)
    const cmds = parsePathData('M 0 0 10 20 30 40');
    expect(cmds).toHaveLength(3);
    expectLinear(cmds[0], 0, 0, true);
    expectLinear(cmds[1], 10, 20, false);
    expectLinear(cmds[2], 30, 40, false);
  });

  it('L (absolute lineto) emits a feed G1', () => {
    const cmds = parsePathData('M 0 0 L 10 20');
    expectLinear(cmds[1], 10, 20, false);
  });

  it('l (relative lineto) resolves coordinates relative to current position', () => {
    const cmds = parsePathData('M 10 10 l 5 5');
    expectLinear(cmds[1], 15, 15, false);
  });

  it('H (absolute horizontal) updates X only', () => {
    const cmds = parsePathData('M 0 0 H 20');
    const g = cmds[1] as G0G1Command;
    expect(g.x).toBe(20);
    expect(g.y).toBeUndefined();
  });

  it('h (relative horizontal) is relative to current X', () => {
    const cmds = parsePathData('M 10 0 h 5');
    const g = cmds[1] as G0G1Command;
    expect(g.x).toBe(15);
    expect(g.y).toBeUndefined();
  });

  it('V (absolute vertical) updates Y only', () => {
    const cmds = parsePathData('M 0 0 V 30');
    const g = cmds[1] as G0G1Command;
    expect(g.y).toBe(30);
    expect(g.x).toBeUndefined();
  });

  it('v (relative vertical) is relative to current Y', () => {
    const cmds = parsePathData('M 0 10 v 10');
    const g = cmds[1] as G0G1Command;
    expect(g.y).toBe(20);
    expect(g.x).toBeUndefined();
  });

  it('Z closes the subpath back to the start point', () => {
    const cmds = parsePathData('M 10 20 L 30 40 Z');
    const last = cmds[cmds.length - 1] as G0G1Command;
    expect(last).toBeInstanceOf(G0G1Command);
    expect(last.x).toBeCloseTo(10, 6);
    expect(last.y).toBeCloseTo(20, 6);
  });

  it('z (lower-case close) behaves identically to Z', () => {
    const cmds = parsePathData('M 5 5 L 10 10 z');
    const last = cmds[cmds.length - 1] as G0G1Command;
    expect(last.x).toBeCloseTo(5, 6);
    expect(last.y).toBeCloseTo(5, 6);
  });

  it('A with sweep=1 produces a counter-clockwise G3 arc', () => {
    const cmds = parsePathData('M 10 0 A 10 10 0 0 1 -10 0');
    const arc = cmds.find((c) => c instanceof G2G3Command) as G2G3Command;
    expect(arc).toBeDefined();
    // SVG sweep=1 means CCW → GCode G3 (clockwise=false)
    expect(arc.clockwise).toBe(false);
  });

  it('A with sweep=0 produces a clockwise G2 arc', () => {
    const cmds = parsePathData('M 10 0 A 10 10 0 0 0 -10 0');
    const arc = cmds.find((c) => c instanceof G2G3Command) as G2G3Command;
    expect(arc).toBeDefined();
    // SVG sweep=0 means CW → GCode G2 (clockwise=true)
    expect(arc.clockwise).toBe(true);
  });

  it('A degenerate same-point arc emits no commands', () => {
    const cmds = parsePathData('M 5 5 A 10 10 0 0 1 5 5');
    // Only the initial M command, no arc
    expect(cmds.every((c) => c instanceof G0G1Command)).toBe(true);
  });

  it('A with different radii linearizes to G0G1 segments', () => {
    const cmds = parsePathData('M 20 0 A 20 10 0 0 1 -20 0');
    // Elliptical arc gets linearized — no G2/G3 commands
    expect(cmds.some((c) => c instanceof G2G3Command)).toBe(false);
    // But we do get some G0G1 line segments
    expect(cmds.filter((c) => c instanceof G0G1Command).length).toBeGreaterThan(1);
  });

  // ── C — cubic Bézier → linearized G0G1 ────────────────────────────────

  it('C (cubic Bézier) is linearized to G0G1 line segments', () => {
    // Simple curve from (0,0) to (100,0) with control points creating a hump
    const cmds = parsePathData('M 0 0 C 0 50 100 50 100 0');
    // Should have the initial M plus several approximation points, no arcs
    expect(cmds.length).toBeGreaterThan(2);
    expect(cmds.every((c) => c instanceof G0G1Command)).toBe(true);
    // Last point must be the end point of the curve
    const last = cmds[cmds.length - 1] as G0G1Command;
    expect(last.x).toBeCloseTo(100, 3);
    expect(last.y).toBeCloseTo(0, 3);
  });

  it('c (relative cubic Bézier) resolves to absolute coordinates', () => {
    const cmds = parsePathData('M 10 10 c 0 40 90 40 90 0');
    const last = cmds[cmds.length - 1] as G0G1Command;
    expect(last.x).toBeCloseTo(100, 3);
    expect(last.y).toBeCloseTo(10, 3);
  });

  it('Q (quadratic Bézier) is converted to cubic and linearized', () => {
    const cmds = parsePathData('M 0 0 Q 50 100 100 0');
    expect(cmds.length).toBeGreaterThan(1);
    expect(cmds.every((c) => c instanceof G0G1Command)).toBe(true);
    const last = cmds[cmds.length - 1] as G0G1Command;
    expect(last.x).toBeCloseTo(100, 3);
    expect(last.y).toBeCloseTo(0, 3);
  });

  it('relative commands accumulate correctly across multiple segments', () => {
    const cmds = parsePathData('M 0 0 l 10 0 l 0 10 l -10 0');
    expect(cmds).toHaveLength(4);
    expectLinear(cmds[1], 10, 0);
    expectLinear(cmds[2], 10, 10);
    expectLinear(cmds[3], 0, 10);
  });

  it('returns empty array for an empty string', () => {
    expect(parsePathData('')).toHaveLength(0);
  });

  it('handles compact notation without spaces between numbers', () => {
    const cmds = parsePathData('M10,20L30,40');
    expect(cmds).toHaveLength(2);
    expectLinear(cmds[0], 10, 20, true);
    expectLinear(cmds[1], 30, 40, false);
  });
});
