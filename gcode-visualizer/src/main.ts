import './style.css';
import { setupTheme } from './theme.ts';
import { setupCanvasRenderer } from './renderer/canvas-renderer.ts';
import { CommandExecutor } from './commands/command-executor.ts';
import { setupDrawButton } from './drawer.ts';
import { CommandParser } from './commands/command-parser.ts';
import { setupNavigationButtons } from './navigation.ts';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<section id="header" class="panel toolbar">
    <header class="panel-header"><h1>G-CODE Visualizer</h1></header>
    <button id="plotter-button" class="button" type="button">Plotter</button>
    <button id="svg-to-gcode-button" class="button" type="button">SVG To G-code</button>

    <div class="spacer"></div>

    <button id="theme-toggle" class="button" type="button" style="margin-right: 8px;" />
</section>

<section id="center">

    <div id="plotter" class="panel" >
        <div class="panel-title" style="margin-top: 16px"><h1>Plotter</h1></div>
        
        <div class="panel-body" style="display: flex; flex-direction: row; gap: 16px; align-items: flex-start; padding: 16px;">
          <canvas id="canvas" width="800" height="600">Your browser does not seem to support HTML canvas.</canvas>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <textarea id="gcode-input-plotter" placeholder="Enter G-code here..." rows="36" cols="50"></textarea>
            <div class="spacer"></div>
            <button id="draw-button" type="button" class="counter">Draw</button>
          </div>
        </div>
    </div>
    
    <div id="svg-to-gcode" class="panel" >
        <div class="panel-title" style="margin-top: 16px"><h1>SVG To G-code</h1></div>
        
        <div class="panel-body" style="display: flex; flex-direction: row; gap: 16px; align-items: flex-start; padding: 16px;">
          <textarea id="svg-input-svg-to-gcode" placeholder="Enter SVG here..." rows="36" cols="80"></textarea>
         
          <textarea id="gcode-input-svg-to-gcode" placeholder="Enter G-code here..." rows="36" cols="80"></textarea>
        </div>
    </div>
</section>

`;

setupTheme(document.querySelector<HTMLButtonElement>('#theme-toggle')!);
setupNavigationButtons([
  {
    targetUrl: '/plotter',
    buttonSelector: '#plotter-button',
    contentSelector: '#plotter',
    isDefaultRoute: true,
  },
  {
    targetUrl: '/svg-to-gcode',
    buttonSelector: '#svg-to-gcode-button',
    contentSelector: '#svg-to-gcode',
  },
]);

const canvasRenderer = setupCanvasRenderer(document.querySelector<HTMLCanvasElement>('#canvas')!);
canvasRenderer.onClick((position) => {
  console.log('clicked at', position);
});

const executor = new CommandExecutor(canvasRenderer);
const parser = new CommandParser();

setupDrawButton(
  document.querySelector<HTMLButtonElement>('#draw-button')!,
  document.querySelector<HTMLTextAreaElement>('#gcode-input-plotter')!,
  executor,
  parser,
);
