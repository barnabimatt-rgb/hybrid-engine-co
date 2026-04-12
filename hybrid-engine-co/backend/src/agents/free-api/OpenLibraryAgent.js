// OpenLibraryAgent — Book data for data science / fitness reading lists
// API: https://openlibrary.org  |  Auth: NONE  |  Rate: unlimited  |  Format: JSON
import FreeApiBase from './FreeApiBase.js';

export class OpenLibraryAgent extends FreeApiBase {
  constructor() {
    super('OpenLibraryAgent', {
      baseUrl: 'https://openlibrary.org',
      authMethod: 'none',
      rateLimit: 100,
      timeoutMs: 10000,
      category: 'education',
    });
  }

  healthEndpoint() { return '/search.json?q=python&limit=1'; }

  async execute(context) {
    this.log.info('Fetching book recommendations');
    const query = context.bookQuery || context.topic || 'data science fitness';

    return this.executeWithFallback(context, async () => {
      return this.apiFetch('/search.json', { q: query, limit: 10, fields: 'key,title,author_name,first_publish_year,subject,cover_i,number_of_pages_median,ratings_average' });
    });
  }

  transform(raw) {
    const books = (raw.docs || []).map((b) => ({
      key: b.key, title: b.title,
      authors: b.author_name || [],
      year: b.first_publish_year,
      subjects: (b.subject || []).slice(0, 5),
      pages: b.number_of_pages_median,
      rating: b.ratings_average,
      cover: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null,
    }));
    return { books, count: books.length, source: this.name, fetchedAt: new Date().toISOString() };
  }

  getFallbackData() {
    return {
      books: [
        { title: 'Python for Data Analysis', authors: ['Wes McKinney'], year: 2017 },
        { title: 'Atomic Habits', authors: ['James Clear'], year: 2018 },
      ],
      count: 2, source: this.name, fallback: true, fetchedAt: new Date().toISOString(),
    };
  }
}
export default OpenLibraryAgent;
