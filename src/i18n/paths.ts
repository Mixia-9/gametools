import tools from '../data/tools.json';
import categories from '../data/categories.json';
import type { Locale } from './ui';

export function toolSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** 工具是否属于某分类：主分类 + 附加分类（categories 数组，含主分类） */
export function inCategory(tool: { category: string; categories?: string[] }, slug: string): boolean {
  return (tool.categories ?? [tool.category]).includes(slug);
}

/** 专为游戏设计的工具（focus === 'game'）排前面，组内保持原有顺序 */
export function gameFirst<T extends { focus?: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => Number(b.focus === 'game') - Number(a.focus === 'game'));
}

type PathEntry = { params: Record<string, string>; props: Record<string, unknown> };

export function categoryPaths(): PathEntry[] {
  return categories.map((cat) => ({ params: { slug: cat.slug }, props: { cat } }));
}

export function toolPaths(): PathEntry[] {
  return (tools as any[]).map((tool) => ({ params: { slug: toolSlug(tool.name) }, props: { tool } }));
}

export const NON_DEFAULT_LOCALES: Locale[] = ['zh-CN', 'zh-TW', 'ja'];

/** 把某组静态路径 × 多语言展开（用于 /{locale}/... 动态路由） */
export function localized(paths: () => PathEntry[]): PathEntry[] {
  return NON_DEFAULT_LOCALES.flatMap((locale) =>
    paths().map(({ params, props }) => ({ params: { ...params, locale }, props: { ...props, locale } }))
  );
}

/** 非动态路由页（index/submit/about）的多语言路径 */
export function localeOnlyPaths(): PathEntry[] {
  return NON_DEFAULT_LOCALES.map((locale) => ({ params: { locale }, props: { locale } }));
}
