import { convertSvgToGCode } from '../svg-to-gcode/converter.ts';

export function setupSvgToGCodePage() {
  const svgInput = document.querySelector<HTMLTextAreaElement>('#svg-input-svg-to-gcode')!;
  const gcodeInput = document.querySelector<HTMLTextAreaElement>('#gcode-output-svg-to-gcode')!;

  svgInput.addEventListener('input', () => {
    const svgContent = svgInput.value;
    const gCodeCommands = convertSvgToGCode(svgContent);
    console.log(gCodeCommands[0].toString());
    gcodeInput.value = gCodeCommands.map((cmd) => cmd.toString()).join('\n');
  });
}
