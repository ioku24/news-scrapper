/**
 * AI News Dashboard - Application Logic
 * Handles data fetching, filtering, saving, and rendering
 * With Supabase integration (falls back to local JSON)
 */

// ============================================
// Supabase Configuration
// ============================================
const SUPABASE_URL = 'https://wllrysfrygkmbjxfqwhd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbHJ5c2ZyeWdrbWJqeGZxd2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODkxOTcsImV4cCI6MjA4NjE2NTE5N30.s5Frbz_NybxB8Ow4F7JOK9YjhB6psi75a_xNMXNx24o';

// Initialize Supabase client (safely)
let supabaseClient = null;
try {
    if (window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized');
    } else {
        console.warn('⚠️ Supabase library not loaded, using local fallback');
    }
} catch (e) {
    console.error('❌ Failed to initialize Supabase:', e);
}

// ============================================
// Configuration
// ============================================
const CONFIG = {
    FALLBACK_DATA_URL: '.tmp/articles.json',
    STORAGE_KEY: 'ai-news-saved',
    REFRESH_INTERVAL: 24 * 60 * 60 * 1000
};

// ============================================
// State Management
// ============================================
const state = {
    articles: [],
    savedIds: new Set(),
    activeFilter: 'all',
    activeSource: null,
    lastFetched: null
};

// ============================================
// DOM Elements
// ============================================
const elements = {
    articlesGrid: document.getElementById('articles-grid'),
    sourceFilters: document.getElementById('source-filters'),
    totalCount: document.getElementById('total-count'),
    newCount: document.getElementById('new-count'),
    savedCount: document.getElementById('saved-count'),
    lastUpdated: document.getElementById('last-updated'),
    navTabs: document.querySelectorAll('.nav__tab')
};

// ============================================
// Utility Functions
// ============================================

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Supabase Functions
// ============================================

async function fetchArticlesFromSupabase() {
    if (!supabaseClient) return null;

    try {
        const { data: articles, error } = await supabaseClient
            .from('articles')
            .select('*')
            .order('published_at', { ascending: false });

        if (error) throw error;

        return articles.map(a => ({
            id: a.id,
            title: a.title,
            summary: a.summary,
            url: a.url,
            thumbnail: a.thumbnail,
            source: a.source,
            sourceId: a.source_id,
            sourceIcon: a.source_icon,
            publishedAt: a.published_at,
            isNew: a.is_new
        }));
    } catch (error) {
        console.error('Supabase fetch error:', error);
        return null;
    }
}

async function fetchSavedFromSupabase() {
    if (!supabaseClient) return new Set();

    try {
        const { data, error } = await supabaseClient
            .from('saved_articles')
            .select('article_id');

        if (error) throw error;
        return new Set(data.map(item => item.article_id));
    } catch (error) {
        console.error('Error fetching saved:', error);
        return new Set();
    }
}

async function saveArticleToSupabase(articleId) {
    if (!supabaseClient) return false;

    try {
        const { error } = await supabaseClient
            .from('saved_articles')
            .insert({ article_id: articleId });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error saving article:', error);
        return false;
    }
}

async function unsaveArticleFromSupabase(articleId) {
    if (!supabaseClient) return false;

    try {
        const { error } = await supabaseClient
            .from('saved_articles')
            .delete()
            .eq('article_id', articleId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error unsaving article:', error);
        return false;
    }
}

// ============================================
// Storage Functions (LocalStorage)
// ============================================

function loadSavedArticlesLocal() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            state.savedIds = new Set(JSON.parse(saved));
        }
    } catch (e) {
        console.warn('Failed to load saved articles:', e);
    }
}

function saveSavedArticlesLocal() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify([...state.savedIds]));
    } catch (e) {
        console.warn('Failed to save articles:', e);
    }
}

async function toggleSaved(articleId) {
    const wasSaved = state.savedIds.has(articleId);

    if (wasSaved) {
        state.savedIds.delete(articleId);
        if (supabaseClient) {
            await unsaveArticleFromSupabase(articleId);
        }
    } else {
        state.savedIds.add(articleId);
        if (supabaseClient) {
            await saveArticleToSupabase(articleId);
        }
    }

    saveSavedArticlesLocal();
    updateStats();
    renderArticles();
}

// ============================================
// Data Fetching
// ============================================

async function fetchArticlesLocal() {
    try {
        const response = await fetch(CONFIG.FALLBACK_DATA_URL);
        if (!response.ok) throw new Error('Failed to fetch articles');

        const data = await response.json();
        state.lastFetched = data.fetchedAt;
        return data.articles;
    } catch (error) {
        console.error('Error fetching local articles:', error);
        return null;
    }
}

async function fetchArticles() {
    console.log('📰 Fetching articles...');

    // Try Supabase first
    if (supabaseClient) {
        console.log('  Trying Supabase...');
        const supabaseArticles = await fetchArticlesFromSupabase();
        if (supabaseArticles && supabaseArticles.length > 0) {
            console.log(`  ✅ Got ${supabaseArticles.length} articles from Supabase`);
            state.articles = supabaseArticles;
            state.lastFetched = new Date().toISOString();
            state.savedIds = await fetchSavedFromSupabase();
            return true;
        }
        console.log('  ⚠️ No articles from Supabase, trying local...');
    }

    // Fallback to local JSON
    console.log('  Trying local JSON...');
    const localArticles = await fetchArticlesLocal();
    if (localArticles && localArticles.length > 0) {
        console.log(`  ✅ Got ${localArticles.length} articles from local JSON`);
        state.articles = localArticles;
        loadSavedArticlesLocal();
        return true;
    }

    console.log('  ❌ No articles found');
    return false;
}

// ============================================
// Filtering
// ============================================

function getFilteredArticles() {
    let articles = [...state.articles];

    switch (state.activeFilter) {
        case 'new':
            articles = articles.filter(a => a.isNew);
            break;
        case 'saved':
            articles = articles.filter(a => state.savedIds.has(a.id));
            break;
    }

    if (state.activeSource) {
        articles = articles.filter(a => a.sourceId === state.activeSource);
    }

    return articles;
}

function getSources() {
    const sources = new Map();
    state.articles.forEach(article => {
        if (!sources.has(article.sourceId)) {
            sources.set(article.sourceId, {
                id: article.sourceId,
                name: article.source,
                icon: article.sourceIcon
            });
        }
    });
    return [...sources.values()];
}

// ============================================
// Rendering
// ============================================

function renderCard(article) {
    const isSaved = state.savedIds.has(article.id);
    const savedClass = isSaved ? 'card--saved' : '';
    const bookmarkClass = isSaved ? 'bookmark-btn--saved' : '';
    const bookmarkIcon = isSaved
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>';

    const imageHtml = article.thumbnail
        ? `<img src="${escapeHtml(article.thumbnail)}" alt="" loading="lazy">`
        : `<div class="card__image-placeholder">${article.sourceIcon || '📰'}</div>`;

    const badges = [];
    if (article.isNew) {
        badges.push('<span class="badge badge--new">New</span>');
    }
    badges.push(`<span class="badge badge--source">${escapeHtml(article.source)}</span>`);

    return `
    <article class="card ${savedClass}" data-id="${article.id}">
      <div class="card__image">
        ${imageHtml}
        <div class="card__badges">
          ${badges.join('')}
        </div>
      </div>
      <div class="card__content">
        <h3 class="card__title">
          <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(article.title)}
          </a>
        </h3>
        <p class="card__summary">${escapeHtml(article.summary)}</p>
        <div class="card__footer">
          <div class="card__meta">
            <span class="card__source">${article.sourceIcon || '📰'} ${escapeHtml(article.source)}</span>
            <span class="card__time">${formatRelativeTime(article.publishedAt)}</span>
          </div>
          <button class="bookmark-btn ${bookmarkClass}" 
                  onclick="toggleSaved('${article.id}')" 
                  aria-label="${isSaved ? 'Remove from saved' : 'Save article'}">
            ${bookmarkIcon}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderArticles() {
    const articles = getFilteredArticles();

    if (articles.length === 0) {
        const emptyMessage = state.activeFilter === 'saved'
            ? 'No saved articles yet. Click the bookmark icon to save articles.'
            : state.activeFilter === 'new'
                ? 'No new articles in the last 24 hours.'
                : 'No articles found. Run the feed parser to sync data.';

        const emptyIcon = state.activeFilter === 'saved' ? '📑' : '📭';

        elements.articlesGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">${emptyIcon}</div>
        <h3 class="empty-state__title">No articles</h3>
        <p class="empty-state__text">${emptyMessage}</p>
      </div>
    `;
        return;
    }

    elements.articlesGrid.innerHTML = articles.map(renderCard).join('');
}

function renderSourceFilters() {
    const sources = getSources();

    const pills = sources.map(source => {
        const activeClass = state.activeSource === source.id ? 'source-pill--active' : '';
        return `
      <button class="source-pill ${activeClass}" data-source="${source.id}">
        <span class="source-pill__icon">${source.icon || '📰'}</span>
        <span>${escapeHtml(source.name)}</span>
      </button>
    `;
    }).join('');

    const allActiveClass = state.activeSource === null ? 'source-pill--active' : '';
    elements.sourceFilters.innerHTML = `
    <button class="source-pill ${allActiveClass}" data-source="">
      <span>All Sources</span>
    </button>
    ${pills}
  `;
}

function updateStats() {
    elements.totalCount.textContent = state.articles.length;
    elements.newCount.textContent = state.articles.filter(a => a.isNew).length;
    elements.savedCount.textContent = state.savedIds.size;

    if (state.lastFetched) {
        elements.lastUpdated.textContent = formatDate(state.lastFetched);
    }
}

// ============================================
// Event Handlers
// ============================================

function handleFilterClick(e) {
    const tab = e.target.closest('.nav__tab');
    if (!tab) return;

    state.activeFilter = tab.dataset.filter;

    elements.navTabs.forEach(t => t.classList.remove('nav__tab--active'));
    tab.classList.add('nav__tab--active');

    renderArticles();
}

function handleSourceClick(e) {
    const pill = e.target.closest('.source-pill');
    if (!pill) return;

    state.activeSource = pill.dataset.source || null;

    renderSourceFilters();
    renderArticles();
}

// ============================================
// Initialization
// ============================================

async function init() {
    console.log('🚀 AI News Dashboard initializing...');

    const success = await fetchArticles();

    if (success) {
        console.log(`✅ Loaded ${state.articles.length} articles`);
        renderSourceFilters();
        renderArticles();
        updateStats();
    } else {
        elements.articlesGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <h3 class="empty-state__title">No articles found</h3>
        <p class="empty-state__text">Run: python3 tools/fetch_feeds.py</p>
      </div>
    `;
    }

    document.querySelector('.nav__tabs').addEventListener('click', handleFilterClick);
    elements.sourceFilters.addEventListener('click', handleSourceClick);
}

// Start the app
init();
