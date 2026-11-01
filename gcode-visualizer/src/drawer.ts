import type { CommandExecutor } from './commands/command-executor.ts';
import { G0G1Command, type GCodeCommand } from './commands/command.ts';

export function setupDrawButton(element: HTMLButtonElement, executor: CommandExecutor) {
  element.addEventListener('click', () => {
    const commands: GCodeCommand[] = [
      new G0G1Command(100, 100),
      new G0G1Command(200, 200),
      new G0G1Command(300, 200),
      new G0G1Command(200, 300),
    ];

    executor.execute(commands);
  });
}
