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

  svgInput.value = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E222B" />
      <stop offset="100%" stop-color="#12141A" />
    </linearGradient>

    <!-- Gradient for the 'G' -->
    <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F2FE" />
      <stop offset="100%" stop-color="#4FACFE" />
    </linearGradient>
  </defs>

  <!-- App Icon Base -->
  <rect width="512" height="512" rx="110" fill="url(#bg)" />

  <!-- The "G" shaped path (representing G-code arc/motion) -->
  <path d="M 360,160 
           L 240,160 
           C 150,160 120,220 120,256 
           C 120,380 240,400 320,360 
           C 370,335 390,290 390,256 
           L 256,256" fill="none" stroke="url(#gGrad)" stroke-width="48" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Coordinate Node / Endpoint Dot -->
  <circle cx="360" cy="160" r="24" fill="#FF5252" />
</svg>`;
}
