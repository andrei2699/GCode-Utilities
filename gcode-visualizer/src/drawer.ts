import type { CommandExecutor } from './commands/command-executor.ts';
import { type GCodeCommand } from './commands/command.ts';
import { CommandParser } from './commands/command-parser.ts';

export function setupDrawButton(
  drawButton: HTMLButtonElement,
  executor: CommandExecutor,
  parser: CommandParser,
) {
  let inputElement = document.querySelector<HTMLTextAreaElement>('#gcode-input')!;

  drawButton.addEventListener('click', () => {
    const gcode = inputElement.value;
    const commands: GCodeCommand[] = parser.parse(gcode);

    executor.execute(commands);
  });
}
