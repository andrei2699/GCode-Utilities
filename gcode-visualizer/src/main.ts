import './style.css';
import { setupTheme } from './theme.ts';
import { setupCanvasRenderer } from './renderer/canvas-renderer.ts';
import { CommandExecutor } from './commands/command-executor.ts';
import { setupDrawButton } from './drawer.ts';
import { CommandParser } from './commands/command-parser.ts';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<section id="header" class="panel toolbar">
    <header class="panel-header"><h1>G-CODE Visualizer</h1></header>

    <div class="spacer"></div>

    <button id="theme-toggle" class="button" type="button" style="margin-right: 8px;"></button>
</section>

<section id="center">
    <div class="panel" style="display: flex; flex-direction: row; gap: 16px; align-items: flex-start; padding: 16px;">
        <canvas id="canvas" width="800" height="600">Your browser does not seem to support HTML canvas.</canvas>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <textarea id="gcode-input" placeholder="Enter G-code here..." rows="36" cols="50"></textarea>
          <div class="spacer"></div>
          <button id="draw-button" type="button" class="counter">Draw</button>
        </div>
    </div>
</section>

`;

setupTheme(document.querySelector<HTMLButtonElement>('#theme-toggle')!);
const canvasRenderer = setupCanvasRenderer(document.querySelector<HTMLCanvasElement>('#canvas')!);
canvasRenderer.onClick((position) => {
  console.log('clicked at', position);
});

const executor = new CommandExecutor(canvasRenderer);
const parser = new CommandParser();

setupDrawButton(document.querySelector<HTMLButtonElement>('#draw-button')!, executor, parser);
