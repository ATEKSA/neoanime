import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, User, LogIn, LogOut, Menu, X, Play, Settings, Crown, Star, Flame, Shuffle, Users } from 'lucide-react';
import './Layout.css';
import { socket } from './socket';

const IMAGE_BASE = 'https://shikimori.one';

const Layout = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // login or register
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const [toastMessage, setToastMessage] = useState('');
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = localStorage.getItem('neoanime_user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowSearchDropdown(false);
    setSearchQuery('');
  }, [location.pathname]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const q = searchQuery;
        const res = await fetch(`https://shikimori.one/api/animes?search=${encodeURIComponent(q)}&limit=5`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSearchDropdown(true);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSearchDropdown(false);
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (authForm.username.length < 3 || authForm.password.length < 3) {
      setAuthError('Минимум 3 символа');
      return;
    }

    try {
      const res = await fetch(`/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      
      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('neoanime_user', JSON.stringify(data.user));
        setShowAuthModal(false);
        showToast(authMode === 'login' ? 'Успешный вход!' : 'Регистрация успешна!');
        socket.connect();
      } else {
        setAuthError(data.error || 'Ошибка авторизации');
      }
    } catch (err) {
      setAuthError('Ошибка сети');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('neoanime_user');
    socket.disconnect();
    showToast('Вы вышли из аккаунта');
    if (location.pathname.startsWith('/profile')) {
      navigate('/');
    }
  };

  return (
    <div className="app-wrapper">
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="navbar-left">
            <Link to="/" className="logo">Neo<span className="accent">Anime</span></Link>
            
            <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <Link to="/catalog" className="nav-item">Каталог</Link>
              <Link to="/random" className="nav-item">Случайное</Link>
              <Link to="/lobbies" className="nav-item">Совместный просмотр</Link>
            </div>
          </div>

          <div className="navbar-right">
            <div className="search-container" ref={searchRef}>
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                placeholder="Поиск аниме..." 
                className="search-input"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => { if (searchQuery) setShowSearchDropdown(true); }}
                onKeyDown={handleSearchSubmit}
              />
              
              {showSearchDropdown && searchQuery && (
                <div className="search-dropdown">
                  {isSearching ? (
                    <div className="search-loading">Поиск...</div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {searchResults.map(result => (
                        <Link 
                          to={`/anime/${result.id}`} 
                          key={result.id} 
                          className="search-result-item"
                          onClick={() => setShowSearchDropdown(false)}
                        >
                          <img 
                            src={result.image?.preview && !result.image.preview.includes('missing') ? `${IMAGE_BASE}${result.image.preview}` : 'https://placehold.co/50x70/11111a/00f0ff?text=NO'} 
                            alt={result.russian || result.name} 
                          />
                          <div className="search-result-info">
                            <h4>{result.russian || result.name}</h4>
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
                        className="search-view-all"
                        onClick={() => setShowSearchDropdown(false)}
                      >
                        Смотреть все результаты
                      </Link>
                    </>
                  ) : (
                    <div className="search-loading">Ничего не найдено</div>
                  )}
                </div>
              )}
            </div>

            <button className="btn-premium" onClick={() => showToast('Функция Premium пока в разработке!')}>
              <Crown size={18} fill="currentColor" /> Premium
            </button>

            {currentUser ? (
              <div className="user-menu-wrapper">
                <Link to={`/profile/${currentUser.username}`} className="user-profile-btn">
                  <img src={currentUser.profile?.avatar || `https://ui-avatars.com/api/?name=${currentUser.username}&background=00f0ff&color=000`} alt="Avatar" />
                  <span className="username-text">{currentUser.username}</span>
                </Link>
                <button onClick={handleLogout} className="btn-icon" title="Выйти">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button className="btn-login" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
                <LogIn size={20} />
                <span className="login-text">Войти</span>
              </button>
            )}

            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={(e) => { if (e.target.className === 'auth-modal-overlay') setShowAuthModal(false); }}>
          <div className="auth-modal">
            <button className="close-modal" onClick={() => setShowAuthModal(false)}><X size={24}/></button>
            <h2>{authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}</h2>
            
            {authError && <div className="auth-error">{authError}</div>}
            
            <form onSubmit={handleAuthSubmit}>
              <div className="form-group">
                <label>Имя пользователя</label>
                <input 
                  type="text" 
                  value={authForm.username}
                  onChange={e => setAuthForm({...authForm, username: e.target.value})}
                  placeholder="Например: Kirito"
                  required
                />
              </div>
              <div className="form-group">
                <label>Пароль</label>
                <input 
                  type="password" 
                  value={authForm.password}
                  onChange={e => setAuthForm({...authForm, password: e.target.value})}
                  placeholder="Ваш пароль"
                  required
                />
              </div>
              <button type="submit" className="btn-auth-submit">
                {authMode === 'login' ? 'Войти' : 'Создать аккаунт'}
              </button>
            </form>
            
            <div className="auth-switch">
              {authMode === 'login' ? (
                <>Нет аккаунта? <span onClick={() => { setAuthMode('register'); setAuthError(''); }}>Зарегистрироваться</span></>
              ) : (
                <>Уже есть аккаунт? <span onClick={() => { setAuthMode('login'); setAuthError(''); }}>Войти</span></>
              )}
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="toast-notification">
          {toastMessage}
        </div>
      )}

      <main className="main-content">
        <Outlet context={{ currentUser, setCurrentUser, showToast }} />
      </main>
      
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h2 className="logo">Neo<span className="accent">Anime</span></h2>
            <p>Смотрите любимые аниме в лучшем качестве, без ограничений.</p>
          </div>
          <div className="footer-links">
            <div className="link-group">
              <h3>Навигация</h3>
              <Link to="/">Главная</Link>
              <Link to="/catalog">Каталог</Link>
              <Link to="/random">Случайное</Link>
            </div>
            <div className="link-group">
              <h3>Информация</h3>
              <Link to="#">Правила</Link>
              <Link to="#">Контакты</Link>
              <Link to="#">Правообладателям</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} NeoAnime. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
