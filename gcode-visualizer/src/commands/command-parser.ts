import { G0G1Command, type GCodeCommand } from './command.ts';

export class CommandParser {
  parse(commandString: string): GCodeCommand[] {
    const commands: GCodeCommand[] = [];
    const lines = commandString.split('\n');

    for (const line of lines) {
      const trimmedLine = this.removeComments(line);
      if (trimmedLine === '') continue;

      if (trimmedLine.startsWith('G0') || trimmedLine.startsWith('G1')) {
        commands.push(this.parseG0G1Command(trimmedLine));
      }
    }

    return commands;
  }

  private parseG0G1Command(line: string): GCodeCommand {
    const regex = /([XYZEF])([-+]?[0-9]*\.?[0-9]+)/g;
    const command: any = {};
    let match;

    while ((match = regex.exec(line)) !== null) {
      const axis = match[1];
      command[axis.toLowerCase()] = parseFloat(match[2]);
    }

    return new G0G1Command(command.x, command.y, command.z, command.e, command.f);
  }

  private removeComments(line: string): string {
    const commentIndex = line.indexOf(';');
    if (commentIndex !== -1) {
      return line.substring(0, commentIndex).trim();
    }
    const parenIndex = line.indexOf('(');
    if (parenIndex !== -1) {
      return line.substring(0, parenIndex).trim();
    }

    return line.trim();
  }
}
