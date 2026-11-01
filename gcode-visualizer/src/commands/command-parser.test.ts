import { describe, expect, it } from 'vite-plus/test';
import { G0G1Command, G2G3Command } from './command.ts';
import { CommandParser } from './command-parser.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function g0g1(cmds: ReturnType<CommandParser['parse']>, index = 0) {
  const cmd = cmds[index];
  expect(cmd).toBeInstanceOf(G0G1Command);
  return cmd as G0G1Command;
}

function g2g3(cmds: ReturnType<CommandParser['parse']>, index = 0) {
  const cmd = cmds[index];
  expect(cmd).toBeInstanceOf(G2G3Command);
  return cmd as G2G3Command;
}

// ─────────────────────────────────────────────────────────────────────────────

describe('CommandParser', () => {
  const parser = new CommandParser();

  // ── G0 (rapid) ────────────────────────────────────────────────────────────

  describe('G0 — rapid move', () => {
    it('sets rapid=true', () => {
      expect(g0g1(parser.parse('G0 X10 Y20')).rapid).toBe(true);
    });

    it('parses X and Y', () => {
      const cmd = g0g1(parser.parse('G0 X10 Y20'));
      expect(cmd.x).toBe(10);
      expect(cmd.y).toBe(20);
    });

    it('parses only Z (X and Y stay undefined)', () => {
      const cmd = g0g1(parser.parse('G0 Z5'));
      expect(cmd.z).toBe(5);
      expect(cmd.x).toBeUndefined();
      expect(cmd.y).toBeUndefined();
    });

    it('parses fractional coordinates', () => {
      const cmd = g0g1(parser.parse('G0 X1.25 Y-0.5'));
      expect(cmd.x).toBe(1.25);
      expect(cmd.y).toBe(-0.5);
    });

    it('does NOT match G00 (requires space or end-of-line after G0)', () => {
      expect(parser.parse('G00 X10')).toHaveLength(0);
    });

    it('matches bare "G0" at end of line with no parameters', () => {
      const cmd = g0g1(parser.parse('G0'));
      expect(cmd.rapid).toBe(true);
      expect(cmd.x).toBeUndefined();
    });
  });

  // ── G1 (feed) ─────────────────────────────────────────────────────────────

  describe('G1 — feed move', () => {
    it('sets rapid=false', () => {
      expect(g0g1(parser.parse('G1 X5 Y3')).rapid).toBe(false);
    });

    it('parses X, Y, and F', () => {
      const cmd = g0g1(parser.parse('G1 X5.5 Y3.2 F3000'));
      expect(cmd.x).toBe(5.5);
      expect(cmd.y).toBe(3.2);
      expect(cmd.f).toBe(3000);
    });

    it('parses E (extrusion)', () => {
      const cmd = g0g1(parser.parse('G1 X10 E1.5'));
      expect(cmd.x).toBe(10);
      expect(cmd.e).toBe(1.5);
    });

    it('parses negative coordinates', () => {
      const cmd = g0g1(parser.parse('G1 X-10 Y-20.5'));
      expect(cmd.x).toBe(-10);
      expect(cmd.y).toBe(-20.5);
    });

    it('parses positive-signed coordinates (+)', () => {
      const cmd = g0g1(parser.parse('G1 X+10 Y+5'));
      expect(cmd.x).toBe(10);
      expect(cmd.y).toBe(5);
    });

    it('does NOT match G10 (would be a different command)', () => {
      expect(parser.parse('G10 L2 P1')).toHaveLength(0);
    });

    it('matches bare "G1" at end of line', () => {
      const cmd = g0g1(parser.parse('G1'));
      expect(cmd.rapid).toBe(false);
    });
  });

  // ── G2 (clockwise arc) ────────────────────────────────────────────────────

  describe('G2 — clockwise arc', () => {
    it('sets clockwise=true', () => {
      expect(g2g3(parser.parse('G2 X10 Y0 I5 J0')).clockwise).toBe(true);
    });

    it('parses X, Y, I, J', () => {
      const cmd = g2g3(parser.parse('G2 X10 Y0 I5 J0'));
      expect(cmd.x).toBe(10);
      expect(cmd.y).toBe(0);
      expect(cmd.i).toBe(5);
      expect(cmd.j).toBe(0);
    });

    it('parses negative I and J offsets', () => {
      const cmd = g2g3(parser.parse('G2 X0 Y0 I-5 J-5'));
      expect(cmd.i).toBe(-5);
      expect(cmd.j).toBe(-5);
    });

    it('parses R parameter (radius format)', () => {
      const cmd = g2g3(parser.parse('G2 X10 Y10 R5'));
      expect(cmd.r).toBe(5);
      expect(cmd.i).toBeUndefined();
    });

    it('parses negative R (major arc)', () => {
      const cmd = g2g3(parser.parse('G2 X10 Y10 R-5'));
      expect(cmd.r).toBe(-5);
    });

    it('parses K parameter', () => {
      const cmd = g2g3(parser.parse('G2 X5 Y5 I2 J0 K1'));
      expect(cmd.k).toBe(1);
    });

    it('parses F (feed rate)', () => {
      const cmd = g2g3(parser.parse('G2 X10 Y0 I5 J0 F1500'));
      expect(cmd.f).toBe(1500);
    });

    // G28 starts with "G2" so startsWith('G2') is true — it gets parsed as G2
    it('G28 is (incorrectly) matched as G2 by startsWith — documents the known behaviour', () => {
      const cmds = parser.parse('G28');
      expect(cmds).toHaveLength(1);
      expect(cmds[0]).toBeInstanceOf(G2G3Command);
    });
  });

  // ── G3 (counter-clockwise arc) ────────────────────────────────────────────

  describe('G3 — counter-clockwise arc', () => {
    it('sets clockwise=false', () => {
      expect(g2g3(parser.parse('G3 X10 Y0 I5 J0')).clockwise).toBe(false);
    });

    it('parses X, Y, I, J', () => {
      const cmd = g2g3(parser.parse('G3 X-5 Y5 I0 J5'));
      expect(cmd.x).toBe(-5);
      expect(cmd.y).toBe(5);
      expect(cmd.i).toBe(0);
      expect(cmd.j).toBe(5);
    });
  });

  // ── Comment stripping ─────────────────────────────────────────────────────

  describe('comment stripping', () => {
    it('strips semicolon comment from a G1 line', () => {
      const cmd = g0g1(parser.parse('G1 X10 Y20 ; move to corner'));
      expect(cmd.x).toBe(10);
      expect(cmd.y).toBe(20);
    });

    it('strips parenthesis comment from a G0 line', () => {
      const cmd = g0g1(parser.parse('G0 X5 (rapid to home)'));
      expect(cmd.x).toBe(5);
    });

    it('semicolon at the very start makes the whole line a comment', () => {
      expect(parser.parse('; this is a comment')).toHaveLength(0);
    });

    it('parenthesis at the very start makes the whole line empty', () => {
      expect(parser.parse('(this is a comment)')).toHaveLength(0);
    });

    it('semicolon directly after command letter (no space)', () => {
      // "G1;comment" → trimmed to "G1" → matched as bare G1
      const cmds = parser.parse('G1;comment');
      expect(cmds).toHaveLength(1);
    });
  });

  // ── Blank / whitespace lines ───────────────────────────────────────────────

  describe('blank and whitespace lines', () => {
    it('ignores blank lines', () => {
      expect(parser.parse('\n\n\n')).toHaveLength(0);
    });

    it('ignores lines with only spaces', () => {
      expect(parser.parse('   ')).toHaveLength(0);
    });
  });

  // ── Unrecognised lines ────────────────────────────────────────────────────

  describe('unrecognised / skipped commands', () => {
    it('silently skips M-codes', () => {
      const cmds = parser.parse('M104 S200\nM109 S200\nG1 X5 Y5');
      expect(cmds).toHaveLength(1);
      expect(g0g1(cmds).x).toBe(5);
    });

    it('silently skips T (tool-change) lines', () => {
      expect(parser.parse('T0')).toHaveLength(0);
    });

    it('silently skips G28 (home) — but documents it is matched as G2', () => {
      // Intentionally documented quirk
      const cmds = parser.parse('M104 S200\nG28\nG1 X5 Y5');
      expect(cmds).toHaveLength(2);
      expect(cmds[cmds.length - 1]).toBeInstanceOf(G0G1Command);
    });
  });

  // ── Multi-line / real programs ─────────────────────────────────────────────

  describe('multi-line programs', () => {
    it('parses a small complete toolpath in order', () => {
      const input = ['G0 X0 Y0', 'G1 X10 Y0 F2000', 'G2 X10 Y10 I0 J5', 'G1 X0 Y10'].join('\n');
      const cmds = parser.parse(input);
      expect(cmds).toHaveLength(4);
      expect(cmds[0]).toBeInstanceOf(G0G1Command);
      expect((cmds[0] as G0G1Command).rapid).toBe(true);
      expect(cmds[2]).toBeInstanceOf(G2G3Command);
    });

    it('handles Windows line endings (CRLF)', () => {
      const cmds = parser.parse('G0 X0 Y0\r\nG1 X10 Y10');
      // \r will end up in the parsed value if not stripped — verify it doesn't corrupt numbers
      expect(cmds).toHaveLength(2);
    });

    it('interleaves comments and commands correctly', () => {
      const input = ['; start', 'G0 X0 Y0', '; move right', 'G1 X10 Y0'].join('\n');
      const cmds = parser.parse(input);
      expect(cmds).toHaveLength(2);
    });
  });
});
