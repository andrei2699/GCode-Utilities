import { describe, expect, it } from 'vite-plus/test';
import { calculate2DClickPosition, calculateWebGlClickPosition } from './canvas-events.ts';

function makeMouseEvent(pageX: number, pageY: number, offsetLeft = 0, offsetTop = 0): MouseEvent {
  return {
    pageX,
    pageY,
    target: { offsetLeft, offsetTop },
  } as unknown as MouseEvent;
}

function makeWebGlContext(drawingBufferHeight: number): WebGLRenderingContext {
  return { drawingBufferHeight } as unknown as WebGLRenderingContext;
}

describe('calculate2DClickPosition', () => {
  it('returns x = pageX - offsetLeft', () => {
    const pos = calculate2DClickPosition(makeMouseEvent(200, 300, 50, 100));
    expect(pos.x).toBe(150);
  });

  it('returns y = pageY - offsetTop', () => {
    const pos = calculate2DClickPosition(makeMouseEvent(200, 300, 50, 100));
    expect(pos.y).toBe(200);
  });

  it('handles zero offsets (canvas at page origin)', () => {
    const pos = calculate2DClickPosition(makeMouseEvent(100, 80));
    expect(pos).toEqual({ x: 100, y: 80 });
  });

  it('handles click at the element origin (pageX = offsetLeft)', () => {
    const pos = calculate2DClickPosition(makeMouseEvent(50, 50, 50, 50));
    expect(pos).toEqual({ x: 0, y: 0 });
  });

  it('handles large coordinates', () => {
    const pos = calculate2DClickPosition(makeMouseEvent(9999, 8888, 1000, 888));
    expect(pos).toEqual({ x: 8999, y: 8000 });
  });
});

describe('calculateWebGlClickPosition', () => {
  it('returns x = pageX - offsetLeft (same as 2D)', () => {
    const pos = calculateWebGlClickPosition(
      makeMouseEvent(200, 300, 50, 100),
      makeWebGlContext(600),
    );
    expect(pos.x).toBe(150);
  });

  it('flips Y: returns y = drawingBufferHeight - (pageY - offsetTop)', () => {
    // pageY=300, offsetTop=100 → local y=200; buffer height 600 → flipped y=400
    const pos = calculateWebGlClickPosition(
      makeMouseEvent(200, 300, 50, 100),
      makeWebGlContext(600),
    );
    expect(pos.y).toBe(400);
  });

  it('y is 0 when click is at the bottom of the buffer', () => {
    // pageY - offsetTop = drawingBufferHeight
    const pos = calculateWebGlClickPosition(makeMouseEvent(0, 600, 0, 0), makeWebGlContext(600));
    expect(pos.y).toBe(0);
  });

  it('y equals drawingBufferHeight when click is at the top (pageY = offsetTop)', () => {
    const pos = calculateWebGlClickPosition(makeMouseEvent(0, 0, 0, 0), makeWebGlContext(600));
    expect(pos.y).toBe(600);
  });

  it('handles zero offsets', () => {
    const pos = calculateWebGlClickPosition(makeMouseEvent(100, 80), makeWebGlContext(400));
    expect(pos).toEqual({ x: 100, y: 320 });
  });
});
