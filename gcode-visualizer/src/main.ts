import './style.css';
import { setupCounter } from './counter.ts';
import { setupTheme } from './theme.ts';
import { setupCanvasRenderer } from './renderer/canvas-renderer.ts';
import { G0G1Command, type GCodeCommand } from './commands/command.ts';
import { CommandExecutor } from './commands/command-executor.ts';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<section id="header" class="panel toolbar">
    <header class="panel-header"><h1>G-CODE Visualizer</h1></header>

    <div class="spacer"></div>

    <button id="theme-toggle" class="button" type="button" style="margin-right: 8px;"></button>
</section>

<section id="center">
    <canvas id="canvas" width="800" height="600">Your browser does not seem to support HTML canvas.</canvas>
    <button id="counter" type="button" class="counter"></button>
</section>

`;

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
setupTheme(document.querySelector<HTMLButtonElement>('#theme-toggle')!);
const canvasRenderer = setupCanvasRenderer(document.querySelector<HTMLCanvasElement>('#canvas')!);

canvasRenderer.onClick((position) => {
  console.log('clicked at', position);
});

const executor = new CommandExecutor(canvasRenderer);

const commands: GCodeCommand[] = [
  new G0G1Command(100, 100),
  new G0G1Command(200, 200),
  new G0G1Command(300, 200),
  new G0G1Command(200, 300),
];

executor.execute(commands);
