import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { PlayCircle, Library, FolderHeart, Users, Shuffle, Radio, Search, Crown, LogIn, Activity, Home, Star, Play, Menu, X, Volume2, VolumeX } from 'lucide-react';
import './Layout.css';

const API_BASE = 'https://shikimori.one/api';
const IMAGE_BASE = 'https://shikimori.one';

const Particles = React.memo(() => {
  const orbs = React.useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      left: `${Math.random() * 100}vw`,
      top: `${Math.random() * 100}vh`,
      width: `${50 + Math.random() * 150}px`,
      height: `${50 + Math.random() * 150}px`,
      background: Math.random() > 0.5 ? 'var(--accent-color)' : 'var(--accent-alt)',
      animationDelay: `-${Math.random() * 20}s`,
      animationDuration: `${15 + Math.random() * 15}s`
    }));
  }, []);

  return (
    <div className="particles">
      {orbs.map((style, i) => (
        <div key={i} className="orb" style={style} />
      ))}
    </div>
  );
});

const Layout = () => {
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Radio State
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const audioRef = useRef(new Audio('https://listen.moe/stream'));
  
  // Sound Effects
  const playHoverSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch(e){}
  };

  const playClickSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch(e){}
  };

  // Add event listeners for sounds to buttons and links
  useEffect(() => {
    const handleMouseOver = (e) => {
      if (e.target.closest('button') || e.target.closest('a')) {
        playHoverSound();
      }
    };
    const handleClick = (e) => {
      if (e.target.closest('button') || e.target.closest('a')) {
        playClickSound();
      }
    };
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('click', handleClick);
    }
  }, []);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('neoanime_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // login | register
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');

  const searchRef = useRef(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const placeholders = [
    'Найти аниме...',
    'Что посмотрим?',
    'Название или жанр',
    'Случайный тайтл',
    'Новинки сезона'
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        setFade(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data);
        localStorage.setItem('neoanime_user', JSON.stringify(data));
        setShowAuthModal(false);
        showToast(authMode === 'login' ? 'Успешный вход' : 'Регистрация успешна');
      } else {
        setAuthError(data.error || 'Ошибка авторизации');
      }
    } catch (err) {
      setAuthError('Ошибка подключения к серверу');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('neoanime_user');
    showToast('Вы вышли из профиля');
    if (location.pathname.startsWith('/profile')) {
      navigate('/');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const timer = setTimeout(() => {
        fetch(`${API_BASE}/animes?search=${encodeURIComponent(searchQuery.trim())}&limit=5`)
          .then(r => r.json())
          .then(data => setSearchResults(data || []))
          .catch(e => console.error(e));
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
      setSearchQuery('');
    }
  };

  const handleRandomAnime = async () => {
    showToast('Ищем случайное аниме...');
    try {
      const res = await fetch(`${API_BASE}/animes?order=random&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setIsSidebarOpen(false);
        navigate(`/anime/${data[0].id}`);
      }
    } catch (e) {
      showToast('Не удалось загрузить');
    }
  };

  const toggleRadio = () => {
    if (isRadioPlaying) {
      audioRef.current.pause();
      setIsRadioPlaying(false);
      showToast('Радио выключено');
    } else {
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(e => showToast('Ошибка воспроизведения'));
      setIsRadioPlaying(true);
      showToast('Радио Listen.moe включено!');
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-container">
      <Particles />
      
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <Activity color="var(--accent-color)" />
            <span style={{fontWeight: 'bold'}}>{toast}</span>
          </div>
        </div>
      )}

      {/* OVERLAY */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar-nav ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo" onClick={() => setIsSidebarOpen(false)}>
            <span>NEO</span>ANIME
          </Link>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="sidebar-title">Меню</div>
        <div className="sidebar-menu">
          <Link to="/" className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
            <Home size={20} /> Главная
          </Link>
          <Link to="/catalog" className={`sidebar-link ${location.pathname.includes('/catalog') ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
            <Library size={20} /> Каталог
          </Link>
          <Link to="/collections" className="sidebar-link" onClick={() => setIsSidebarOpen(false)}>
            <FolderHeart size={20} /> Коллекции
          </Link>
          <Link to="/lobbies" className="sidebar-link" onClick={() => setIsSidebarOpen(false)}>
            <Users size={20} /> Совместный просмотр
          </Link>
          <button className="sidebar-link" onClick={handleRandomAnime}>
            <Shuffle size={20} /> Случайное
          </button>
          <button className="sidebar-link" onClick={toggleRadio} style={{color: isRadioPlaying ? 'var(--accent-color)' : 'inherit'}}>
            {isRadioPlaying ? <Volume2 size={20} /> : <Radio size={20} />} Радио
          </button>
        </div>

        <div className="sidebar-title">Жанры</div>
        <div className="sidebar-menu">
           <Link to="/catalog?genre=1" className="sidebar-link" onClick={() => setIsSidebarOpen(false)}>Экшен</Link>
           <Link to="/catalog?genre=4" className="sidebar-link" onClick={() => setIsSidebarOpen(false)}>Комедия</Link>
           <Link to="/catalog?genre=22" className="sidebar-link" onClick={() => setIsSidebarOpen(false)}>Романтика</Link>
           <Link to="/catalog?genre=10" className="sidebar-link" onClick={() => setIsSidebarOpen(false)}>Фэнтези</Link>
           <Link to="/catalog?genre=8" className="sidebar-link" onClick={() => setIsSidebarOpen(false)}>Драма</Link>
           <Link to="/catalog?genre=7" className="sidebar-link" onClick={() => setIsSidebarOpen(false)}>Мистика</Link>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="main-wrapper">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
            <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={28} />
            </button>
            
            <div className="search-container" ref={searchRef}>
              <div className={`search-bar-smart ${isSearchFocused ? 'focused' : ''}`} style={{ position: 'relative' }}>
              <Search size={20} color="var(--text-secondary)" style={{ zIndex: 2 }} />
              
              {!searchQuery && (
                <div 
                  className="search-placeholder-animated" 
                  style={{ opacity: fade ? 1 : 0 }}
                >
                  {placeholders[placeholderIndex]}
                </div>
              )}

              <input 
                type="text"
                className="search-input-smart"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleSearchSubmit}
                style={{ position: 'relative', zIndex: 2 }}
              />
            </div>
            
            {/* Smart Search Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 2 && (
              <div className="search-dropdown">
                {searchResults.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Ничего не найдено
                  </div>
                ) : (
                  <>
                    {searchResults.map(result => (
                      <Link 
                        key={result.id} 
                        to={`/anime/${result.id}`} 
                        className="search-result-item"
                        onClick={() => { setIsSearchFocused(false); setSearchQuery(''); }}
                      >
                        <img 
                          src={result.image?.preview && !result.image.preview.includes('missing') ? `${IMAGE_BASE}${result.image.preview}` : 'https://placehold.co/50x70/11111a/00f0ff?text=NO'} 
                          alt={result.russian || result.name} 
                          className="search-result-poster" 
                        />
                        <div className="search-result-info">
                          <div className="search-result-title">{result.russian || result.name}</div>
                          <div className="search-result-meta">
                            <span><Star size={14} color="gold" /> {result.score || '?'}</span>
                            <span>{result.aired_on ? result.aired_on.slice(0, 4) : '?'}</span>
                            <span>{result.kind ? result.kind.toUpperCase() : 'ТВ'}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Link 
                      to={`/catalog?search=${encodeURIComponent(searchQuery.trim())}`} 
                      className="search-result-item" 
                      style={{ justifyContent: 'center', color: 'var(--accent-color)', fontWeight: 'bold' }} 
                      onClick={() => setIsSearchFocused(false)}
                    >
                      Смотреть все результаты поиска
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          </div>

          <div className="topbar-actions">
            <button className="btn-premium" onClick={() => showToast('Функция Premium в разработке!')}>
              <Crown size={22} />
            </button>
            {currentUser ? (
              <div className="user-profile-btn" onClick={() => navigate(`/profile/${currentUser.username}`)}>
                <img src={currentUser.profile?.avatar || `https://ui-avatars.com/api/?name=${currentUser.username}&background=00f0ff&color=000`} alt="Avatar" />
                <span className="login-text">Профиль</span>
              </div>
            ) : (
              <button className="btn-login" onClick={() => setShowAuthModal(true)}>
                <LogIn size={20} />
                <span className="login-text">Войти</span>
              </button>
            )}
          </div>
        </header>

        <main className="main-content" style={{ padding: 0 }}>
          <Outlet context={{ showToast, currentUser, setCurrentUser }} />
        </main>
      </div>

      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <h2>{authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}</h2>
            <form onSubmit={handleAuthSubmit}>
              <div className="auth-input-group">
                <label>Имя пользователя</label>
                <input 
                  type="text" 
                  value={authForm.username} 
                  onChange={e => setAuthForm({...authForm, username: e.target.value})} 
                  placeholder="Например: Kirito"
                  required
                />
              </div>
              <div className="auth-input-group">
                <label>Пароль</label>
                <input 
                  type="password" 
                  value={authForm.password} 
                  onChange={e => setAuthForm({...authForm, password: e.target.value})} 
                  placeholder="Ваш пароль"
                  required
                />
              </div>
              {authError && <div className="auth-error">{authError}</div>}
              <button type="submit" className="auth-submit-btn">
                {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </form>
            <div className="auth-switch">
              {authMode === 'login' ? (
                <>Нет аккаунта? <span onClick={() => { setAuthMode('register'); setAuthError(''); }}>Регистрация</span></>
              ) : (
                <>Уже есть аккаунт? <span onClick={() => { setAuthMode('login'); setAuthError(''); }}>Войти</span></>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
