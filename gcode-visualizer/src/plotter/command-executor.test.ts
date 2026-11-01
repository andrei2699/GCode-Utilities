import { describe, expect, it, vi } from 'vite-plus/test';
import { G0G1Command, G2G3Command } from '../commands/command.ts';
import { CommandExecutor } from './command-executor.ts';
import type { CanvasRenderer } from './canvas-renderer.ts';

function makeExecutor() {
  const ctx = {
    reset: vi.fn(),
    beginPath: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
  };
  const renderer = { ctx } as unknown as CanvasRenderer;
  return { executor: new CommandExecutor(renderer), ctx };
}

describe('CommandExecutor.execute', () => {
  it('resets the context and strokes on each execute call', () => {
    const { executor, ctx } = makeExecutor();
    executor.execute([]);
    expect(ctx.reset).toHaveBeenCalledOnce();
    expect(ctx.beginPath).toHaveBeenCalledOnce();
    expect(ctx.stroke).toHaveBeenCalledOnce();
  });

  it('calls moveTo for a rapid G0 command', () => {
    const { executor, ctx } = makeExecutor();
    executor.execute([new G0G1Command(10, 20, undefined, undefined, undefined, true)]);
    expect(ctx.moveTo).toHaveBeenCalledWith(10, 20);
    expect(ctx.lineTo).not.toHaveBeenCalled();
  });

  it('calls lineTo for a feed G1 command', () => {
    const { executor, ctx } = makeExecutor();
    executor.execute([new G0G1Command(5, 15)]);
    expect(ctx.lineTo).toHaveBeenCalledWith(5, 15);
    expect(ctx.moveTo).not.toHaveBeenCalled();
  });

  it('retains last known position when an axis is undefined', () => {
    const { executor, ctx } = makeExecutor();
    executor.execute([
      new G0G1Command(10, 0, undefined, undefined, undefined, true),
      new G0G1Command(undefined, 20),
    ]);
    expect(ctx.moveTo).toHaveBeenCalledWith(10, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(10, 20);
  });

  it('resets position to 0,0 between execute calls', () => {
    const { executor, ctx } = makeExecutor();
    executor.execute([new G0G1Command(50, 50, undefined, undefined, undefined, true)]);
    ctx.moveTo.mockClear();
    executor.execute([
      new G0G1Command(undefined, undefined, undefined, undefined, undefined, true),
    ]);
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
  });

  describe('G2/G3 arc with I/J offsets', () => {
    it('computes center from I/J and calls ctx.arc', () => {
      const { executor, ctx } = makeExecutor();
      // start (10,0), center=(0,0) via I=-10 J=0, end=(-10,0)
      executor.execute([
        new G0G1Command(10, 0, undefined, undefined, undefined, true),
        new G2G3Command(true, -10, 0, undefined, -10, 0),
      ]);
      expect(ctx.arc).toHaveBeenCalledOnce();
      const [cx, cy, r] = ctx.arc.mock.calls[0] as [number, number, number];
      expect(cx).toBeCloseTo(0, 5);
      expect(cy).toBeCloseTo(0, 5);
      expect(r).toBeCloseTo(10, 5);
    });

    it('G2 clockwise passes anticlockwise=false to ctx.arc', () => {
      const { executor, ctx } = makeExecutor();
      executor.execute([
        new G0G1Command(10, 0, undefined, undefined, undefined, true),
        new G2G3Command(true, -10, 0, undefined, -10, 0),
      ]);
      expect(ctx.arc.mock.calls[0][5]).toBe(false);
    });

    it('G3 counter-clockwise passes anticlockwise=true to ctx.arc', () => {
      const { executor, ctx } = makeExecutor();
      executor.execute([
        new G0G1Command(10, 0, undefined, undefined, undefined, true),
        new G2G3Command(false, -10, 0, undefined, -10, 0),
      ]);
      expect(ctx.arc.mock.calls[0][5]).toBe(true);
    });

    it('uses current position as end when x/y are undefined', () => {
      const { executor, ctx } = makeExecutor();
      executor.execute([
        new G0G1Command(10, 0, undefined, undefined, undefined, true),
        new G2G3Command(true, undefined, undefined, undefined, -5, 0),
      ]);
      expect(ctx.arc).toHaveBeenCalledOnce();
      // end position stays at (10,0) so start angle === end angle
      const [, , r] = ctx.arc.mock.calls[0] as [number, number, number];
      expect(r).toBeCloseTo(5, 5);
    });

    it('defaults missing I/J to 0 (center = current position)', () => {
      const { executor, ctx } = makeExecutor();
      executor.execute([
        new G0G1Command(5, 3, undefined, undefined, undefined, true),
        new G2G3Command(true, 5, 3, undefined, undefined, undefined),
      ]);
      const [cx, cy] = ctx.arc.mock.calls[0] as [number, number];
      expect(cx).toBeCloseTo(5, 5);
      expect(cy).toBeCloseTo(3, 5);
    });

    it('updates current position to arc end point', () => {
      const { executor, ctx } = makeExecutor();
      // Arc from (10,0) to (-10,0), then a lineto with only Y specified.
      // After the arc, x=-10, so lineTo should be called with (-10, 5).
      executor.execute([
        new G0G1Command(10, 0, undefined, undefined, undefined, true),
        new G2G3Command(true, -10, 0, undefined, -10, 0),
        new G0G1Command(undefined, 5),
      ]);
      expect(ctx.lineTo).toHaveBeenCalledWith(-10, 5);
    });
  });

  describe('G2/G3 arc with R (radius) format', () => {
    it('calls ctx.arc with the correct radius for a minor arc', () => {
      const { executor, ctx } = makeExecutor();
      executor.execute([
        new G0G1Command(0, 0, undefined, undefined, undefined, true),
        new G2G3Command(true, 10, 0, undefined, undefined, undefined, undefined, undefined, 5),
      ]);
      const [, , r] = ctx.arc.mock.calls[0] as [number, number, number];
      expect(r).toBeCloseTo(5, 5);
    });

    it('major arc (negative R) still passes positive radius to ctx.arc', () => {
      const { executor, ctx } = makeExecutor();
      executor.execute([
        new G0G1Command(0, 0, undefined, undefined, undefined, true),
        new G2G3Command(true, 10, 0, undefined, undefined, undefined, undefined, undefined, -5),
      ]);
      const [, , r] = ctx.arc.mock.calls[0] as [number, number, number];
      expect(r).toBeCloseTo(5, 5);
    });

    it('CW and CCW minor arcs for the same chord pick centers on opposite sides', () => {
      // Chord (0,0)→(10,0), r=8 — centerOffset = sqrt(64-25) = ~6.24, so centers are at (5,±6.24)
      const { executor: eCW, ctx: ctxCW } = makeExecutor();
      eCW.execute([
        new G0G1Command(0, 0, undefined, undefined, undefined, true),
        new G2G3Command(true, 10, 0, undefined, undefined, undefined, undefined, undefined, 8),
      ]);
      const { executor: eCCW, ctx: ctxCCW } = makeExecutor();
      eCCW.execute([
        new G0G1Command(0, 0, undefined, undefined, undefined, true),
        new G2G3Command(false, 10, 0, undefined, undefined, undefined, undefined, undefined, 8),
      ]);
      const [, cyCW] = ctxCW.arc.mock.calls[0] as [number, number];
      const [, cyCCW] = ctxCCW.arc.mock.calls[0] as [number, number];
      // One center is above the chord, the other below
      expect(Math.sign(cyCW)).not.toBe(Math.sign(cyCCW));
    });

    it('throws RangeError when chord exceeds diameter', () => {
      const { executor } = makeExecutor();
      expect(() =>
        executor.execute([
          new G0G1Command(0, 0, undefined, undefined, undefined, true),
          new G2G3Command(true, 20, 0, undefined, undefined, undefined, undefined, undefined, 5),
        ]),
      ).toThrow(RangeError);
    });

    it('throws RangeError when radius is zero', () => {
      const { executor } = makeExecutor();
      expect(() =>
        executor.execute([
          new G0G1Command(0, 0, undefined, undefined, undefined, true),
          new G2G3Command(true, 10, 0, undefined, undefined, undefined, undefined, undefined, 0),
        ]),
      ).toThrow(RangeError);
    });

    it('throws RangeError when start and end are the same point', () => {
      const { executor } = makeExecutor();
      expect(() =>
        executor.execute([
          new G0G1Command(5, 5, undefined, undefined, undefined, true),
          new G2G3Command(true, 5, 5, undefined, undefined, undefined, undefined, undefined, 10),
        ]),
      ).toThrow(RangeError);
    });
  });
});
