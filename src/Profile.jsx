import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { Edit2, Save, LogOut, Plus, Trash2, UserPlus, UserCheck, Clock } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { username } = useParams();
  const { currentUser, setCurrentUser, showToast } = useOutletContext();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('tierlist');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ description: '', avatar: '' });

  const [showAddForm, setShowAddForm] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const isOwner = currentUser && currentUser.username === username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${username}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.profile);
        setEditForm({ description: data.profile.description || '', avatar: data.profile.avatar || '' });
      } else {
        setProfileData(null);
      }
    } catch (err) {
      console.error(err);
      setProfileData(null);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, profileData: editForm })
      });
      const data = await res.json();
      if (data.success) {
        setProfileData(data.profile);
        setIsEditing(false);
        showToast('Успешно');
        const updatedUser = { ...currentUser, profile: data.profile };
        setCurrentUser(updatedUser);
        localStorage.setItem('neoanime_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      showToast('Успешно');
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('?�?�???� ???�?????????? ?�???�???????? (???�???? 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('neoanime_user');
    showToast('Успешно');
  };

  // --- TIER LIST LOGIC ---
  const defaultTiers = ['S', 'A', 'B', 'C', 'D'];
  const getTierList = () => {
    if (!profileData) return {};
    const tl = profileData.tierList || {};
    defaultTiers.forEach(t => { if (!tl[t]) tl[t] = []; });
    return tl;
  };

  const updateTierListAPI = async (newTierList) => {
    const updatedProfile = { ...profileData, tierList: newTierList };
    setProfileData(updatedProfile);
    try {
      await fetch(`/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, profileData: { tierList: newTierList } })
      });
    } catch (err) {
      showToast('???????�???� ???�?? ?????�?�?�???�?????? ?�???�-?�?????�?�');
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

  const handleAddAnimeToTierList = (anime) => {
    const tl = getTierList();
    const totalItems = Object.values(tl).reduce((acc, curr) => acc + curr.length, 0);
    if (totalItems >= 50) {
      showToast('?�?????�?????????� ?�???????� ?�???????� (50)');
      return;
    }

    const newItem = { 
      id: anime.id.toString(), 
      name: anime.russian || anime.name, 
      image: `https://shikimori.one${anime.image.preview}` 
    };
    tl['C'].push(newItem);
    updateTierListAPI(tl);
    setSearchQuery('');
    setSearchResults([]);
    setShowAddForm(false);
    showToast(`${newItem.name} ?????�?�???�?�???? ?? ?�???� C`);
  };

  const handleDragStart = (e, item) => {
    if (!isOwner) return;
    e.dataTransfer.setData('itemId', item.id);
  };

  const handleDrop = (tier, e) => {
    e.preventDefault();
    if (!isOwner) return;
    const itemId = e.dataTransfer.getData('itemId');
    if (!itemId) return;

    const tl = getTierList();
    let foundItem = null;
    for (const key in tl) {
      const idx = tl[key].findIndex(i => i.id === itemId);
      if (idx !== -1) {
        foundItem = tl[key].splice(idx, 1)[0];
        break;
      }
    }
    if (foundItem) {
      tl[tier].push(foundItem);
      updateTierListAPI(tl);
    }
  };

  const handleDeleteItem = (itemId) => {
    if (!isOwner) return;
    const tl = getTierList();
    for (const key in tl) {
      const idx = tl[key].findIndex(i => i.id === itemId);
      if (idx !== -1) {
        tl[key].splice(idx, 1);
        break;
      }
    }
    updateTierListAPI(tl);
  };

  const handleAddFriend = async () => {
    if (!currentUser) return showToast('Успешно');
    try {
      const res = await fetch(`/api/friends/add`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ sender: currentUser.username, receiver: username })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Успешно');
        setProfileData({...profileData, friendRequests: [...(profileData.friendRequests || []), currentUser.username]});
      }
    } catch (e) {
      showToast('Успешно');
    }
  };

  const handleAddFriendByCode = async () => {
    if (!friendCodeInput.trim()) return showToast('Успешно');
    try {
      const res = await fetch(`/api/friends/add_by_code`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ sender: currentUser.username, code: friendCodeInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setFriendCodeInput('');
      } else {
        showToast(data.error);
      }
    } catch (e) {
      showToast('Успешно');
    }
  };

  const handleAcceptFriend = async (senderName) => {
    try {
      const res = await fetch(`/api/friends/accept`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username: currentUser.username, sender: senderName })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Успешно');
        setProfileData(data.profile);
        setCurrentUser({...currentUser, profile: data.profile});
        localStorage.setItem('neoanime_user', JSON.stringify({...currentUser, profile: data.profile}));
      }
    } catch (e) {
      showToast('Успешно');
    }
  };

  if (loading) return <div className="profile-container">?�?�???�???�???� ???�???�???�??...</div>;
  if (!profileData) return <div className="profile-container"></div>;

  const tl = getTierList();
  const favorites = profileData.favorites || [];

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <img src={profileData.avatar || `https://ui-avatars.com/api/?name=${username}&background=00f0ff&color=000`} alt="Avatar" className="profile-avatar" />
        </div>
        <div className="profile-info">
          <h1 className="profile-username">{username}</h1>
          
          {isEditing ? (
            <div className="profile-edit-mode">
              <label>?????�?�?�?�???� (?�?�???�):</label>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} />
              
              <label>???�?? ?????�?�???� ???� ?�???�?�?�?�????:</label>
              <input 
                type="text" 
                value={editForm.avatar} 
                onChange={e => setEditForm({...editForm, avatar: e.target.value})} 
                placeholder="https://..."
              />
              <label>?? ???�?�?�:</label>
              <textarea 
                value={editForm.description} 
                onChange={e => setEditForm({...editForm, description: e.target.value})} 
                placeholder="Введите значение..."
              />
              <button onClick={handleSave} className="btn-save"><Save size={18} /></button>
            </div>
          ) : (
            <div className="profile-desc">
              {profileData.description || '?????�???�?????�?�?�?�?? ???????� ?????�?�???? ???� ?�?�???????�?�?�?� ?? ???�?�?�.'}
            </div>
          )}
          {isOwner && profileData.friendCode && (
            <div style={{marginTop: '10px', display: 'inline-block', padding: '5px 10px', background: 'rgba(0,240,255,0.1)', border: '1px dashed var(--accent-color)', borderRadius: '6px', color: 'var(--accent-color)', fontSize: '0.9rem'}}>
              ?�?�?? ?????? ???�???�?�?�: <strong>{profileData.friendCode}</strong>
            </div>
          )}
        </div>
        
        {isOwner && !isEditing ? (
          <div className="profile-actions">
            <button onClick={() => setIsEditing(true)} className="btn-edit"><Edit2 size={18} /></button>
            <button onClick={handleLogout} className="btn-logout"><LogOut size={18} /></button>
          </div>
        ) : !isOwner && currentUser ? (
          <div className="profile-actions">
            {profileData.friends?.includes(currentUser.username) ? (
              <button className="btn-save" disabled style={{opacity: 0.5}}><UserCheck size={18} /></button>
            ) : profileData.friendRequests?.includes(currentUser.username) ? (
              <button className="btn-edit" disabled style={{opacity: 0.5}}><Clock size={18} /></button>
            ) : (
              <button className="btn-save" onClick={handleAddFriend}><UserPlus size={18} /></button>
            )}
          </div>
        ) : null}
      </div>

      <div className="profile-tabs">
        <button className={`tab-btn ${activeTab === 'tierlist' ? 'active' : ''}`} onClick={() => setActiveTab('tierlist')}>?????�-?�?????�</button>
        <button className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}></button>
        <button className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>?�?�???�???? {(isOwner && profileData.friendRequests?.length > 0) ? `(+${profileData.friendRequests.length})` : ''}</button>
        {isOwner && <button className={`tab-btn ${activeTab === 'add_friend' ? 'active' : ''}`} onClick={() => setActiveTab('add_friend')}></button>}
      </div>

      {activeTab === 'tierlist' && (
        <div className="profile-tierlist">
          <div className="tierlist-header">
            <h2>?????�-?�?????� ?�???????� {isOwner && '(???�?�?�?�?�?????????�???�?� ?�???????� ???�?�???? ?�???�?�????)'}</h2>
            {isOwner && (
              <button className="btn-add-tier" onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? '???�???�???�' : <><Plus size={18}/></>}
              </button>
            )}
          </div>

          {showAddForm && (
            <div className="tierlist-add-form">
              <input 
                type="text" 
                placeholder="Введите значение..." 
                value={searchQuery} 
                onChange={handleSearchAnime} 
              />
              {isSearching && <div style={{color: 'var(--text-secondary)'}}>??????????...</div>}
              {searchResults.length > 0 && (
                <div className="tierlist-search-results">
                  {searchResults.map(result => (
                    <div 
                      key={result.id} 
                      className="tierlist-search-item"
                      onClick={() => handleAddAnimeToTierList(result)}
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

          <div className="tier-board">
            {defaultTiers.map(tier => (
              <div 
                key={tier} 
                className={`tier-row ${tier}-tier`}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={e => handleDrop(tier, e)}
              >
                <div className="tier-label">{tier}</div>
                <div className="tier-content">
                  {tl[tier] && tl[tier].length > 0 ? tl[tier].map(item => (
                    <div 
                      key={item.id} 
                      className="tier-item" 
                      draggable={isOwner}
                      onDragStart={e => handleDragStart(e, item)}
                      title={item.name}
                    >
                      <img src={item.image} alt={item.name} />
                      <div className="tier-item-name">{item.name}</div>
                      {isOwner && (
                        <div className="tier-item-delete" onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 size={14} color="#fff" />
                        </div>
                      )}
                    </div>
                  )) : (
                    <span style={{color: 'rgba(255,255,255,0.2)'}}></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="profile-favorites">
          <h2></h2>
          {favorites.length === 0 ? (
            <p style={{color: 'var(--text-secondary)'}}>???????????? ???�?�?�?�?????????? ???????� ???????�.</p>
          ) : (
            <div className="favorites-grid">
               {favorites.map(fav => (
                 <Link to={`/anime/${fav.id}`} key={fav.id} className="favorite-item">
                   <img src={fav.image} alt={fav.name} />
                   <div className="favorite-name">{fav.name}</div>
                 </Link>
               ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'friends' && (
        <div style={{marginTop: '2rem'}}>
          {isOwner && profileData.friendRequests?.length > 0 && (
            <div style={{marginBottom: '2rem'}}>
              <h3></h3>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '10px'}}>
                {profileData.friendRequests.map(req => (
                  <div key={req} style={{display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', border: '1px solid var(--accent-color)'}}>
                    <Link to={`/profile/${req}`} style={{color: 'white', textDecoration: 'none', fontWeight: 'bold'}}>{req}</Link>
                    <button onClick={() => handleAcceptFriend(req)} className="btn-save" style={{padding: '5px 15px', fontSize: '0.9rem'}}></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <h3></h3>
          {(!profileData.friends || profileData.friends.length === 0) ? (
            <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginTop: '10px'}}>
              ???????� ???�?� ???�???�?�??.
            </div>
          ) : (
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '10px'}}>
              {profileData.friends.map(friend => (
                <Link to={`/profile/${friend}`} key={friend} style={{display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', textDecoration: 'none'}}>
                  <img src={`https://ui-avatars.com/api/?name=${friend}&background=00f0ff&color=000`} alt="Avatar" style={{width: '40px', height: '40px', borderRadius: '50%'}} />
                  <span style={{color: 'white', fontWeight: 'bold'}}>{friend}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'add_friend' && isOwner && (
        <div style={{marginTop: '2rem', background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center'}}>
          <h2 style={{marginBottom: '1rem'}}></h2>
          <p style={{color: 'var(--text-secondary)', marginBottom: '1.5rem'}}>
            ?�???�?????�?� 6-?�???�?�???�?? ?????? ???�?????�, ?�?�???�?� ???�???�?�?????�?? ?�???? ?�?�????????.
          </p>
          <div style={{display: 'flex', justifyContent: 'center', gap: '10px', maxWidth: '400px', margin: '0 auto'}}>
            <input 
              type="text" 
              placeholder="???�???�?????�?�: 123456" 
              value={friendCodeInput}
              onChange={e => setFriendCodeInput(e.target.value)}
              style={{
                flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', 
                background: 'var(--bg-surface)', color: 'white', fontSize: '1.1rem', textAlign: 'center', letterSpacing: '2px'
              }}
              maxLength={6}
            />
            <button className="btn-save" onClick={handleAddFriendByCode} style={{padding: '0 20px'}}>
              <UserPlus size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
