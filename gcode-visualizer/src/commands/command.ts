export interface GCodeCommand {}

export class G0G1Command implements GCodeCommand {
  x?: number;
  y?: number;
  z?: number;
  e?: number;
  f?: number;
  constructor(x?: number, y?: number, z?: number, e?: number, f?: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.e = e;
    this.f = f;
  }
}
