export interface Position {
  x: number;
  y: number;
}

export function calculateWebGlClickPosition(
  event: MouseEvent,
  gl: WebGLRenderingContext,
): Position {
  const target = event.target as HTMLElement;

  return {
    x: event.pageX - target.offsetLeft,
    y: gl.drawingBufferHeight - (event.pageY - target.offsetTop),
  };
}

export function calculate2DClickPosition(event: MouseEvent): Position {
  const target = event.target as HTMLElement;

  return {
    x: event.pageX - target.offsetLeft,
    y: event.pageY - target.offsetTop,
  };
}
