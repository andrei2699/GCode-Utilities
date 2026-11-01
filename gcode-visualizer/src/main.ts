import './style.css';
import { setupCounter } from './counter.ts';
import { setupTheme } from './theme.ts';
import { setupCanvasRenderer } from './renderer/canvas-renderer.ts';

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

canvasRenderer.ctx.beginPath();
canvasRenderer.ctx.moveTo(100, 100);
canvasRenderer.ctx.lineTo(200, 200);
canvasRenderer.ctx.stroke();