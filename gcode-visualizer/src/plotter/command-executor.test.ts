import { describe, expect, it, vi } from 'vite-plus/test';
import { G0G1Command, G2G3Command } from '../commands/command.ts';
import { CommandExecutor } from './command-executor.ts';
import type { CanvasRenderer } from './canvas-renderer.ts';

function makeMockCtx() {
  return {
    reset: vi.fn(),
    beginPath: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
  };
}

function makeMockRenderer(ctx: ReturnType<typeof makeMockCtx>): CanvasRenderer {
  return { ctx } as unknown as CanvasRenderer;
}

function makeExecutor() {
  const ctx = makeMockCtx();
  const renderer = makeMockRenderer(ctx);
  const executor = new CommandExecutor(renderer);
  return { executor, ctx };
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

  it('accumulates position across commands', () => {
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

  it('calls ctx.arc for a G2 arc specified with I/J', () => {
    const { executor, ctx } = makeExecutor();
    // Start at (10, 0). G2 to (-10, 0) with I=-10, J=0 → center=(0,0), radius=10
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

  it('calls ctx.arc for a G3 counter-clockwise arc', () => {
    const { executor, ctx } = makeExecutor();
    executor.execute([
      new G0G1Command(10, 0, undefined, undefined, undefined, true),
      new G2G3Command(false, -10, 0, undefined, -10, 0),
    ]);
    expect(ctx.arc).toHaveBeenCalledOnce();
    // anticlockwise flag should be true for G3
    const anticlockwise = ctx.arc.mock.calls[0][5] as boolean;
    expect(anticlockwise).toBe(true);
  });

  it('resolves the correct arc center from R format (minor arc)', () => {
    const { executor, ctx } = makeExecutor();
    // Start at (0,0), G2 to (10,0), R=5 — center should be at (5, ±?)
    executor.execute([
      new G0G1Command(0, 0, undefined, undefined, undefined, true),
      new G2G3Command(true, 10, 0, undefined, undefined, undefined, undefined, undefined, 5),
    ]);
    expect(ctx.arc).toHaveBeenCalledOnce();
    const [, , r] = ctx.arc.mock.calls[0] as [number, number, number];
    expect(r).toBeCloseTo(5, 5);
  });

  it('resolves the correct arc center from R format (major arc, negative R)', () => {
    const { executor, ctx } = makeExecutor();
    executor.execute([
      new G0G1Command(0, 0, undefined, undefined, undefined, true),
      new G2G3Command(true, 10, 0, undefined, undefined, undefined, undefined, undefined, -5),
    ]);
    expect(ctx.arc).toHaveBeenCalledOnce();
    const [, , r] = ctx.arc.mock.calls[0] as [number, number, number];
    expect(r).toBeCloseTo(5, 5);
  });

  it('throws RangeError when chord exceeds diameter', () => {
    const { executor } = makeExecutor();
    // Start at (0,0), end at (20,0) — chord length 20 > diameter 10 (R=5)
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
});
