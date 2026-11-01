import { describe, expect, it, vi } from 'vite-plus/test';
import { get2DRenderingContext, getWebGlRenderingContext } from './canvas-context.ts';

function makeCanvas(overrides?: {
  clientWidth?: number;
  clientHeight?: number;
  ctx2d?: CanvasRenderingContext2D | null;
  ctxWebgl?: WebGLRenderingContext | null;
  ctxExperimental?: WebGLRenderingContext | null;
}) {
  const {
    clientWidth = 800,
    clientHeight = 600,
    ctx2d = {} as CanvasRenderingContext2D,
    ctxWebgl = null,
    ctxExperimental = {} as WebGLRenderingContext,
  } = overrides ?? {};

  return {
    clientWidth,
    clientHeight,
    width: 0,
    height: 0,
    getContext: vi.fn((type: string) => {
      if (type === '2d') return ctx2d;
      if (type === 'webgl') return ctxWebgl;
      if (type === 'experimental-webgl') return ctxExperimental;
      return null;
    }),
  } as unknown as HTMLCanvasElement;
}

describe('get2DRenderingContext', () => {
  it('sets canvas.width and canvas.height from clientWidth/clientHeight', () => {
    const canvas = makeCanvas({ clientWidth: 1024, clientHeight: 768 });
    get2DRenderingContext(canvas);
    expect(canvas.width).toBe(1024);
    expect(canvas.height).toBe(768);
  });

  it('returns the 2D context from getContext("2d")', () => {
    const mockCtx = {} as CanvasRenderingContext2D;
    const canvas = makeCanvas({ ctx2d: mockCtx });
    expect(get2DRenderingContext(canvas)).toBe(mockCtx);
  });

  it('returns null when getContext("2d") returns null', () => {
    const canvas = makeCanvas({ ctx2d: null });
    expect(get2DRenderingContext(canvas)).toBeNull();
  });
});

describe('getWebGlRenderingContext', () => {
  it('sets canvas.width and canvas.height from clientWidth/clientHeight', () => {
    const canvas = makeCanvas({ clientWidth: 640, clientHeight: 480 });
    getWebGlRenderingContext(canvas);
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(480);
  });

  it('returns the webgl context when getContext("webgl") succeeds', () => {
    const mockCtx = {} as WebGLRenderingContext;
    const canvas = makeCanvas({ ctxWebgl: mockCtx });
    expect(getWebGlRenderingContext(canvas)).toBe(mockCtx);
  });

  it('falls back to "experimental-webgl" when "webgl" returns null', () => {
    const expCtx = {} as WebGLRenderingContext;
    const canvas = makeCanvas({ ctxWebgl: null, ctxExperimental: expCtx });
    expect(getWebGlRenderingContext(canvas)).toBe(expCtx);
  });

  it('returns null when both webgl and experimental-webgl return null', () => {
    const canvas = makeCanvas({ ctxWebgl: null, ctxExperimental: null });
    expect(getWebGlRenderingContext(canvas)).toBeNull();
  });
});
