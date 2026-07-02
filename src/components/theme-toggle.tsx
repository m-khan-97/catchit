"use client";

/**
 * Toggles `data-theme="light"` on <html> (dark is the absence of the
 * attribute) and persists the choice. The icon is pure CSS (see
 * .theme-icon-* in globals.css) so there's no client state to sync with
 * the data-theme attribute the no-flash script in layout.tsx sets before
 * paint — the toggle only reads/writes the DOM imperatively on click.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const isLight = root.getAttribute("data-theme") === "light";
    if (isLight) {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", "light");
    }
    try {
      localStorage.setItem("catchit-theme", isLight ? "dark" : "light");
    } catch {
      // localStorage can throw in private-browsing/blocked-storage contexts;
      // the toggle still works for the rest of the session.
    }
  }

  return (
    <button
      onClick={toggle}
      title="Toggle theme"
      aria-label="Toggle theme"
      className="ml-1.5 flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-[15px] text-ink"
    >
      <span className="theme-icon-dark">☀</span>
      <span className="theme-icon-light">☾</span>
    </button>
  );
}
