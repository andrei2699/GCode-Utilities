export function setupTheme(themeToggle: HTMLButtonElement) {
  const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)');

  function updateThemeToggle(isDark: boolean) {
    themeToggle.textContent = `Switch to ${isDark ? 'light' : 'dark'} theme`;
    themeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  const isDarkTheme =
    localStorage.getItem('theme') === 'dark' ||
    (localStorage.getItem('theme') === null && prefersDarkTheme.matches);

  console.log(isDarkTheme);
  updateThemeToggle(isDarkTheme);

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.dataset.theme !== 'dark';
    updateThemeToggle(isDark);
  });
}
