import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

const FAVORITES_STORAGE_KEY = 'guitar-app-favorites'
const RECENT_STORAGE_KEY = 'guitar-app-recent'
const RECENT_LIMIT = 5

function Home() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [collapsedSections, setCollapsedSections] = useState({})
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [recent, setRecent] = useState(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  const features = [
    {
      title: 'Escalas',
      description: 'Visualize e marque escalas no braço da guitarra',
      category: 'Tecnica e Pratica',
      badge: 'Essencial',
      quick: true,
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="10" width="40" height="28" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
          <line x1="4" y1="16" x2="44" y2="16" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="4" y1="22" x2="44" y2="22" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="4" y1="28" x2="44" y2="28" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="4" y1="34" x2="44" y2="34" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="14" y1="10" x2="14" y2="38" stroke="currentColor" strokeWidth="1"/>
          <line x1="24" y1="10" x2="24" y2="38" stroke="currentColor" strokeWidth="1"/>
          <line x1="34" y1="10" x2="34" y2="38" stroke="currentColor" strokeWidth="1"/>
          <circle cx="19" cy="19" r="3" fill="#2196F3"/>
          <circle cx="29" cy="25" r="3" fill="#4CAF50"/>
          <circle cx="39" cy="31" r="3" fill="#FF9800"/>
        </svg>
      ),
      path: '/escalas',
    },
    {
      title: 'Ciclo das Quintas',
      description: 'Preencha e estude o ciclo das quintas',
      category: 'Harmonia',
      badge: 'Teoria',
      quick: false,
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="4 3"/>
          <circle cx="24" cy="4" r="3" fill="#2196F3"/>
          <circle cx="41" cy="14" r="3" fill="#4CAF50"/>
          <circle cx="41" cy="34" r="3" fill="#FF9800"/>
          <circle cx="24" cy="44" r="3" fill="#F44336"/>
          <circle cx="7" cy="34" r="3" fill="#9C27B0"/>
          <circle cx="7" cy="14" r="3" fill="#00BCD4"/>
          <text x="24" y="26" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold">V</text>
        </svg>
      ),
      path: '/ciclo-das-quintas',
    },
    {
      title: 'Campo Harmônico',
      description: 'Preencha os acordes de cada grau do campo harmônico',
      category: 'Harmonia',
      badge: 'Essencial',
      quick: false,
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="6" width="40" height="36" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
          <line x1="4" y1="14" x2="44" y2="14" stroke="currentColor" strokeWidth="2"/>
          <line x1="10" y1="6" x2="10" y2="42" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4"/>
          <line x1="16" y1="6" x2="16" y2="42" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4"/>
          <line x1="22" y1="6" x2="22" y2="42" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4"/>
          <line x1="28" y1="6" x2="28" y2="42" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4"/>
          <line x1="34" y1="6" x2="34" y2="42" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4"/>
          <line x1="40" y1="6" x2="40" y2="42" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4"/>
          <text x="7" y="12" fill="#93c5fd" fontSize="6" fontWeight="bold">I</text>
          <text x="12" y="12" fill="#93c5fd" fontSize="6" fontWeight="bold">II</text>
          <text x="19" y="12" fill="#93c5fd" fontSize="6" fontWeight="bold">III</text>
          <text x="25" y="12" fill="#93c5fd" fontSize="6" fontWeight="bold">IV</text>
          <text x="31" y="12" fill="#93c5fd" fontSize="6" fontWeight="bold">V</text>
          <text x="36" y="12" fill="#93c5fd" fontSize="6" fontWeight="bold">VI</text>
          <text x="41" y="12" fill="#93c5fd" fontSize="5" fontWeight="bold">VII</text>
          <text x="7" y="22" fill="#4CAF50" fontSize="7" fontWeight="bold">C</text>
          <text x="13" y="22" fill="#FF9800" fontSize="7" fontWeight="bold">Dm</text>
          <text x="25" y="22" fill="#2196F3" fontSize="7" fontWeight="bold">F</text>
          <text x="31" y="22" fill="#F44336" fontSize="7" fontWeight="bold">G</text>
        </svg>
      ),
      path: '/campo-harmonico',
    },
    {
      title: 'Metrônomo',
      description: 'Controle o ritmo e o andamento da sua prática',
      category: 'Ritmo',
      badge: 'Essencial',
      quick: true,
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 44L30 44L34 14L14 14Z" stroke="currentColor" strokeWidth="2" fill="none"/>
          <rect x="16" y="10" width="16" height="4" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
          <line x1="24" y1="14" x2="24" y2="38" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4"/>
          <line x1="24" y1="34" x2="34" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="24" cy="34" r="2.5" fill="#2196F3"/>
          <circle cx="24" cy="27" r="1.5" fill="#FF9800"/>
          <circle cx="24" cy="21" r="1.5" fill="#4CAF50"/>
          <rect x="20" y="4" width="8" height="6" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      ),
      path: '/metronomo',
    },
    {
      title: 'Afinador',
      description: 'Afine sua guitarra em tempo real pelo microfone',
      category: 'Tecnica e Pratica',
      badge: 'Novo',
      quick: true,
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M24 24L34 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="24" cy="24" r="3" fill="#FF9800"/>
          <line x1="24" y1="8" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="40" y1="24" x2="36" y2="24" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="24" y1="40" x2="24" y2="36" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="8" y1="24" x2="12" y2="24" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M13 34C15.5 36.5 19.2 38 24 38" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
          <path d="M35 34C32.5 36.5 28.8 38 24 38" stroke="#F44336" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      path: '/afinador',
    },
    {
      title: 'Progressões',
      description: 'Gere progressões harmônicas por tonalidade e modo',
      category: 'Harmonia',
      badge: 'Essencial',
      quick: false,
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="9" width="38" height="30" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
          <rect x="9" y="14" width="8" height="20" rx="2" fill="#2196F3"/>
          <rect x="20" y="18" width="8" height="16" rx="2" fill="#4CAF50"/>
          <rect x="31" y="12" width="8" height="22" rx="2" fill="#FF9800"/>
          <path d="M9 36L39 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      path: '/progressoes',
    },
    {
      title: 'Notas Guia',
      description: 'Veja 3ª e 7ª dos acordes para improvisar melhor',
      category: 'Harmonia',
      badge: 'Avancado',
      quick: false,
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="7" width="38" height="34" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
          <line x1="10" y1="16" x2="38" y2="16" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="10" y1="24" x2="38" y2="24" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="10" y1="32" x2="38" y2="32" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="18" cy="24" r="3" fill="#4CAF50"/>
          <circle cx="30" cy="24" r="3" fill="#FF9800"/>
          <text x="16" y="14" fill="#93c5fd" fontSize="6" fontWeight="bold">3</text>
          <text x="28" y="14" fill="#93c5fd" fontSize="6" fontWeight="bold">7</text>
        </svg>
      ),
      path: '/notas-guia',
    },
  ]

  const categoriesOrder = ['Acesso Rapido', 'Ritmo', 'Harmonia', 'Tecnica e Pratica']

  const normalizedSearch = search.trim().toLowerCase()

  const featureByPath = useMemo(() => {
    return Object.fromEntries(features.map((feature) => [feature.path, feature]))
  }, [features])

  const filteredFeatures = useMemo(() => {
    if (!normalizedSearch) {
      return features
    }

    return features.filter((feature) => {
      const searchable = `${feature.title} ${feature.description} ${feature.category}`.toLowerCase()
      return searchable.includes(normalizedSearch)
    })
  }, [features, normalizedSearch])

  const filteredPathSet = useMemo(() => {
    return new Set(filteredFeatures.map((feature) => feature.path))
  }, [filteredFeatures])

  const favoriteFeatures = useMemo(() => {
    return favorites
      .map((path) => featureByPath[path])
      .filter((feature) => feature && filteredPathSet.has(feature.path))
  }, [favorites, featureByPath, filteredPathSet])

  const recentFeatures = useMemo(() => {
    return recent
      .map((path) => featureByPath[path])
      .filter((feature) => feature && filteredPathSet.has(feature.path))
  }, [recent, featureByPath, filteredPathSet])

  const groupedFeatures = useMemo(() => {
    const map = {
      'Acesso Rapido': filteredFeatures.filter((feature) => feature.quick),
      Ritmo: filteredFeatures.filter((feature) => feature.category === 'Ritmo'),
      Harmonia: filteredFeatures.filter((feature) => feature.category === 'Harmonia'),
      'Tecnica e Pratica': filteredFeatures.filter((feature) => feature.category === 'Tecnica e Pratica'),
    }

    const sections = categoriesOrder
      .map((name) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        items: map[name] || [],
      }))
      .filter((section) => section.items.length > 0)

    if (favoriteFeatures.length > 0) {
      sections.unshift({
        id: 'favoritos',
        name: 'Favoritos',
        items: favoriteFeatures,
      })
    }

    if (recentFeatures.length > 0) {
      sections.unshift({
        id: 'recentes',
        name: 'Recentes',
        items: recentFeatures,
      })
    }

    return sections
  }, [categoriesOrder, favoriteFeatures, filteredFeatures, recentFeatures])

  const toggleSection = (sectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const toggleFavorite = (path) => {
    setFavorites((prev) => {
      const next = prev.includes(path)
        ? prev.filter((item) => item !== path)
        : [path, ...prev]

      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const openFeature = (path) => {
    navigate(path)

    setRecent((prev) => {
      const deduped = [path, ...prev.filter((item) => item !== path)]
      const next = deduped.slice(0, RECENT_LIMIT)
      window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="home">
      <header className="home-header">
        <h1>🎸 Learn Guitar App</h1>
        <p className="home-subtitle">Hub de estudos com ferramentas de ritmo, harmonia e pratica</p>

        <div className="home-search-wrap">
          <input
            type="search"
            className="home-search"
            value={search}
            placeholder="Buscar ferramenta..."
            onChange={(event) => setSearch(event.target.value)}
          />
          <span className="home-search-count">{filteredFeatures.length} ferramentas</span>
        </div>
      </header>

      {groupedFeatures.length === 0 ? (
        <div className="home-empty-state">
          <p>Nenhuma ferramenta encontrada para esta busca.</p>
        </div>
      ) : (
        <main className="hub-sections">
          {groupedFeatures.map((section) => (
            <section className="hub-section" key={section.name}>
              <div className="hub-section-header" role="button" tabIndex={0} onClick={() => toggleSection(section.id)} onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  toggleSection(section.id)
                }
              }}>
                <h2>{section.name}</h2>
                <span>{section.items.length}</span>
                <strong className={`hub-collapse-indicator ${collapsedSections[section.id] ? 'collapsed' : ''}`}>▾</strong>
              </div>

              {!collapsedSections[section.id] && (
                <div className="cards-container">
                  {section.items.map((card) => {
                    const isFavorite = favorites.includes(card.path)
                    return (
                      <article key={`${section.id}-${card.path}`} className="feature-card">
                        <div className="card-top-row">
                          <div className="card-icon">{card.icon}</div>
                          <button
                            type="button"
                            className={`card-favorite-btn ${isFavorite ? 'active' : ''}`}
                            onClick={() => toggleFavorite(card.path)}
                            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                          >
                            {isFavorite ? '★' : '☆'}
                          </button>
                        </div>

                        <button
                          type="button"
                          className="feature-card-open"
                          onClick={() => openFeature(card.path)}
                        >
                          <span className={`card-badge badge-${card.badge.toLowerCase().replace(/\s+/g, '-')}`}>
                            {card.badge}
                          </span>
                          <h3 className="card-title">{card.title}</h3>
                          <p className="card-description">{card.description}</p>
                        </button>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          ))}
        </main>
      )}

      <footer className="home-footer">
        <span>Powered by <strong>Marcelo Abrão da Silva</strong></span>
        <a href="https://github.com/masilvasql" target="_blank" rel="noopener noreferrer" className="github-link">
          <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          github.com/masilvasql
        </a>
      </footer>
    </div>
  )
}

export default Home
