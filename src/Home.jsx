?import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Star, Calendar, Flame, Swords } from 'lucide-react';
import './Home.css';

const API_BASE = 'https://shikimori.one/api';
const IMAGE_BASE = 'https://shikimori.one';

const GENRES = [
  { id: 1, name: '?�?????�??' },
  { id: 2, name: '???�?????�???�?�??????' },
  { id: 4, name: '???????�??????' },
  { id: 8, name: '?�?�?�???�' },
  { id: 10, name: '?�?????�?�?�??' },
  { id: 14, name: '???�?�???�' },
  { id: 7, name: '???????�?????�' },
  { id: 22, name: '?�?????�???�?????�' },
  { id: 24, name: '?�?�???�?�???�?????�' },
  { id: 36, name: '?????????�?????�?????????�??' },
  { id: 30, name: '???????�?�' },
  { id: 37, name: '?????�?�?�???�???�?�???�???�???????�' },
  { id: 40, name: '???????�???�???????�?�???????�' },
  { id: 41, name: '???�???�?�?�?�' },
  { id: 17, name: '?�???�???�?� ?????????????�???�' },
  { id: 5, name: '?????�?????�?�??' }
];

const getImageUrl = (anime) => {
  if (!anime || !anime.image) return null;
  const src = anime.image.original || anime.image.preview;
  if (!src || src.includes('missing')) return null;
  return `${IMAGE_BASE}${src}`;
};

const FallbackPoster = ({ anime, className }) => {
  const [imgUrl, setImgUrl] = useState(null);
  
  useEffect(() => {
    if (!anime || !anime.id) return;
    fetch(`https://api.jikan.moe/v4/anime/${anime.id}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.data && data.data.images && data.data.images.jpg.large_image_url) {
          setImgUrl(data.data.images.jpg.large_image_url);
        }
      })
      .catch(e => console.log('Jikan fallback failed:', e));
  }, [anime]);

  if (imgUrl) {
    return <img src={imgUrl} alt={anime.russian || anime.name} className={className} loading="lazy" />;
  }
  
  return (
    <div className={`css-fallback-poster ${className || ''}`} style={{ width: '100%', height: '100%' }}>
      <span className="fallback-title" style={{ fontSize: '0.8rem', opacity: 0.5 }}>?�?�???�???�???�...</span>
    </div>
  );
};

const HeroBanner = ({ animes }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!animes || animes.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [animes]);

  if (!animes || animes.length === 0) return null;

  const anime = animes[currentIndex];
  const imageUrl = getImageUrl(anime);
  const bgImage = imageUrl ? `url(${imageUrl})` : 'linear-gradient(135deg, #1f1f2e, #0a0a14)';

  return (
    <div className="hero-banner">
      <div 
        className="hero-bg" 
        style={{ background: bgImage }}
      />
      <div className="hero-overlay" />
      
      <div className="hero-content">
        <div className="hero-poster">
          {imageUrl ? (
             <img src={imageUrl} alt={anime.russian || anime.name} />
          ) : (
             <FallbackPoster anime={anime} />
          )}
        </div>
        
        <div className="hero-info">
          <h1 className="hero-title">{anime.russian || anime.name}</h1>
          
          <div className="hero-meta">
            <span className="hero-badge rating"><Star size={16} fill="currentColor" /> {anime.score || 9.0}</span>
            <span className="hero-badge age">{anime.kind ? anime.kind.toUpperCase() : '???�'}</span>
            <span className="hero-badge year"><Calendar size={16} /> {anime.aired_on ? anime.aired_on.slice(0, 4) : '?'}</span>
            <span className="hero-badge episodes">{anime.episodes || anime.episodes_aired || '?'} ?�?????�???�???�</span>
          </div>

          <p className="hero-description">?�?????�?????� ?�???????�, ?????�???�???� ?�?�?????�???�?�?? ???�?�???�?� ?????�?�?????????? ?�?�???�?�?�?�??. ???�???�?????�?� ???�?? ???�?�?? ???�???�?�?????�???�?? ?????�, ?????�???�?? ???�?????�???�?�??????, ?????�?�???? ?? ???�???�?????�?????�?� ?????????�???�???? ?????�?�?�?�.</p>
          
          <div className="hero-actions">
            <Link to={`/anime/${anime.id}`} className="btn-play-hero">
              <Play size={24} fill="currentColor" />
              ?????????�?�???�
            </Link>
          </div>
        </div>
      </div>
      
      <div className="hero-controls">
        <button onClick={() => setCurrentIndex((prev) => (prev - 1 + animes.length) % animes.length)} className="hero-btn">
          <ChevronLeft size={24} />
        </button>
        <button onClick={() => setCurrentIndex((prev) => (prev + 1) % animes.length)} className="hero-btn">
          <ChevronRight size={24} />
        </button>
      </div>
      
      <div className="hero-indicators">
        {animes.map((_, idx) => (
          <div 
            key={idx} 
            className={`indicator ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
};

const AnimeRow = ({ title, animes, icon, extraBadge }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!animes || animes.length === 0) return null;

  return (
    <div className="anime-row-container">
      <div className="row-header">
        <h2 className="row-title">{icon} {title}</h2>
        <div className="row-controls">
          <button onClick={() => scroll('left')}><ChevronLeft size={20} /></button>
          <button onClick={() => scroll('right')}><ChevronRight size={20} /></button>
        </div>
      </div>
      
      <div className="row-scroll" ref={scrollRef}>
        {animes.map(anime => {
          const imageUrl = getImageUrl(anime);
          return (
            <Link to={`/anime/${anime.id}`} key={anime.id} className="row-card">
              <div className="row-card-poster">
                {imageUrl ? (
                  <img src={imageUrl} alt={anime.russian || anime.name} loading="lazy" />
                ) : (
                  <FallbackPoster anime={anime} />
                )}
                <div className="row-card-overlay">
                  <Play size={40} className="overlay-play" fill="rgba(255,255,255,0.8)" />
                </div>
              {anime.episodes_aired > 0 && (
                <div className="row-card-badge">?�??. {anime.episodes_aired}</div>
              )}
              {extraBadge && (
                <div className="row-card-hq-badge">{extraBadge}</div>
              )}
            </div>
            <div className="row-card-title">{anime.russian || anime.name}</div>
          </Link>
          );
        })}
      </div>
    </div>
  );
};

const Home = () => {
  const [topRated, setTopRated] = useState([]);
  const [latest, setLatest] = useState([]);
  const [actionAnimes, setActionAnimes] = useState([]);
  const [hqAnimes, setHqAnimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topRes, latestRes, actionRes, hqRes] = await Promise.all([
          fetch(`${API_BASE}/animes?limit=6&order=popularity`).then(r => r.json()),
          fetch(`${API_BASE}/animes?limit=15&order=status&status=ongoing`).then(r => r.json()),
          fetch(`${API_BASE}/animes?genre=1&limit=15&order=popularity`).then(r => r.json()),
          fetch(`${API_BASE}/animes?limit=15&order=ranked&year=2023,2024`).then(r => r.json())
        ]);
        
        setTopRated(topRes || []);
        setLatest(latestRes || []);
        setActionAnimes(actionRes || []);
        setHqAnimes(hqRes || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{textAlign: 'center', padding: '10rem 0', color: 'var(--accent-color)', fontSize: '1.5rem', fontWeight: 'bold'}}>
        ?�?�???�???�???� ?�?�?�?� ?�???????�...
      </div>
    );
  }

  return (
    <div className="home-container" style={{padding: '0', gap: '0'}}>
      <HeroBanner animes={topRated} />
      
      <div style={{padding: '2rem 5%', display: 'flex', flexDirection: 'column', gap: '3rem'}}>
        <AnimeRow title="?� ?�?�?????????? ?????�?�?????�?�" animes={hqAnimes} icon={<Star size={32} color="#ffd700" />} extraBadge="1080p | 4K" />
        <AnimeRow title="?????�????????" animes={latest} icon={<Flame size={32} color="var(--accent-color)" />} />
        <AnimeRow title="?????????�???�???�?� ?�?????�??" animes={actionAnimes} icon={<Swords size={32} color="var(--accent-color)" />} />
        
        <div className="home-genres-section" style={{marginTop: '2rem'}}>
          <h2 style={{color: 'white', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '800'}}>
            ?????????�???�???�?� ?�?????�?�
          </h2>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px'}}>
            {GENRES.map(g => (
              <Link 
                to={`/catalog?genre=${g.id}`} 
                key={g.id}
                style={{
                  padding: '12px 25px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', 
                  borderRadius: '12px', color: 'white', textDecoration: 'none', fontWeight: 'bold',
                  transition: 'all 0.3s ease', flexGrow: 1, textAlign: 'center', minWidth: '150px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--accent-color)'; e.currentTarget.style.color = '#000'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {g.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
