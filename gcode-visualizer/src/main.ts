import './style.css';
import { setupCounter } from './counter.ts';
import { setupTheme } from './theme.ts';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<section id="header" class="panel toolbar">
    <header class="panel-header"><h1>G-CODE Visualizer</h1></header>

    <div class="spacer"></div>

    <button id="theme-toggle" class="button" type="button" style="margin-right: 8px;"></button>
</section>

<section id="center">  
  <button id="counter" type="button" class="counter"></button>
</section>

`;

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
setupTheme(document.querySelector<HTMLButtonElement>('#theme-toggle')!);
