export interface NavigationItem {
  buttonSelector: string;
  targetUrl: string;
  contentSelector: string;
  isDefaultRoute?: boolean;
}

export function setupNavigationButtons(navItems: NavigationItem[]) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');

  function showPage(targetUrl: string) {
    navItems.forEach((item) => {
      const contentElement = document.querySelector(item.contentSelector) as HTMLElement | null;
      if (contentElement) {
        contentElement.style.display = item.targetUrl === targetUrl ? 'block' : 'none';
      }
    });
  }

  function resolveActive(): string {
    const path = window.location.pathname;
    const matched = navItems.find((item) => path === `${base}${item.targetUrl}`);
    if (matched) return matched.targetUrl;
    const defaultItem = navItems.find((item) => item.isDefaultRoute);
    return defaultItem?.targetUrl ?? navItems[0].targetUrl;
  }

  showPage(resolveActive());

  navItems.forEach((item) => {
    const button = document.querySelector(item.buttonSelector) as HTMLButtonElement | null;
    button?.addEventListener('click', () => {
      history.pushState(null, '', `${base}${item.targetUrl}`);
      showPage(item.targetUrl);
    });
  });

  window.addEventListener('popstate', () => {
    showPage(resolveActive());
  });
}
