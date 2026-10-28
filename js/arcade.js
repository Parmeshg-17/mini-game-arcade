/**
 * Mini Game Arcade - UI Controller
 * Manages game discovery, instant search, category filtering, keyboard shortcuts, and mobile navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  const gamesGrid = document.getElementById('games-grid');
  const searchInput = document.getElementById('arcade-search');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const filterPillsContainer = document.getElementById('category-filters');
  const gamesCountDisplay = document.getElementById('games-count');
  const emptyState = document.getElementById('empty-state');
  const emptyResetBtn = document.getElementById('empty-reset-btn');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mainNav = document.getElementById('main-nav');

  let activeCategory = 'All';
  let searchQuery = '';

  // 1. Initialize Category Filter Pills
  function initCategories() {
    if (!filterPillsContainer) return;
    filterPillsContainer.innerHTML = '';

    window.ARCADE_CATEGORIES.forEach((cat) => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `filter-pill ${cat === activeCategory ? 'active' : ''}`;
      pill.textContent = cat;
      pill.dataset.category = cat;

      pill.addEventListener('click', () => {
        activeCategory = cat;
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        renderGames();
      });

      filterPillsContainer.appendChild(pill);
    });
  }

  // 2. Render Games in Grid
  function renderGames() {
    if (!gamesGrid) return;

    const filtered = (window.ARCADE_GAMES || []).filter((game) => {
      // Category match
      const matchesCategory =
        activeCategory === 'All' ||
        game.category.toLowerCase() === activeCategory.toLowerCase();

      // Search match
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesSearch =
        game.title.toLowerCase().includes(query) ||
        game.description.toLowerCase().includes(query) ||
        game.tagline.toLowerCase().includes(query) ||
        (game.tags && game.tags.some(tag => tag.toLowerCase().includes(query)));

      return matchesCategory && matchesSearch;
    });

    // Update count badge
    if (gamesCountDisplay) {
      const count = filtered.length;
      gamesCountDisplay.textContent = `${count} ${count === 1 ? 'Playable Title' : 'Playable Titles'}`;
    }

    // Toggle Empty State
    if (filtered.length === 0) {
      gamesGrid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    gamesGrid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    // Build Cards HTML with Premium Editorial Layout
    gamesGrid.innerHTML = filtered.map((game) => `
      <article class="arcade-card" data-game-id="${game.id}">
        <a href="${game.route}" class="card-media-wrapper" aria-label="Play ${game.title}">
          <img src="${game.thumbnail}" alt="${game.title} original gameplay illustration" class="card-thumb" loading="lazy" />
          <div class="card-badges">
            <span class="badge-category">${game.category}</span>
            ${game.badge ? `<span class="badge-status">${game.badge}</span>` : ''}
          </div>
          <div class="card-hover-overlay">
            <span class="hover-play-pill">Play Now →</span>
          </div>
        </a>

        <div class="card-body">
          <div class="card-header-row">
            <h3 class="card-title">${game.title}</h3>
            <span class="card-session-tag">Quick Play</span>
          </div>

          <p class="card-tagline">${game.tagline}</p>
          <p class="card-description">${game.description}</p>

          <div class="card-features">
            ${(game.features || []).map(f => `<span class="feature-tag">${f}</span>`).join('')}
          </div>

          <div class="card-controls-hint">
            <span class="hint-label">CONTROLS</span>
            <span class="hint-text">${game.controlsSummary}</span>
          </div>

          <div class="card-actions">
            <a href="${game.route}" class="btn-play-game">
              <span>Play ${game.title}</span>
              <span class="play-arrow">→</span>
            </a>
          </div>
        </div>
      </article>
    `).join('');
  }

  // 3. Search Bar Handlers
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchClearBtn) {
        searchClearBtn.style.display = searchQuery ? 'flex' : 'none';
      }
      renderGames();
    });

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClearBtn.style.display = 'none';
        searchInput.focus();
        renderGames();
      });
    }

    // Keyboard shortcut: '/' to focus search, Escape to clear
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      } else if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        searchQuery = '';
        if (searchClearBtn) searchClearBtn.style.display = 'none';
        searchInput.blur();
        renderGames();
      }
    });
  }

  if (emptyResetBtn) {
    emptyResetBtn.addEventListener('click', () => {
      searchQuery = '';
      activeCategory = 'All';
      if (searchInput) {
        searchInput.value = '';
        if (searchClearBtn) searchClearBtn.style.display = 'none';
      }
      initCategories();
      renderGames();
    });
  }

  // 4. Mobile Menu Drawer
  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', () => {
      const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
      mainNav.classList.toggle('nav-open');
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('nav-open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Initial Run
  initCategories();
  renderGames();
});
