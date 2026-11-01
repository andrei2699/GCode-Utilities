import { describe, expect, it } from 'vite-plus/test';
import { G0G1Command, G2G3Command, GCodeCommand, UnknownCommand } from './command.ts';

describe('GCodeCommand', () => {
  it('toString returns an empty string', () => {
    expect(new GCodeCommand().toString()).toBe('');
  });
});

describe('UnknownCommand', () => {
  it('stores the command string on .command', () => {
    const cmd = new UnknownCommand('M104 S200');
    expect(cmd.command).toBe('M104 S200');
  });

  it('toString returns the raw command string', () => {
    expect(new UnknownCommand('T0').toString()).toBe('T0');
  });

  it('preserves an empty string', () => {
    expect(new UnknownCommand('').toString()).toBe('');
  });

  it('preserves whitespace and special characters', () => {
    const raw = 'M600  ; pause  (filament)';
    expect(new UnknownCommand(raw).toString()).toBe(raw);
  });
});

describe('G0G1Command', () => {
  describe('constructor defaults', () => {
    it('defaults rapid to false when omitted', () => {
      expect(new G0G1Command(1, 2).rapid).toBe(false);
    });

    it('all parameters are optional — constructor accepts no args', () => {
      const cmd = new G0G1Command();
      expect(cmd.x).toBeUndefined();
      expect(cmd.y).toBeUndefined();
      expect(cmd.z).toBeUndefined();
      expect(cmd.e).toBeUndefined();
      expect(cmd.f).toBeUndefined();
      expect(cmd.rapid).toBe(false);
    });
  });

  describe('toString — G0 (rapid)', () => {
    it('G0 with X and Y', () => {
      expect(new G0G1Command(10, 20, undefined, undefined, undefined, true).toString()).toBe(
        'G0 X10 Y20',
      );
    });

    it('G0 with only Z', () => {
      expect(new G0G1Command(undefined, undefined, 5, undefined, undefined, true).toString()).toBe(
        'G0 Z5',
      );
    });

    it('G0 with all axes', () => {
      expect(new G0G1Command(1, 2, 3, undefined, undefined, true).toString()).toBe('G0 X1 Y2 Z3');
    });
  });

  describe('toString — G1 (feed)', () => {
    it('G1 with X and Y', () => {
      expect(new G0G1Command(5.5, 3.2).toString()).toBe('G1 X5.5 Y3.2');
    });

    it('G1 with Y only (X is undefined)', () => {
      expect(new G0G1Command(undefined, 15).toString()).toBe('G1 Y15');
    });

    it('G1 with X only (Y is undefined)', () => {
      expect(new G0G1Command(7).toString()).toBe('G1 X7');
    });

    it('G1 with all fields: X Y Z E F', () => {
      expect(new G0G1Command(1, 2, 3, 0.5, 3000, false).toString()).toBe('G1 X1 Y2 Z3 E0.5 F3000');
    });

    it('G1 with no axes produces just "G1"', () => {
      expect(new G0G1Command().toString()).toBe('G1');
    });

    it('G1 with negative values', () => {
      expect(new G0G1Command(-10, -20.5).toString()).toBe('G1 X-10 Y-20.5');
    });

    it('G1 with zero values (zero must not be omitted)', () => {
      expect(new G0G1Command(0, 0).toString()).toBe('G1 X0 Y0');
    });

    it('G1 with E and F but no XYZ', () => {
      expect(new G0G1Command(undefined, undefined, undefined, 1.2, 500).toString()).toBe(
        'G1 E1.2 F500',
      );
    });
  });
});

describe('G2G3Command', () => {
  describe('constructor defaults', () => {
    it('clockwise=true → G2', () => {
      expect(new G2G3Command(true).toString()).toBe('G2');
    });

    it('clockwise=false → G3', () => {
      expect(new G2G3Command(false).toString()).toBe('G3');
    });

    it('all optional fields are undefined by default', () => {
      const cmd = new G2G3Command(true);
      expect(cmd.x).toBeUndefined();
      expect(cmd.y).toBeUndefined();
      expect(cmd.z).toBeUndefined();
      expect(cmd.i).toBeUndefined();
      expect(cmd.j).toBeUndefined();
      expect(cmd.f).toBeUndefined();
      expect(cmd.k).toBeUndefined();
      expect(cmd.r).toBeUndefined();
    });
  });

  describe('toString — G2 (clockwise)', () => {
    it('G2 with X Y and I J offsets', () => {
      expect(new G2G3Command(true, 10, 0, undefined, 5, 0).toString()).toBe('G2 X10 Y0 I5 J0');
    });

    it('G2 with R parameter', () => {
      expect(
        new G2G3Command(
          true,
          10,
          10,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          5,
        ).toString(),
      ).toBe('G2 X10 Y10 R5');
    });

    it('G2 with negative R (major arc)', () => {
      expect(
        new G2G3Command(
          true,
          10,
          10,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          -5,
        ).toString(),
      ).toBe('G2 X10 Y10 R-5');
    });

    it('G2 with all fields: X Y Z I J F K', () => {
      expect(new G2G3Command(true, 1, 2, 3, 0.5, 0.5, 1500, 0.1).toString()).toBe(
        'G2 X1 Y2 Z3 I0.5 J0.5 F1500 K0.1',
      );
    });
  });

  describe('toString — G3 (counter-clockwise)', () => {
    it('G3 with X Y and I J offsets', () => {
      expect(new G2G3Command(false, 10, 0, undefined, 5, 0).toString()).toBe('G3 X10 Y0 I5 J0');
    });

    it('G3 with all fields including K', () => {
      expect(new G2G3Command(false, 1, 2, 3, 0.5, 0.5, 1500, 0, undefined).toString()).toBe(
        'G3 X1 Y2 Z3 I0.5 J0.5 F1500 K0',
      );
    });
  });

  describe('toString — field omission', () => {
    it('omits undefined axes — only I J defined', () => {
      expect(new G2G3Command(true, undefined, undefined, undefined, 10, 0).toString()).toBe(
        'G2 I10 J0',
      );
    });

    it('zero values are not omitted', () => {
      expect(new G2G3Command(false, 0, 0, 0, 0, 0, 0, 0).toString()).toBe(
        'G3 X0 Y0 Z0 I0 J0 F0 K0',
      );
    });
  });
});
