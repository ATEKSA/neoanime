?import React, { useEffect, useState, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { Play, Heart, Bell, MessageSquare, Star, Users, Share2, Send } from 'lucide-react';
import Hls from 'hls.js';
import CustomPlayer from './CustomPlayer';

const SHIKIMORI_API = 'https://shikimori.one/api';
const SHIKIMORI_IMG = 'https://shikimori.one';
const ANILIBRIA_API = 'https://api.anilibria.tv/v3';
const ANILIBRIA_IMG = 'https://anilibria.top';
const KODIK_SERVER = /api/kodik`;

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

const AnimeDetails = () => {
  const { code } = useParams(); // Shikimori ID
  const { showToast, currentUser, setCurrentUser } = useOutletContext();
  
  const [shikimoriAnime, setShikimoriAnime] = useState(null);
  const [anilibriaAnime, setAnilibriaAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // User Actions State
  const [isFavorite, setIsFavorite] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Comments State
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  // Kodik State
  const [kodikData, setKodikData] = useState(null);
  const [kodikLoading, setKodikLoading] = useState(false);
  const [kodikUrl, setKodikUrl] = useState(null);
  const [activeKodikEpisode, setActiveKodikEpisode] = useState(1);
  const [activeKodikTranslation, setActiveKodikTranslation] = useState(null);
  
  const playerRef = useRef(null);
  const commentsRef = useRef(null);

  const searchAnilibriaFallback = async (animeData) => {
    if (!animeData) {
       showToast('?? ?????�?�?�?�??????, ???????�?? ???� ???�?????�???? ?? ?�?�?�?�?�.');
       return;
    }
    try {
       const searchQuery = animeData.name || animeData.russian;
       showToast('???�?�?? ?? ?�?�?�?�?�???????? ?�?�?�?� (Anilibria)...');
       const res = await fetch(`https://api.anilibria.tv/v3/title/search?search=${encodeURIComponent(searchQuery)}&limit=1`);
       const data = await res.json();
       if (data && data.list && data.list.length > 0) {
          const title = data.list[0];
          // Use episode 1 for fallback initially
          const ep = title.player?.list?.[1];
          const hlsUrl = ep?.hls?.fhd || ep?.hls?.hd || ep?.hls?.sd;
          
          if (hlsUrl) {
             setKodikUrl(`https://cache.libria.fun${hlsUrl}`);
             setKodikData({ 
               translations: [{id: 'anilibria', name: 'Anilibria (?�?�?�?�?�??)'}], 
               active_translation: 'anilibria', 
               episodes_total: title.player?.episodes?.last || 1,
               is_anilibria: true,
               anilibria_title: title
             });
             showToast('???�?????�???? ???� Anilibria!');
             setKodikLoading(false);
             return;
          }
       }
       showToast('?????????� ???� ???�?????�???? ???? ?? ?????????? ?�?�?�?�.');
    } catch(e) {
       console.error(e);
       showToast('?�?????�?? ???� ???�?????�????.');
    }
    setKodikLoading(false);
  };

  const fetchKodikEpisode = (id, episode, translationId = null, shikiData = null) => {
    setKodikLoading(true);
    let url = `${KODIK_SERVER}?shikimori_id=${id}&episode=${episode}`;
    if (translationId && translationId !== 'anilibria') url += `&translation_id=${translationId}`;
    
    // If it's Anilibria fallback being requested for another episode
    if (translationId === 'anilibria' && kodikData?.anilibria_title) {
       const title = kodikData.anilibria_title;
       const ep = title.player?.list?.[episode];
       const hlsUrl = ep?.hls?.fhd || ep?.hls?.hd || ep?.hls?.sd;
       if (hlsUrl) {
          setKodikUrl(`https://cache.libria.fun${hlsUrl}`);
          setActiveKodikEpisode(episode);
       } else {
          showToast('???�?�???? ?�?�?� ???� ???�???�?�');
       }
       setKodikLoading(false);
       return;
    }

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setKodikData(data);
          setKodikUrl(data.url);
          setActiveKodikEpisode(episode);
          if (translationId) setActiveKodikTranslation(translationId);
        } else {
          // If Kodik fails, try Anilibria
          const animeInfo = shikiData || shikimoriAnime;
          searchAnilibriaFallback(animeInfo);
        }
      })
      .catch(e => {
         console.error('Player fetch error', e);
         const animeInfo = shikiData || shikimoriAnime;
         searchAnilibriaFallback(animeInfo);
      });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setKodikUrl(null);
    setAnilibriaAnime(null);

    // 1. Fetch Shikimori metadata
    fetch(`${SHIKIMORI_API}/animes/${code}`)
      .then(res => res.json())
      .then(shikiData => {
        setShikimoriAnime(shikiData);
        // 2. Fetch Kodik player data
        fetchKodikEpisode(code, 1);
        // 3. Fetch Comments
        fetchComments();
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    if (currentUser && currentUser.profile) {
      if (currentUser.profile.favorites) {
        setIsFavorite(currentUser.profile.favorites.some(fav => fav.id === code));
      }
      if (currentUser.profile.watchlist) {
        setInWatchlist(currentUser.profile.watchlist.some(w => w.id === code));
      }
      if (currentUser.profile.ratings && currentUser.profile.ratings[code]) {
        setUserRating(currentUser.profile.ratings[code]);
      }
    } else {
      setIsFavorite(false);
      setInWatchlist(false);
      setUserRating(0);
    }
  }, [currentUser, code]);

  const fetchComments = async () => {
    try {
      const res = await fetch(/api/comments/${code}`);
      const data = await res.json();
      setComments(data);
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToPlayer = () => {
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const scrollToComments = () => {
    if (commentsRef.current) {
      commentsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const updateProfileData = async (newData, successMsg, errorMsg) => {
    if (!currentUser) {
      showToast('?????�?�?�?�?� ???????????�?� ?? ?�?????�?????�');
      return false;
    }
    try {
      const res = await fetch(/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, profileData: newData })
      });
      const data = await res.json();
      if (data.success) {
        if (successMsg) showToast(successMsg);
        const updatedUser = { ...currentUser, profile: { ...currentUser.profile, ...newData } };
        setCurrentUser(updatedUser);
        localStorage.setItem('neoanime_user', JSON.stringify(updatedUser));
        return true;
      } else {
        if (errorMsg) showToast(errorMsg);
        return false;
      }
    } catch (err) {
      if (errorMsg) showToast('???????�???� ???�?�??');
      return false;
    }
  };

  const handleFavorite = async () => {
    if (!shikimoriAnime) return;
    const favs = currentUser?.profile?.favorites || [];
    let newFavs;
    if (isFavorite) {
      newFavs = favs.filter(fav => fav.id !== code);
    } else {
      newFavs = [...favs, { id: code, name: shikimoriAnime.russian || shikimoriAnime.name, image: `https://shikimori.one${shikimoriAnime.image.preview}` }];
    }
    const success = await updateProfileData({ favorites: newFavs }, isFavorite ? '?????�?�?�???? ???� ???�?�?�?�??????????' : '?�???�?�???�?�???? ?? ???�?�?�?�???????�', '???????�???� ???�?? ?????�?�?�???�??????');
    if (success) setIsFavorite(!isFavorite);
  };

  const handleWatchlist = async () => {
    if (!shikimoriAnime) return;
    const wl = currentUser?.profile?.watchlist || [];
    let newWl;
    if (inWatchlist) {
      newWl = wl.filter(w => w.id !== code);
    } else {
      newWl = [...wl, { id: code, name: shikimoriAnime.russian || shikimoriAnime.name, image: `https://shikimori.one${shikimoriAnime.image.preview}` }];
    }
    const success = await updateProfileData({ watchlist: newWl }, inWatchlist ? '?????�?�?�???? ???� "???????�?�??"' : '?�???�?�???�?�???? ?? "???????�?�??"', '???????�???� ???�?? ?????�?�?�???�??????');
    if (success) setInWatchlist(!inWatchlist);
  };

  const handleRate = async (score) => {
    const currentRatings = currentUser?.profile?.ratings || {};
    const newRatings = { ...currentRatings, [code]: score };
    const success = await updateProfileData({ ratings: newRatings }, `???�?�???�???? ???� ${score}/10!`, '???????�???� ???�?? ?????�?�?�???�?????? ???�?�??????');
    if (success) {
      setUserRating(score);
      setShowRatingModal(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('?????�?�???� ???????????�?????�???� ?? ?�???�?�?� ???�???�???�!');
  };

  const submitComment = async () => {
    if (!currentUser) {
      showToast('?�?????????�?�, ?�?�???�?� ?????�?�?????�?? ?????????�???�?�?�????');
      return;
    }
    if (!newComment.trim()) return;

    try {
      const res = await fetch(/api/comments/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          avatar: currentUser.profile?.avatar || `https://ui-avatars.com/api/?name=${currentUser.username}&background=00f0ff&color=000`,
          text: newComment
        })
      });
      const data = await res.json();
      if (data.success) {
        setComments([...comments, data.comment]);
        setNewComment('');
        showToast('?????????�???�?�?�???? ?????�?�???�?�??');
      }
    } catch (e) {
      showToast('???????�???� ???�???�?�?????? ?????????�???�?�?�????');
    }
  };

  if (loading) {
    return (
      <div style={{textAlign: 'center', padding: '5rem', color: 'var(--accent-color)', fontSize: '1.5rem', fontWeight: 'bold'}}>
        ???????�?�???????�?�?�???? ?�?�?� ???�?????�?�...
      </div>
    );
  }

  if (!shikimoriAnime) {
    return <div style={{textAlign: 'center', padding: '5rem', fontSize: '1.2rem'}}>?????????� ???� ???�?????�????</div>;
  }

  const imgOriginal = shikimoriAnime.image?.original;
  const imageUrl = imgOriginal && !imgOriginal.includes('missing') ? `${SHIKIMORI_IMG}${imgOriginal}` : null;

  return (
    <div className="anime-details-page">
      <div className="sidebar">
        <div className="poster-container">
          {imageUrl ? (
            <img src={imageUrl} alt={shikimoriAnime.russian || shikimoriAnime.name} />
          ) : (
            <FallbackPoster anime={shikimoriAnime} />
          )}
        </div>
        
        <button className="btn-watch-main" onClick={scrollToPlayer}>
          <Play fill="white" size={24} />
          ?????????�?�???�
        </button>
        
        <div className="action-buttons" style={{position: 'relative'}}>
          <button className={`btn-action ${isFavorite ? 'active' : ''}`} onClick={handleFavorite} title="?� ???�?�?�?�???????�">
            <Heart size={20} fill={isFavorite ? 'var(--accent-color)' : 'none'} color={isFavorite ? 'var(--accent-color)' : 'currentColor'} />
          </button>
          <button className={`btn-action ${inWatchlist ? 'active' : ''}`} onClick={handleWatchlist} title="???????�?�??">
            <Bell size={20} fill={inWatchlist ? 'var(--accent-color)' : 'none'} color={inWatchlist ? 'var(--accent-color)' : 'currentColor'} />
          </button>
          <button className="btn-action" onClick={scrollToComments} title="?????????�???�?�?�????">
            <MessageSquare size={20} />
          </button>
          <div style={{position: 'relative'}}>
            <button className={`btn-action ${userRating > 0 ? 'active' : ''}`} onClick={() => {if(currentUser) setShowRatingModal(!showRatingModal); else showToast('?????�?�?�?�?� ???????????�?� ?? ?�?????�?????�');}} title="???�?�?????�??">
              <Star size={20} fill={userRating > 0 ? 'var(--accent-color)' : 'none'} color={userRating > 0 ? 'var(--accent-color)' : 'currentColor'} />
            </button>
            {showRatingModal && (
              <div className="rating-modal">
                {[1,2,3,4,5,6,7,8,9,10].map(score => (
                  <div key={score} className="rating-star" onClick={() => handleRate(score)}>
                    <Star size={16} fill={userRating >= score ? 'gold' : 'none'} color="gold" />
                    <span>{score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="btn-action" onClick={handleShare} title="???????�?�???�??????">
            <Share2 size={20} />
          </button>
        </div>
      </div>
      
      <div className="content-area">
        <div>
          <h1 className="title">{shikimoriAnime.russian || shikimoriAnime.name}</h1>
          <h2 style={{color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.2rem', marginTop: '0.5rem', letterSpacing: '1px'}}>
              {shikimoriAnime.name}
          </h2>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">?�???? ???�?�?????�</span>
            <div className="stat-value"><span className="rating-badge">{shikimoriAnime.aired_on?.slice(0, 4) || '?'}</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-label">???�?�?�????</span>
            <span className="stat-value">{shikimoriAnime.status === 'released' ? '?�?�???�??' : '??????????????'}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">?�?????�?????�</span>
            <span className="stat-value">{shikimoriAnime.episodes_aired || shikimoriAnime.episodes || 0} / {shikimoriAnime.episodes || '?'}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">???�?�?????�</span>
            <span className="stat-value"><Star size={16} color="gold" fill="gold" /> {userRating > 0 ? `${userRating}/10 (???�???�)` : `${shikimoriAnime.score || '?'}/10`}</span>
          </div>
        </div>

        <div className="description-container">
          <p dangerouslySetInnerHTML={{__html: shikimoriAnime.description_html || shikimoriAnime.description || '?????????�?????� ???�?????�???�?????�?�.'}} />
        </div>
        
        <div ref={playerRef} style={{marginTop: '2rem'}}>
          <h3 style={{fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-color)'}}>
            ???????�??-???�?�?�?�
          </h3>
          
          <div className="player-container" style={{padding: 0, border: 'none', background: '#000', borderRadius: '12px', overflow: 'hidden'}}>
            {kodikLoading && !kodikUrl ? (
              <div style={{padding: '5rem', textAlign: 'center'}}>?�?�???�???�???� ???????�??...</div>
            ) : kodikUrl ? (
              <CustomPlayer 
                src={kodikUrl}
                poster={shikimoriAnime.screenshots && shikimoriAnime.screenshots.length > 0 ? `https://shikimori.one${shikimoriAnime.screenshots[0].original}` : 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?q=80&w=1920&auto=format&fit=crop'}
                kodikData={kodikData}
                activeTranslation={activeKodikTranslation}
                activeEpisode={activeKodikEpisode}
                animeId={code}
                animeTitle={shikimoriAnime.russian || shikimoriAnime.name}
                showToast={showToast}
                onTranslationChange={(tId) => fetchKodikEpisode(code, activeKodikEpisode, tId)}
                onEpisodeChange={(epId) => fetchKodikEpisode(code, epId, activeKodikTranslation || kodikData?.active_translation)}
              />
            ) : (
              <div style={{padding: '5rem', textAlign: 'center'}}>?�?????�?? ???�???????�???????? ???�?? ?????�?�?�?? ???�?�???????�?�?�???�?�?�?�?�??</div>
            )}
          </div>
        </div>

        {/* COMMENTS SECTION */}
        <div ref={commentsRef} className="comments-section" style={{marginTop: '3rem'}}>
          <h3 style={{fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <MessageSquare size={24} /> ???�?????�?�?�?????� ({comments.length})
          </h3>
          
          <div className="comments-list" style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px'}}>
            {comments.length === 0 ? (
              <div style={{color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px'}}>
                ?�???????�?� ???�?�???�????, ???�?? ?????�?�?????� ?????????�???�?�?�????!
              </div>
            ) : (
              comments.map(c => (
                <div key={c.id} className="comment-item" style={{display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px'}}>
                  <img src={c.avatar} alt="avatar" style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} />
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                      <strong style={{color: 'var(--accent-color)'}}>{c.username}</strong>
                      <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{new Date(c.date).toLocaleDateString()}</span>
                    </div>
                    <div style={{color: 'white', lineHeight: '1.4', wordBreak: 'break-word'}}>{c.text}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="comment-input-area" style={{display: 'flex', gap: '10px'}}>
            {currentUser ? (
              <img src={currentUser.profile?.avatar || `https://ui-avatars.com/api/?name=${currentUser.username}&background=00f0ff&color=000`} alt="avatar" style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} />
            ) : (
              <div style={{width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border-color)'}} />
            )}
            <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <textarea 
                placeholder={currentUser ? "???�???????�?�?? ?????????�???�?�?�????..." : "?�?????????�?�, ?�?�???�?� ???????�?�?? ?????????�???�?�?�????"}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                disabled={!currentUser}
                style={{width: '100%', padding: '15px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', outline: 'none', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit'}}
              />
              <button 
                onClick={submitComment}
                disabled={!currentUser || !newComment.trim()}
                style={{alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--accent-gradient)', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: (!currentUser || !newComment.trim()) ? 'not-allowed' : 'pointer', opacity: (!currentUser || !newComment.trim()) ? 0.5 : 1}}
              >
                <Send size={16} /> ???????�???�?????�
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeDetails;
