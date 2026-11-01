import { CanvasRenderer } from './canvas-renderer.ts';
import { G0G1Command, G2G3Command, type GCodeCommand } from '../commands/command.ts';

export class CommandExecutor {
  private renderer: CanvasRenderer;
  private x: number = 0;
  private y: number = 0;

  constructor(renderer: CanvasRenderer) {
    this.renderer = renderer;
  }

  execute(commands: GCodeCommand[]): void {
    const ctx = this.renderer.ctx;
    ctx.reset();
    this.x = 0;
    this.y = 0;

    ctx.beginPath();

    for (const command of commands) {
      this.runCommand(command, ctx);
    }

    ctx.stroke();
  }

  private runCommand(command: GCodeCommand, ctx: CanvasRenderingContext2D) {
    if (command instanceof G0G1Command) {
      const { x, y } = command;
      this.x = x ?? this.x;
      this.y = y ?? this.y;
      if (command.rapid) {
        ctx.moveTo(this.x, this.y);
      } else {
        ctx.lineTo(this.x, this.y);
      }
    } else if (command instanceof G2G3Command) {
      const { x, y, i, j, r } = command;
      const endX = x ?? this.x;
      const endY = y ?? this.y;
      const center =
        r === undefined
          ? { x: (i ?? 0) + this.x, y: (j ?? 0) + this.y }
          : this.getRadiusArcCenter(endX, endY, r, command.clockwise);

      const radius = Math.hypot(this.x - center.x, this.y - center.y);
      const startAngle = Math.atan2(this.y - center.y, this.x - center.x);
      const endAngle = Math.atan2(endY - center.y, endX - center.x);

      ctx.arc(center.x, center.y, radius, startAngle, endAngle, !command.clockwise);
      this.x = endX;
      this.y = endY;
    }
  }

  private getRadiusArcCenter(
    endX: number,
    endY: number,
    signedRadius: number,
    clockwise: boolean,
  ): { x: number; y: number } {
    const radius = Math.abs(signedRadius);
    const deltaX = endX - this.x;
    const deltaY = endY - this.y;
    const chordLength = Math.hypot(deltaX, deltaY);
    const tolerance = Number.EPSILON * Math.max(1, radius, chordLength) * 16;

    if (radius === 0 || chordLength === 0 || chordLength > radius * 2 + tolerance) {
      throw new RangeError(
        'Invalid radius-format arc: radius must span distinct start and end points.',
      );
    }

    const halfChord = chordLength / 2;
    const centerOffset = Math.sqrt(Math.max(0, radius * radius - halfChord * halfChord));
    const midpointX = (this.x + endX) / 2;
    const midpointY = (this.y + endY) / 2;
    const perpendicularX = -deltaY / chordLength;
    const perpendicularY = deltaX / chordLength;
    const centers = [
      {
        x: midpointX + perpendicularX * centerOffset,
        y: midpointY + perpendicularY * centerOffset,
      },
      {
        x: midpointX - perpendicularX * centerOffset,
        y: midpointY - perpendicularY * centerOffset,
      },
    ];
    const wantsMajorArc = signedRadius < 0;

    const matchingCenter = centers.find((center) => {
      const startAngle = Math.atan2(this.y - center.y, this.x - center.x);
      const endAngle = Math.atan2(endY - center.y, endX - center.x);
      const sweep = clockwise
        ? (endAngle - startAngle + 2 * Math.PI) % (2 * Math.PI)
        : (startAngle - endAngle + 2 * Math.PI) % (2 * Math.PI);

      return wantsMajorArc ? sweep >= Math.PI - tolerance : sweep <= Math.PI + tolerance;
    });

    if (!matchingCenter) {
      throw new RangeError('Unable to resolve radius-format arc center.');
    }

    return matchingCenter;
  }
}
