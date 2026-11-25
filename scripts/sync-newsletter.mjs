// Pull the Down the Stack issue list from beehiiv's RSS feed into newsletter.json.
// The site build renders from that committed file; `pnpm run deploy` re-syncs first.
import { writeFile } from 'node:fs/promises';
import process from 'node:process';

export const FEED_URL = 'https://rss.beehiiv.com/feeds/Ux1gKYEnnD.xml';
const ISSUE_URL_PREFIX = 'https://downthestack.beehiiv.com/p/';

const decode = (text) => text
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .trim();

export function parseFeed(xml) {
  const issues = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
    const field = (name) => {
      const match = item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
      if (!match) throw new Error(`Feed item is missing <${name}>`);
      return decode(match[1]);
    };
    const heading = field('title').match(/^Down the Stack #(\d+):\s*(.+)$/);
    if (!heading) throw new Error(`Unexpected issue title: ${field('title')}`);
    const url = field('link');
    if (!url.startsWith(ISSUE_URL_PREFIX)) throw new Error(`Unexpected issue link: ${url}`);
    const published = new Date(field('pubDate'));
    if (Number.isNaN(published.getTime())) throw new Error(`Invalid pubDate for ${url}`);
    return { number: Number(heading[1]), title: heading[2], summary: field('description'), url, published: published.toISOString().slice(0, 10) };
  });
  if (issues.length === 0) throw new Error('The feed has no issues');
  return issues.sort((a, b) => b.number - a.number);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const response = await fetch(FEED_URL);
  if (!response.ok) throw new Error(`Feed request failed with HTTP ${response.status}`);
  const issues = parseFeed(await response.text());
  await writeFile('newsletter.json', `${JSON.stringify(issues, null, 2)}\n`);
  console.log(`newsletter.json: ${issues.length} issues, latest #${issues[0].number}`);
}
