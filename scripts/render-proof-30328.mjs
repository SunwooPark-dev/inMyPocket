import fs from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import HomePage from '../src/app/page.tsx';
import PrintablePage from '../src/app/printable/page.tsx';

function loadEnv(path) {
  const text = fs.readFileSync(path, 'utf8');
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv(new URL('../.env.local', import.meta.url));

const home30328 = renderToStaticMarkup(await HomePage({ searchParams: Promise.resolve({ zip: '30328', scenario: 'base_regular_total' }) }));
const printable30328 = renderToStaticMarkup(await PrintablePage({ searchParams: Promise.resolve({ zip: '30328', scenario: 'base_regular_total' }) }));

console.log(JSON.stringify({
  home30328: {
    hasEmpty: home30328.includes("We couldn"),
    hasKroger: home30328.includes('Kroger'),
    hasBananas: home30328.includes('Bananas'),
    hasPrintableCTA: home30328.includes('Print a large-text shopping list')
  },
  printable30328: {
    hasEmpty: printable30328.includes("We couldn"),
    hasKroger: printable30328.includes('Kroger'),
    hasBananas: printable30328.includes('Bananas')
  }
}, null, 2));
