export class GCodeCommand {
  toString(): string {
    return '';
  }
}

export class UnknownCommand extends GCodeCommand {
  command: string;
  constructor(command: string) {
    super();
    this.command = command;
  }

  toString(): string {
    return this.command;
  }
}

export class G0G1Command extends GCodeCommand {
  x?: number;
  y?: number;
  z?: number;
  e?: number;
  f?: number;
  rapid: boolean;
  constructor(x?: number, y?: number, z?: number, e?: number, f?: number, rapid = false) {
    super();
    this.x = x;
    this.y = y;
    this.z = z;
    this.e = e;
    this.f = f;
    this.rapid = rapid;
  }

  toString(): string {
    let command = this.rapid ? 'G0' : 'G1';
    if (this.x !== undefined) command += ` X${this.x}`;
    if (this.y !== undefined) command += ` Y${this.y}`;
    if (this.z !== undefined) command += ` Z${this.z}`;
    if (this.e !== undefined) command += ` E${this.e}`;
    if (this.f !== undefined) command += ` F${this.f}`;
    return command;
  }
}

export class G2G3Command extends GCodeCommand {
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
    super();
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

  toString(): string {
    let command = this.clockwise ? 'G2' : 'G3';
    if (this.x !== undefined) command += ` X${this.x}`;
    if (this.y !== undefined) command += ` Y${this.y}`;
    if (this.z !== undefined) command += ` Z${this.z}`;
    if (this.i !== undefined) command += ` I${this.i}`;
    if (this.j !== undefined) command += ` J${this.j}`;
    if (this.f !== undefined) command += ` F${this.f}`;
    if (this.k !== undefined) command += ` K${this.k}`;
    if (this.r !== undefined) command += ` R${this.r}`;
    return command;
  }
}
