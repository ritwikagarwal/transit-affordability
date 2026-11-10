import {routePresentation} from '../transit/routes.js';
import {escapeHTML as esc} from './dom.js';

export function routeBadge(id, routes, interactive=false) {
  const route=routePresentation(id,routes);
  const tag=interactive?'button':'span';
  const click=interactive?` data-route="${esc(route.id)}"`:'';
  return `<${tag}${click} class="route-badge ${route.shape}" style="--route:${route.color};--route-text:${route.textColor}" aria-label="${esc(route.accessibleName)}" title="${esc(route.accessibleName)}"><span>${esc(route.label)}</span></${tag}>`;
}

export function routeBadges(ids, routes) {
  return `<div class="route-badges">${ids.map(id=>routeBadge(id,routes)).join('')}</div>`;
}
