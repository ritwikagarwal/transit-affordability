// Opening news cards. Exact, short headlines with dates and source links.
// Verified on 2026-10-16. Only headlines are quoted. Context is paraphrased.
// These are typographic references, not screenshots or reproductions of articles.
export const newsItems = [
  {
    id: 'news-vacancy',
    headline: 'City housing vacancy rate drops to 1.4%, lowest since 1968',
    outlet: 'Spectrum News NY1',
    published: '2024-02-08',
    url: 'https://ny1.com/nyc/all-boroughs/housing/2024/02/09/city-housing-vacancy-rate-drops-to-1-4-',
    topic: 'Housing shortage',
    context: 'The 2023 Housing and Vacancy Survey found a 1.41% net rental vacancy rate across New York City.',
    officialSourceIds: ['hvs'],
    sourceScope: 'Published in February 2024, using 2023 survey data. The estimate is historical, not a measurement of vacancy today.',
  },
  {
    id: 'news-rents',
    headline: 'NYC leaders push for housing reforms as rents continue to rise',
    outlet: 'PIX11 News',
    published: '2026-08-26',
    url: 'https://www.manhattanbp.nyc.gov/pix11-aug262026/',
    originalUrl: 'https://pix11.com/news/local-news/nyc-leaders-push-for-housing-reforms-as-rents-continue-to-rise/',
    topic: 'Rising rents',
    context: 'The report describes rising market rents in Manhattan and Brooklyn and the difficulty of finding a home at a reasonable price.',
    officialSourceIds: ['rent-coverage'],
    sourceScope: 'PIX11 coverage reproduced by the Manhattan Borough President. Its Corcoran market sample does not represent every NYC lease. Rent-stabilized renewals follow separate rules.',
  },
  {
    id: 'news-energy',
    headline: 'Con Ed bills are going up as regulators approve a rate hike',
    outlet: 'Gothamist / WNYC',
    published: '2026-01-22',
    url: 'https://gothamist.com/news/con-ed-bills-are-going-up-as-regulators-approve-a-rate-hike',
    topic: 'Energy bills',
    context: 'State regulators approved Con Edison electric and gas delivery rate plans for 2026 to 2028.',
    officialSourceIds: ['coned-rates', 'coned-bill'],
    sourceScope: 'Approved January 22, 2026, after a reduction from the original proposal. Delivery is one part of a bill. Total bills also depend on use, supply charges and taxes.',
  },
];
