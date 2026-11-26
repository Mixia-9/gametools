import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.gametools.info',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-CN', 'zh-TW', 'ja'],
    routing: { prefixDefaultLocale: false },
  },
  // 游戏页与“找工具”无关，不放进站点地图
  integrations: [sitemap({ filter: (page) => !/\/play\/?$/.test(page) })],
  vite: {
    plugins: [tailwindcss()],
  },
});
