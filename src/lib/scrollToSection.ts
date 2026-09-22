export const scrollToSection = (id: string, smooth = true) => {
  const el = document.getElementById(id);
  if (!el) return false;

  // Dynamically calculate header height to avoid magic number gaps
  const header = document.querySelector('header');
  const headerH = header ? header.getBoundingClientRect().height : 64;

  // Also subtract the section's own top padding so the heading lands flush
  // against the bottom of the sticky header (not the invisible box edge).
  const paddingTop = parseFloat(getComputedStyle(el).paddingTop) || 0;

  const top = el.getBoundingClientRect().top + window.scrollY - headerH - paddingTop;
  window.scrollTo({ top: Math.max(top, 0), behavior: smooth ? 'smooth' : 'auto' });
  return true;
};
