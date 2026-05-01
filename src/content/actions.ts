export function scrollByVelocity(velocityY: number): void {
  if (velocityY === 0) return;
  window.scrollBy({ top: velocityY, behavior: 'auto' });
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
