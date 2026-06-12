import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Play } from 'lucide-react';

const API_BASE = 'https://shikimori.one/api';
const IMAGE_BASE = 'https://shikimori.one';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const genreQuery = searchParams.get('genre') || '';
  
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCatalog = async (currentPage, query) => {
    setLoading(true);
    try {
      let url = `${API_BASE}/animes?limit=24&page=${currentPage}`;
      if (query) {
        url += `&search=${encodeURIComponent(query)}`;
      } else if (genreQuery) {
        url += `&genre=${genreQuery}&order=popularity`;
      } else {
        url += `&order=popularity`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      setAnimes(data || []);
      setTotalPages(data.length === 24 ? currentPage + 1 : currentPage);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery, genreQuery]);

  useEffect(() => {
    fetchCatalog(page, searchQuery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, searchQuery, genreQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const q = formData.get('q');
    setPage(1);
    setSearchParams(q ? { search: q } : {});
  };

  return (
    <div className="catalog-container" style={{ padding: '2rem 5%' }}>
      <div className="catalog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: '#fff', margin: 0 }}>
          {searchQuery ? `Результаты поиска: "${searchQuery}"` : genreQuery ? `Аниме по жанру` : 'Популярные аниме'}
        </h1>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="search-bar" style={{ width: '300px' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input 
              name="q"
              type="text" 
              className="search-input" 
              placeholder="Поиск аниме..."
              defaultValue={searchQuery}
              style={{ width: '100%' }}
            />
          </div>
          <button type="submit" style={{ background: 'var(--accent-gradient)', color: '#fff', border: 'none', padding: '0 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Искать
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--accent-color)', fontSize: '1.5rem', fontWeight: 'bold' }}>
          Загрузка из базы AniLibria...
        </div>
      ) : animes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          Ничего не найдено. Попробуйте изменить фильтры.
        </div>
      ) : (
        <>
          <div className="anime-grid">
            {animes.map(anime => {
              const src = anime.image?.original || anime.image?.preview;
              const imageUrl = src && !src.includes('missing') ? `${IMAGE_BASE}${src}` : 'https://placehold.co/225x350/11111a/00f0ff?text=NO+IMAGE';
              
              return (
                <Link to={`/anime/${anime.id}`} key={anime.id} className="row-card" style={{ width: '100%' }}>
                  <div className="row-card-poster">
                    <img src={imageUrl} alt={anime.russian || anime.name} loading="lazy" />
                    <div className="row-card-overlay">
                      <Play size={40} className="overlay-play" fill="rgba(255,255,255,0.8)" />
                    </div>
                    {anime.kind && (
                      <div className="row-card-badge" style={{ left: '10px', right: 'auto', background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                        {anime.kind.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="row-card-title">{anime.russian || anime.name}</div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem' }}>
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'var(--bg-surface)', color: '#fff', border: '1px solid var(--border-color)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
              >
                Назад
              </button>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                Страница {page} из {totalPages}
              </span>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'var(--bg-surface)', color: '#fff', border: '1px solid var(--border-color)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
              >
                Вперед
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Catalog;
