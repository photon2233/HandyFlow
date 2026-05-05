export function scrollByVelocity(velocityY: number): void {
  if (velocityY === 0) return;
  const target = findScrollTarget(velocityY);
  if (target) target.scrollBy({ top: velocityY, behavior: 'auto' });
}

// Walks up from the viewport center to find the deepest element that
// (a) has overflow-y: auto/scroll, (b) actually overflows, and (c) can still
// scroll in the requested direction. Falls back to the document scroller.
// Handles both classic pages and SPA-style internal-container layouts (ChatGPT,
// Slack, Notion, Twitter, Gmail, Linear, …) without site-specific code.
function findScrollTarget(velocityY: number): Element | null {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  let el: Element | null = document.elementFromPoint(cx, cy);

  while (el) {
    const overflowY = getComputedStyle(el).overflowY;
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      el.scrollHeight > el.clientHeight &&
      canScroll(el, velocityY)
    ) {
      return el;
    }
    el = el.parentElement;
  }

  const root = document.scrollingElement as Element | null;
  if (root && root.scrollHeight > root.clientHeight && canScroll(root, velocityY)) {
    return root;
  }
  return null;
}

function canScroll(el: Element, velocityY: number): boolean {
  if (velocityY > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
  return el.scrollTop > 0;
}

export function togglePrimaryVideo(): void {
  const candidates = Array.from(document.querySelectorAll('video')).filter((v) => {
    const rect = v.getBoundingClientRect();
    return rect.width >= 200 && rect.height >= 120;
  });
  if (candidates.length === 0) return;
  const visible =
    candidates.find((v) => {
      const r = v.getBoundingClientRect();
      return (
        r.top >= 0 &&
        r.left >= 0 &&
        r.bottom <= window.innerHeight &&
        r.right <= window.innerWidth
      );
    }) ?? candidates[0];
  if (visible.paused) {
    visible.play().catch(() => {
      /* autoplay policies may block — user gesture required */
    });
  } else {
    visible.pause();
  }
}
