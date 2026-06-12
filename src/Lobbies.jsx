?import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Users, Plus, Lock, Globe, UsersRound } from 'lucide-react';
import { socket } from './socket';

const Lobbies = () => {
  const { currentUser, showToast } = useOutletContext();
  const navigate = useNavigate();
  const [lobbies, setLobbies] = useState([]);
  
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [friendsOnly, setFriendsOnly] = useState(false);

  const [joinRoomId, setJoinRoomId] = useState(null);
  const [joinPassword, setJoinPassword] = useState('');

  useEffect(() => {
    socket.connect();
    
    socket.on('lobbies_list', (list) => {
      setLobbies(list);
    });

    // Request initial list
    socket.emit('get_lobbies');

    return () => {
      socket.off('lobbies_list');
    };
  }, []);

  const handleCreate = () => {
    if (!currentUser) return showToast('?�?????????�?�, ?�?�???�?� ?????�???�?�?? ?????????�?�??');
    if (newRoomName.length < 3) return showToast('???�?�???�?????� ?????????????? 3 ???????????�?�');

    socket.emit('create_lobby', {
      name: newRoomName.trim(),
      host: currentUser.username,
      hostAvatar: currentUser.profile?.avatar,
      password: newRoomPassword.trim(),
      friendsOnly: friendsOnly
    }, (response) => {
      if (response.success) {
        showToast('?????????�?�?� ?????�???�???�!');
        navigate(`/room/${response.roomId}`);
      } else {
        showToast(response.error || '???????�???� ?????�???�??????');
      }
    });
  };

  const handleJoin = (roomId, hasPassword) => {
    if (!currentUser) return showToast('?�?????????�?�, ?�?�???�?� ???�???????�?????????�??????');
    
    if (hasPassword && joinRoomId !== roomId) {
      setJoinRoomId(roomId);
      return;
    }

    socket.emit('join_lobby', {
      roomId,
      username: currentUser.username,
      avatar: currentUser.profile?.avatar,
      password: joinPassword
    }, (response) => {
      if (response.success) {
        navigate(`/room/${roomId}`, { state: { password: joinPassword } });
      } else {
        showToast(response.error);
        if (response.error === '???�???�?�???�?? ???�?�???�??') setJoinPassword('');
      }
    });
  };

  return (
    <div style={{padding: '2rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h1 style={{color: 'white', display: 'flex', alignItems: 'center', gap: '10px'}}>
          <Users color="var(--accent-color)" /> ?????????�???�???�?? ???�?????????�?�
        </h1>
        <button className="btn-save" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '???�???�???�' : <><Plus size={18} /> ?????�???�?�?? ?????????�?�??</>}
        </button>
      </div>

      {showCreate && (
        <div style={{background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border-color)'}}>
          <h3 style={{color: 'white', marginBottom: '15px'}}>???????�?? ?????????�?�?�</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <input 
              type="text" 
              placeholder="???�?�???�?????� ?????????�?�?� (???�???�: ???????�?�???? ???�?�???�??)" 
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              style={{padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'white'}}
            />
            <input 
              type="password" 
              placeholder="???�?�???�?? (???�???�???�?�?�?�?�??????)" 
              value={newRoomPassword}
              onChange={e => setNewRoomPassword(e.target.value)}
              style={{padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'white'}}
            />
            <label style={{display: 'flex', alignItems: 'center', gap: '10px', color: 'white', cursor: 'pointer'}}>
              <input type="checkbox" checked={friendsOnly} onChange={e => setFriendsOnly(e.target.checked)} />
              ?????�?????? ???�?? ???????� ???�???�?�??
            </label>
            <button className="btn-save" onClick={handleCreate} style={{alignSelf: 'flex-start', marginTop: '10px'}}>
              ?????�???�?�?? ?? ???????�??
            </button>
          </div>
        </div>
      )}

      {lobbies.length === 0 ? (
        <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px'}}>
          ???�?� ?�???�???????�?� ?????????�?�. ?�???????�?� ???�?�???�????!
        </div>
      ) : (
        <div style={{display: 'grid', gap: '15px'}}>
          {lobbies.map(l => (
            <div key={l.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
              <div>
                <h3 style={{color: 'white', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                  {l.name} 
                  {l.hasPassword && <Lock size={16} color="var(--text-secondary)" />}
                  {l.friendsOnly ? <UsersRound size={16} color="var(--accent-color)" /> : <Globe size={16} color="var(--text-secondary)" />}
                </h3>
                <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
                  ???????�: <strong style={{color: 'var(--accent-color)'}}>{l.host}</strong> ?�? ???�?�???�??????????: {l.memberCount}/10
                </div>
                {l.currentAnime && (
                  <div style={{color: 'white', marginTop: '5px', fontSize: '0.9rem'}}>
                    ???????�?�???�: {l.currentAnime.name}
                  </div>
                )}
              </div>

              {joinRoomId === l.id ? (
                <div style={{display: 'flex', gap: '10px'}}>
                  <input 
                    type="password" 
                    placeholder="???�?�???�??" 
                    value={joinPassword}
                    onChange={e => setJoinPassword(e.target.value)}
                    style={{padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'white'}}
                  />
                  <button className="btn-save" onClick={() => handleJoin(l.id, true)}>?�?????�??</button>
                  <button className="btn-action" onClick={() => setJoinRoomId(null)}>???�???�???�</button>
                </div>
              ) : (
                <button 
                  className="btn-save" 
                  onClick={() => handleJoin(l.id, l.hasPassword)}
                  disabled={l.memberCount >= 10}
                  style={{opacity: l.memberCount >= 10 ? 0.5 : 1}}
                >
                  {l.memberCount >= 10 ? '???�?�?�?????�???�???�' : '?�?????�??'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Lobbies;
