import './style.css';
import { setupCounter } from './counter.ts';
import { setupTheme } from './theme.ts';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<section id="header" class="panel toolbar">
    <header class="panel-header"><h1>G-CODE Visualizer</h1></header>

    <div class="spacer"></div>

    <button id="theme-toggle" class="button" type="button"></button>

</section>

<section id="center">  
<section class="panel">
  <header class="panel-header">
    <h2 class="panel-title">Print settings</h2>
    <span class="status status-ready">Ready</span>
  </header>
  <div class="panel-body">
    <label class="field-stack">
      <span class="label">Layer height</span>
      <input class="field" value="0.2 mm" />
    </label>
    <button class="button button-primary" type="button">Apply</button>
  </div>
</section>
  </div>
  <div>
    <h1>Get started</h1>
    <p>Edit <code>src/main.ts</code> and save to test <code>HMR</code></p>
  </div>
  <button id="counter" type="button" class="counter"></button>
</section>

`;

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);

setupTheme('#theme-toggle');
