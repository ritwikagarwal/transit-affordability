import {newsItems} from '../data/news.js';
import {$,escapeHTML as esc} from './dom.js';

export function renderNews(){
  $('#news-panel').innerHTML=`<div class="news-heading">In the news <span>Selected coverage</span></div><div class="news-clippings">${newsItems.map(item=>`
    <article class="news-clipping"><div class="news-meta"><b>${esc(item.outlet)}</b><time datetime="${esc(item.published)}">${esc(item.published)}</time></div><h2><a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.headline)} <span>↗</span></a></h2><p>${esc(item.context)}</p><small>${esc(item.sourceScope)}</small></article>`).join('')}</div>`;
}
