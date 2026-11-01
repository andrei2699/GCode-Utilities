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
export class G2G3Command implements GCodeCommand {
  clockwise: boolean;
  x?: number;
  y?: number;
  z?: number;
  i?: number;
  j?: number;
  f?: number;
  k?: number;
  r?: number;

  constructor(
    clockwise: boolean,
    x?: number,
    y?: number,
    z?: number,
    i?: number,
    j?: number,
    f?: number,
    k?: number,
    r?: number,
  ) {
    this.clockwise = clockwise;
    this.x = x;
    this.y = y;
    this.z = z;
    this.i = i;
    this.j = j;
    this.f = f;
    this.k = k;
    this.r = r;
  }
}
