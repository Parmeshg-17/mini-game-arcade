/**
 * Memory Match — Cards Registry & Deck Generator
 * Contains 12 bespoke vector card icons and Fisher-Yates deck generation
 * for Easy (8 cards), Medium (16 cards), and Hard (24 cards) modes.
 */

(function () {
  'use strict';

  const CARD_ICONS = [
    {
      id: 'diamond',
      name: 'Diamond',
      color: '#d5ff55',
      svg: `
        <svg viewBox="0 0 48 48" class="card-icon-svg" aria-hidden="true">
          <polygon points="24,6 42,24 24,42 6,24" fill="#d5ff55" opacity="0.9" />
          <polygon points="24,14 34,24 24,34 14,24" fill="#ffffff" opacity="0.4" />
        </svg>
      `
    },
    {
      id: 'star',
      name: 'Star',
      color: '#38bdf8',
      svg: `
        <svg viewBox="0 0 48 48" class="card-icon-svg" aria-hidden="true">
          <polygon points="24,4 29,17 43,18 32,28 36,42 24,34 12,42 16,28 5,18 19,17" fill="#38bdf8" />
          <circle cx="24" cy="24" r="5" fill="#ffffff" opacity="0.5" />
        </svg>
      `
    },
    {
      id: 'heart',
      name: 'Heart',
      color: '#ff784f',
      svg: `
        <svg viewBox="0 0 48 48" class="card-icon-svg" aria-hidden="true">
          <path d="M24,40 C8,28 4,14 14,8 C20,4 24,10 24,10 C24,10 28,4 34,8 C44,14 40,28 24,40 Z" fill="#ff784f" />
        </svg>
      `
    },
    {
      id: 'bolt',
      name: 'Lightning',
      color: '#eab308',
      svg: `
        <svg viewBox="0 0 48 48" class="card-icon-svg" aria-hidden="true">
          <polygon points="26,4 12,24 24,24 20,44 36,22 24,22" fill="#eab308" />
        </svg>
      `
    },
    {
      id: 'moon',
      name: 'Crescent Moon',
      color: '#c084fc',
      svg: `
        <svg viewBox="0 0 48 48" class="card-icon-svg" aria-hidden="true">
          <path d="M28,6 C16,6 8,16 8,26 C8,36 16,42 26,42 C32,42 38,38 40,34 C26,34 18,22 24,10 C26,8 28,7 28,6 Z" fill="#c084fc" />
          <circle cx="34" cy="12" r="2" fill="#ffffff" />
        </svg>
      `
    },
    {
      id: 'planet',
      name: 'Saturn Planet',
      color: '#f43f5e',
      svg: `
        <svg viewBox="0 0 48 48" class="card-icon-svg" aria-hidden="true">
          <circle cx="24" cy="24" r="12" fill="#f43f5e" />
          <ellipse cx="24" cy="24" rx="20" ry="6" fill="none" stroke="#fecdd3" stroke-width="3" transform="rotate(-25 24 24)" />
        </svg>
      `
    },
    {
      id: 'atom',
      name: 'Atom Orbit',
      color: '#22c55e',
      svg: `
        <svg viewBox="0 0 48 48" class="card-icon-svg" aria-hidden="true">
          <circle cx="24" cy="24" r="5" fill="#22c55e" />
          <ellipse cx="24" cy="24" rx="18" ry="7" fill="none" stroke="#22c55e" stroke-width="2" />
          <ellipse cx="24" cy="24" rx="18" ry="7" fill="none" stroke="#86efac" stroke-width="2" transform="rotate(60 24 24)" />
          <ellipse cx="24" cy="24" rx="18" ry="7" fill="none" stroke="#86efac" stroke-width="2" transform="rotate(120 24 24)" />
        </svg>
      `
    },
    {
      id: 'shield',
      name: 'Aegis Shield',
      color: '#06b6d4',
      svg: `
        <svg viewBox="0 0 48 48" class="card-icon-svg" aria-hidden="true">
          <path d="M24,6 L38,12 V24 C38,34 24,42 24,42 C24,42 10,34 10,24 V12 Z" fill="#06b6d4" />
          <path d="M24,12 L32,16 V23 C32,29 24,34 24,34 V12 Z" fill="#ffffff" opacity="0.3" />
        </svg>
      `
    },
    {
      id: 'crown',
      name: 'Crown',
      color: '#f59e0b',
      svg: `
        <svg viewBox="0 0 48 48" class="card-icon-svg" aria-hidden="true">
          <polygon points="8,38 40,38 42,16 31,26 24,10 17,26 6,16" fill="#f59e0b" />
          <circle cx="24" cy="9" r="3" fill="#ffffff" />
          <circle cx="7" cy="15" r="2.5" fill="#ffffff" />
          <circle cx="41" cy="15" r="2.5" fill="#ffffff" />
        </svg>
      `
    },
    {
      id: 'crystal',
      name: 'Prism Crystal',
      color: '#818cf8',
      svg: `
        <svg viewBox="0 0 48 48" class="card-icon-svg" aria-hidden="true">
          <polygon points="24,4 38,16 34,42 14,42 10,16" fill="#818cf8" />
          <polygon points="24,4 34,42 24,34 14,42" fill="#ffffff" opacity="0.25" />
        </svg>
      `
    },
    {
      id: 'fire',
      name: 'Arcade Flame',
      color: '#f97316',
      svg: `
        <svg viewBox="0 0 48 48" class="card-icon-svg" aria-hidden="true">
          <path d="M24,4 C27,14 36,18 36,28 C36,36 30,42 24,42 C18,42 12,36 12,28 C12,20 18,14 20,8 Z" fill="#f97316" />
          <path d="M24,20 C26,24 30,26 30,32 C30,36 27,39 24,39 C21,39 18,36 18,32 C18,27 22,24 24,20 Z" fill="#fde047" />
        </svg>
      `
    },
    {
      id: 'gem',
      name: 'Faceted Gem',
      color: '#14b8a6',
      svg: `
        <svg viewBox="0 0 48 48" class="card-icon-svg" aria-hidden="true">
          <polygon points="14,8 34,8 42,18 24,42 6,18" fill="#14b8a6" />
          <polygon points="14,8 24,18 34,8" fill="#5eead4" />
          <polygon points="6,18 24,18 24,42" fill="#0f766e" />
          <polygon points="42,18 24,18 24,42" fill="#115e59" />
        </svg>
      `
    }
  ];

  // Difficulty configurations
  const DIFFICULTIES = {
    easy: {
      pairsCount: 4,
      totalCards: 8,
      gridCols: 4,
      gridRows: 2,
      label: 'Easy (4×2)',
      parMoves: 8
    },
    medium: {
      pairsCount: 8,
      totalCards: 16,
      gridCols: 4,
      gridRows: 4,
      label: 'Medium (4×4)',
      parMoves: 18
    },
    hard: {
      pairsCount: 12,
      totalCards: 24,
      gridCols: 6,
      gridRows: 4,
      label: 'Hard (6×4)',
      parMoves: 30
    }
  };

  /**
   * Generates a randomized deck for the specified difficulty mode.
   * @param {'easy' | 'medium' | 'hard'} difficulty
   * @returns {Array<{ uid: number, cardId: string, name: string, color: string, svg: string }>}
   */
  function generateDeck(difficulty = 'medium') {
    const config = DIFFICULTIES[difficulty] || DIFFICULTIES.medium;
    const count = config.pairsCount;

    // Pick first N distinct icons
    const selectedIcons = CARD_ICONS.slice(0, count);

    // Duplicate each card to create pairs
    const cards = [];
    let uid = 0;
    selectedIcons.forEach(icon => {
      // First copy
      cards.push({
        uid: uid++,
        cardId: icon.id,
        name: icon.name,
        color: icon.color,
        svg: icon.svg
      });
      // Second copy
      cards.push({
        uid: uid++,
        cardId: icon.id,
        name: icon.name,
        color: icon.color,
        svg: icon.svg
      });
    });

    // Fisher-Yates uniform shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = cards[i];
      cards[i] = cards[j];
      cards[j] = temp;
    }

    return cards;
  }

  const MemoryCards = {
    CARD_ICONS,
    DIFFICULTIES,
    generateDeck
  };

  if (typeof window !== 'undefined') {
    window.MemoryCards = MemoryCards;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryCards;
  }
})();

