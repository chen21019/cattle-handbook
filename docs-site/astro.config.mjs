import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://chen21019.github.io/cattle-handbook',
  integrations: [
    starlight({
      title: 'Cattle 維護手冊',
      description: 'Rancher 1.6 繁體中文維護手冊，提供人類工程師與 AI Agent 使用。',
      locales: {
        root: {
          label: '繁體中文',
          lang: 'zh-TW'
        },
        en: {
          label: 'English',
          lang: 'en'
        }
      },
      defaultLocale: 'root',
      logo: {
        src: './public/assets/cattle-chan.png',
        alt: 'Cattle 維護手冊原創櫻花系維護妹子'
      },
      customCss: ['./src/styles/sakura-theme.css'],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/chen21019/cattle-handbook'
        }
      ],
      editLink: {
        baseUrl: 'https://github.com/chen21019/cattle-handbook/edit/main/docs-site/'
      },
      sidebar: [
        { label: '總覽', autogenerate: { directory: 'overview' } },
        { label: '開始維護', autogenerate: { directory: 'getting-started' } },
        { label: '架構', autogenerate: { directory: 'architecture' } },
        { label: '建置與測試', autogenerate: { directory: 'build-and-test' } },
        { label: '升級', items: [{ label: '依賴升級 Runbook', slug: 'runbooks/dependency-upgrade' }] },
        { label: '安全', autogenerate: { directory: 'security' } },
        { label: 'AI 維護指南', autogenerate: { directory: 'ai-guide' } },
        { label: 'Runbooks', autogenerate: { directory: 'runbooks' } },
        { label: 'API 地圖', autogenerate: { directory: 'api-map' } },
        { label: '依賴地圖', autogenerate: { directory: 'dependency-map' } },
        { label: '搜尋', autogenerate: { directory: 'search' } },
        { label: '文件站維護', autogenerate: { directory: 'site-maintenance' } },
        { label: '變更紀錄', autogenerate: { directory: 'changelog' } }
      ]
    })
  ]
});
