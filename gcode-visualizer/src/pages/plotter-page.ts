import { setupCanvasRenderer } from '../plotter/canvas-renderer.ts';
import { CommandExecutor } from '../plotter/command-executor.ts';
import { CommandParser } from '../commands/command-parser.ts';
import type { GCodeCommand } from '../commands/command.ts';

export function setupPlotterPage() {
  const canvasRenderer = setupCanvasRenderer(document.querySelector<HTMLCanvasElement>('#canvas')!);
  canvasRenderer.onClick((position) => {
    console.log('clicked at', position);
  });

  const executor = new CommandExecutor(canvasRenderer);
  const parser = new CommandParser();

  const inputElement = document.querySelector<HTMLTextAreaElement>('#gcode-input-plotter')!;
  const drawButton = document.querySelector<HTMLButtonElement>('#draw-button')!;

  drawButton.addEventListener('click', plotGCode);
  inputElement.addEventListener('input', plotGCode);

  function plotGCode() {
    const gcode = inputElement.value;
    const commands: GCodeCommand[] = parser.parse(gcode);

    executor.execute(commands);
  }
}
