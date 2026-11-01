import { calculate2DClickPosition, type Position } from './canvas-events.ts';
import { get2DRenderingContext } from './canvas-context.ts';

export class CanvasRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = get2DRenderingContext(canvas);
    if (!ctx) {
      throw new Error('2D rendering context not supported');
    }
    this.ctx = ctx;
  }

  onClick(callback: (position: Position) => void) {
    this.canvas.addEventListener('click', (event) => {
      const position = calculate2DClickPosition(event);
      callback(position);
    });
  }
}

export function setupCanvasRenderer(canvas: HTMLCanvasElement) {
  return new CanvasRenderer(canvas);
}
