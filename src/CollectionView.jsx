import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import { Share2, Trash2, ShieldAlert } from 'lucide-react';
import './Profile.css';

const CollectionView = () => {
  const { username, collectionId } = useParams();
  const { currentUser, setCurrentUser, showToast } = useOutletContext();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search state for adding anime
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const isOwner = currentUser && currentUser.username === username;

  useEffect(() => {
    // Fetch profile to get collection
    fetch(`/api/profile/${username}`)
      .then(r => {
        if (!r.ok) throw new Error('?????�???�?????�?�?�?�?? ???� ???�?????�??');
        return r.json();
      })
      .then(data => {
        const found = data.profile?.collections?.find(c => c.id === collectionId);
        if (found) {
          setCollection(found);
        } else {
          setError('???????�???�???� ???� ???�?????�???�');
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [username, collectionId]);

  const updateCollectionOnServer = async (newItems) => {
    if (!currentUser) return;
    
    // Create new collections array replacing this specific one
    const updatedCollections = currentUser.profile.collections.map(c => 
      c.id === collectionId ? { ...c, items: newItems } : c
    );

    try {
      const res = await fetch(`/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: currentUser.username, 
          profileData: { collections: updatedCollections } 
        })
      });
      const data = await res.json();
      if (data.success) {
        setCollection({ ...collection, items: newItems });
        const updatedUser = { ...currentUser, profile: { ...currentUser.profile, collections: updatedCollections } };
        setCurrentUser(updatedUser);
        localStorage.setItem('neoanime_user', JSON.stringify(updatedUser));
      }
    } catch (e) {
      showToast('???????�???� ???�?? ?????�?�?�???�??????');
    }
  };

  const handleSearchAnime = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`https://shikimori.one/api/animes?search=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
    setIsSearching(false);
  };

  const handleAddAnime = (anime) => {
    // Check if already in collection
    if (collection.items.some(i => i.id === anime.id.toString())) {
      return showToast('???�?� ?�???�?? ?? ???????�???�???�!');
    }

    const newItem = { 
      id: anime.id.toString(), 
      name: anime.russian || anime.name, 
      image: `https://shikimori.one${anime.image.preview}` 
    };

    const newItems = [...collection.items, newItem];
    updateCollectionOnServer(newItems);
    
    setSearchQuery('');
    setSearchResults([]);
    showToast(`?�???�?�???�?�????: ${newItem.name}`);
  };

  const handleRemoveAnime = (e, animeId) => {
    e.preventDefault(); // Prevent navigating to anime page
    const newItems = collection.items.filter(i => i.id !== animeId);
    updateCollectionOnServer(newItems);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('?????�?�???� ???� ???????�???�???? ???????????�?????�???�!');
  };

  const handleDeleteCollection = async () => {
    if (!window.confirm('?�?� ?????�?�?�???�, ?�?�?? ?�???�???�?� ?????�?�???�?? ???�?? ???????�???�???? ???�?????�?????�?')) return;
    
    const updatedCollections = currentUser.profile.collections.filter(c => c.id !== collectionId);
    
    try {
      const res = await fetch(`/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: currentUser.username, 
          profileData: { collections: updatedCollections } 
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('???????�???�???� ?????�?�?�???�');
        const updatedUser = { ...currentUser, profile: { ...currentUser.profile, collections: updatedCollections } };
        setCurrentUser(updatedUser);
        localStorage.setItem('neoanime_user', JSON.stringify(updatedUser));
        navigate('/collections');
      }
    } catch (e) {
      showToast('???????�???� ???�?? ?????�?�?�??????');
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '5rem'}}>?�?�???�???�???� ???????�???�????...</div>;
  if (error) return <div style={{textAlign: 'center', padding: '5rem', color: 'red'}}><ShieldAlert size={48} /><h2>{error}</h2></div>;

  return (
    <div style={{padding: '2rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
        <div>
          <h1 style={{color: 'white', marginBottom: '5px'}}>{collection.name}</h1>
          <div style={{color: 'var(--text-secondary)'}}>?????�???�: <Link to={`/profile/${username}`} style={{color: 'var(--accent-color)', textDecoration: 'none'}}>{username}</Link></div>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
          <button className="btn-action" onClick={handleShare} style={{padding: '10px 20px', background: 'rgba(0,240,255,0.1)', color: 'var(--accent-color)'}}>
            <Share2 size={18} /> ???????�?�???�??????
          </button>
          {isOwner && (
            <button className="btn-action" onClick={handleDeleteCollection} style={{padding: '10px 20px', background: 'rgba(255,0,0,0.1)', color: 'red'}}>
              <Trash2 size={18} /> ?????�?�???�??
            </button>
          )}
        </div>
      </div>

      {isOwner && (
        <div style={{background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--border-color)', position: 'relative'}}>
          <h3 style={{color: 'white', marginBottom: '10px'}}>?�???�?�?????�?? ?�???????�</h3>
          <input 
            type="text" 
            placeholder="?????????? ?�???????� ???� ?�???�?�?????�?�????..." 
            value={searchQuery} 
            onChange={handleSearchAnime} 
            style={{width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'white'}}
          />
          {isSearching && <div style={{color: 'var(--text-secondary)', marginTop: '5px'}}>??????????...</div>}
          
          {searchResults.length > 0 && (
            <div className="tierlist-search-results" style={{position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface)', zIndex: 10, border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px'}}>
              {searchResults.map(result => (
                <div 
                  key={result.id} 
                  className="tierlist-search-item"
                  onClick={() => handleAddAnime(result)}
                >
                  <img 
                    src={`https://shikimori.one${result.image.preview}`} 
                    alt={result.russian || result.name} 
                  />
                  <span>{result.russian || result.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {collection.items.length === 0 ? (
        <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px'}}>
          ?� ???�???? ???????�???�???� ???????� ???�?� ?�???????�.
        </div>
      ) : (
        <div className="favorites-grid">
          {collection.items.map(anime => (
            <Link to={`/anime/${anime.id}`} key={anime.id} className="favorite-item" style={{position: 'relative'}}>
              <img src={anime.image} alt={anime.name} />
              <div className="favorite-name">{anime.name}</div>
              
              {isOwner && (
                <div 
                  onClick={(e) => handleRemoveAnime(e, anime.id)}
                  style={{position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.7)', borderRadius: '50%', padding: '5px', display: 'flex', cursor: 'pointer', zIndex: 5}}
                >
                  <Trash2 size={16} color="red" />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionView;
