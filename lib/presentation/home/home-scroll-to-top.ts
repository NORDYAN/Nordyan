import { routes } from '@/constants/routes';

export const HOME_SCROLL_TO_TOP_PARAM = 'scrollToTop';

let pendingHomeScrollToTopVisit: string | null = null;

export function homeHrefWithScrollToTop(visit: string = String(Date.now())): {
  pathname: typeof routes.home;
  params: { [HOME_SCROLL_TO_TOP_PARAM]: string };
} {
  pendingHomeScrollToTopVisit = visit;
  return {
    pathname: routes.home,
    params: { [HOME_SCROLL_TO_TOP_PARAM]: visit },
  };
}

/**
 * One-shot Home scroll intent from Coach → "Se dagens fokus".
 * Returns true at most once per request. Normal Home tab focus does not request this.
 */
export function consumeHomeScrollToTopIntent(): boolean {
  if (pendingHomeScrollToTopVisit == null) {
    return false;
  }

  pendingHomeScrollToTopVisit = null;
  return true;
}
