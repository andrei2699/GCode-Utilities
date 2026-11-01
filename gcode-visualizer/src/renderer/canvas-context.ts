export function get2DRenderingContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  return canvas.getContext('2d');
}

export function getWebGlRenderingContext(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  return (
    canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext)
  );
}
