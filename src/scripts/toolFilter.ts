/**
 * 列表页的“只看专为游戏”筛选开关。
 * 卡片带 data-focus="game" | "general"；点击后切换按钮状态并调用 onChange，由页面决定隐藏哪些卡片。
 */
const IDLE = ['border-edge', 'bg-card', 'text-ink-muted'];
const PRESSED = ['border-violet-500/60', 'bg-violet-500/10', 'text-violet-700', 'dark:text-violet-400'];

export function isGameOnly(): boolean {
  return document.getElementById('game-filter')?.getAttribute('aria-pressed') === 'true';
}

export function setupGameFilter(onChange: () => void) {
  const btn = document.getElementById('game-filter');
  btn?.addEventListener('click', () => {
    const on = !isGameOnly();
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.remove(...(on ? IDLE : PRESSED));
    btn.classList.add(...(on ? PRESSED : IDLE));
    onChange();
  });
}
