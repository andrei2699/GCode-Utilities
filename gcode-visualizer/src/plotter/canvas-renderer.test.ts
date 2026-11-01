import { describe, expect, it, vi } from 'vite-plus/test';
import { CanvasRenderer, setupCanvasRenderer } from './canvas-renderer.ts';

function makeCanvas(ctx: CanvasRenderingContext2D | null = {} as CanvasRenderingContext2D) {
  const addEventListenerSpy = vi.fn();
  const canvas = {
    clientWidth: 800,
    clientHeight: 600,
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
    addEventListener: addEventListenerSpy,
  } as unknown as HTMLCanvasElement;
  return { canvas, addEventListenerSpy };
}

describe('CanvasRenderer', () => {
  it('exposes canvas and ctx after construction', () => {
    const mockCtx = {} as CanvasRenderingContext2D;
    const { canvas } = makeCanvas(mockCtx);
    const renderer = new CanvasRenderer(canvas);
    expect(renderer.canvas).toBe(canvas);
    expect(renderer.ctx).toBe(mockCtx);
  });

  it('throws when getContext returns null', () => {
    const { canvas } = makeCanvas(null);
    expect(() => new CanvasRenderer(canvas)).toThrow('2D rendering context not supported');
  });

  it('onClick attaches a click listener to the canvas', () => {
    const { canvas, addEventListenerSpy } = makeCanvas();
    const renderer = new CanvasRenderer(canvas);
    renderer.onClick(vi.fn());
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('onClick callback receives position derived from the mouse event', () => {
    let capturedHandler: ((e: MouseEvent) => void) | null = null;
    const addEventListenerSpy = vi.fn((_type: string, handler: (e: MouseEvent) => void) => {
      capturedHandler = handler;
    });
    const canvas = {
      clientWidth: 100,
      clientHeight: 100,
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({}) as CanvasRenderingContext2D),
      addEventListener: addEventListenerSpy,
    } as unknown as HTMLCanvasElement;

    const renderer = new CanvasRenderer(canvas);
    const cb = vi.fn();
    renderer.onClick(cb);

    capturedHandler!({
      pageX: 150,
      pageY: 250,
      target: { offsetLeft: 50, offsetTop: 100 },
    } as unknown as MouseEvent);

    expect(cb).toHaveBeenCalledWith({ x: 100, y: 150 });
  });
});

describe('setupCanvasRenderer', () => {
  it('returns a CanvasRenderer instance', () => {
    const { canvas } = makeCanvas();
    expect(setupCanvasRenderer(canvas)).toBeInstanceOf(CanvasRenderer);
  });
});
