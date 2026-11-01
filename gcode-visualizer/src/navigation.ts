export interface NavigationItem {
  buttonSelector: string;
  targetUrl: string;
  contentSelector: string;
  isDefaultRoute?: boolean;
}

export function setupNavigationButtons(navItems: NavigationItem[]) {
  const currentPath = window.location.pathname;
  const matchedItem = navItems.find(
    (item) => item.targetUrl === currentPath || (item.isDefaultRoute && currentPath === '/'),
  );

  navItems.forEach((item) => {
    const contentElement = document.querySelector(item.contentSelector) as HTMLElement;
    if (contentElement) {
      contentElement.style.display = matchedItem === item ? 'block' : 'none';
    }
  });

  navItems.forEach((item) => {
    const button = document.querySelector(item.buttonSelector) as HTMLButtonElement;

    button.addEventListener('click', () => {
      window.location.href = item.targetUrl;
    });
  });
}
