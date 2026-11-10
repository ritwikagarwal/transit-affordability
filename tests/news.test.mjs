import test from 'node:test';
import assert from 'node:assert/strict';
import {newsItems} from '../data/news.js';
import {sources} from '../data/evidence.js';

test('Every news card points to a complete, unique evidence-catalogue entry', () => {
  const evidence = new Map(sources.map(source => [source.id, source]));
  assert.equal(evidence.size, sources.length, 'Evidence source IDs must be unique');
  assert.ok(newsItems.length >= 3, 'The opening needs housing, rent and energy coverage');
  assert.equal(new Set(newsItems.map(item => item.id)).size, newsItems.length);
  for (const item of newsItems) {
    assert.ok(Array.isArray(item.officialSourceIds) && item.officialSourceIds.length > 0, item.id);
    assert.equal(new Set(item.officialSourceIds).size, item.officialSourceIds.length, item.id);
    for (const id of item.officialSourceIds) {
      const source = evidence.get(id);
      assert.ok(source, `${item.id} references missing source ${id}`);
      assert.ok(source.name && source.kind && source.note, `${id} needs a name, kind and scope note`);
      assert.equal(new URL(source.url).protocol, 'https:', `${id} needs a direct secure source URL`);
      assert.ok(!source.local, `${item.id} must reference published evidence`);
    }
  }
});

test('News cards retain publication dates, links and bounded headline quotations', () => {
  for (const item of newsItems) {
    for (const key of ['headline', 'outlet', 'topic', 'context', 'sourceScope']) {
      assert.ok(typeof item[key] === 'string' && item[key].trim(), `${item.id} needs ${key}`);
    }
    assert.match(item.published, /^\d{4}-\d{2}-\d{2}$/, `${item.id} publication date`);
    assert.equal(new Date(item.published).toISOString().slice(0, 10), item.published);
    assert.ok(Date.parse(item.published) <= Date.parse('2026-10-16T23:59:59Z'), `${item.id} postdates this snapshot`);
    assert.equal(new URL(item.url).protocol, 'https:');
    if (item.originalUrl) assert.equal(new URL(item.originalUrl).protocol, 'https:');
    assert.ok(item.headline.trim().split(/\s+/).length <= 25, `${item.id} exceeds the headline quotation limit`);
  }
});

test('New evidence entries retain their verified publisher and article identities', () => {
  const expected = new Map([
    ['rent-coverage', 'https://www.manhattanbp.nyc.gov/pix11-aug262026/'],
    ['coned-rates', 'https://dps.ny.gov/news/psc-dramatically-reduces-con-edisons-rate-request-nearly-90-percent'],
    ['coned-bill', 'https://www.coned.com/en/accounts-billing/your-bill/how-to-read-your-bill'],
    ['organism-inspiration', 'https://doi.org/10.1126/science.1177894'],
  ]);
  for (const [id, url] of expected) assert.equal(sources.find(source => source.id === id)?.url, url, id);
  const paper = sources.find(source => source.id === 'organism-inspiration');
  assert.match(paper.kind, /Science/);
  assert.equal(paper.verificationUrl, 'https://pubmed.ncbi.nlm.nih.gov/20093467/');
});
