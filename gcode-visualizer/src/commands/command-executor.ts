import { CanvasRenderer } from '../renderer/canvas-renderer.ts';
import { G0G1Command, type GCodeCommand } from './command.ts';

export class CommandExecutor {
  private renderer: CanvasRenderer;
  private x: number = 0;
  private y: number = 0;

  constructor(renderer: CanvasRenderer) {
    this.renderer = renderer;
  }

  execute(commands: GCodeCommand[]): void {
    const ctx = this.renderer.ctx;

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
      ctx.lineTo(this.x, this.y);
    }
  }
}
