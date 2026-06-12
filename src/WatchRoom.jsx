import React, { useState, useEffect, useRef } from 'react';
import { useParams, useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { socket } from './socket';
import { Send, LogOut, Users, Search, Crown, Mic, MicOff, Play } from 'lucide-react';
import CustomPlayer from './CustomPlayer';

const WatchRoom = () => {
  const { roomId } = useParams();
  const { currentUser, showToast } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [roomData, setRoomData] = useState(null);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Player state
  const [kodikData, setKodikData] = useState(null);
  const [kodikUrl, setKodikUrl] = useState(null);
  const [syncCommand, setSyncCommand] = useState(null);

  // WebRTC Voice Chat State
  const [micEnabled, setMicEnabled] = useState(false);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});

  const createPeerConnection = (targetId, isInitiator) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_ice_candidate', { targetId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({ ...prev, [targetId]: event.streams[0] }));
    };

    if (isInitiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        socket.emit('webrtc_offer', { targetId, offer });
      });
    }

    peersRef.current[targetId] = pc;
    return pc;
  };

  const toggleMic = async () => {
    if (!micEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        setMicEnabled(true);
        
        roomData.members.forEach(member => {
          if (member.id !== socket.id) {
            createPeerConnection(member.id, true);
          }
        });
      } catch (err) {
        showToast('Успешно');
      }
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setMicEnabled(false);
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
      setRemoteStreams({});
    }
  };

  useEffect(() => {
    if (!currentUser) {
      showToast('Успешно');
      navigate('/lobbies');
      return;
    }

    if (!socket.connected) socket.connect();

    socket.on('room_update', (data) => {
      setRoomData(data);

      const activeIds = data.members.map(m => m.id);
      Object.keys(peersRef.current).forEach(id => {
        if (!activeIds.includes(id)) {
          peersRef.current[id].close();
          delete peersRef.current[id];
          setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
      });

      if (data.currentAnime) {
        if (!kodikData || kodikData.shikimori_id !== data.currentAnime.id || kodikData.active_translation !== data.currentAnime.translation_id) {
          fetchKodikEpisode(data.currentAnime.id, data.currentAnime.episode || 1, data.currentAnime.translation_id);
        }
      } else {
        setKodikData(null);
        setKodikUrl(null);
      }
    });

    // Explicitly join or request data on mount
    socket.emit('join_lobby', { 
      roomId, 
      username: currentUser.username, 
      avatar: currentUser.profile?.avatar,
      password: location.state?.password || ''
    }, (response) => {
      if (!response.success) {
        showToast(response.error || '???????�???� ???�?????� ?? ?�???�?�??');
        navigate('/lobbies');
      } else {
        setRoomData(response.lobby);
      }
    });

    socket.on('receive_chat', (msg) => {
      setChat(prev => [...prev, msg]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    socket.on('sync_player', ({ action, time }) => {
      setSyncCommand({ action, time, _t: Date.now() });
    });

    socket.on('webrtc_offer', async ({ senderId, offer }) => {
      const pc = createPeerConnection(senderId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc_answer', { targetId: senderId, answer });
    });

    socket.on('webrtc_answer', async ({ senderId, answer }) => {
      const pc = peersRef.current[senderId];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('webrtc_ice_candidate', async ({ senderId, candidate }) => {
      const pc = peersRef.current[senderId];
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      socket.emit('leave_lobby', roomId);
      socket.off('room_update');
      socket.off('receive_chat');
      socket.off('sync_player');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      Object.values(peersRef.current).forEach(pc => pc.close());
    };
  }, [roomId, currentUser]);

  const fetchKodikEpisode = async (id, episode, translation_id) => {
    try {
      let url = `/api/kodik?shikimori_id=${id}&episode=${episode}`;
      if (translation_id) url += `&translation_id=${translation_id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setKodikData({ ...data, shikimori_id: id });
        setKodikUrl(data.url);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchAnime = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 3) return setSearchResults([]);
    setIsSearching(true);
    try {
      // Use proxy to avoid CORS
      const res = await fetch(`/proxy/shikimori.one/api/animes?search=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
    setIsSearching(false);
  };

  const handleSelectAnime = (anime) => {
    socket.emit('change_anime', {
      roomId,
      anime: {
        id: anime.id,
        name: anime.russian || anime.name,
        image: `https://shikimori.one${anime.image.preview}`,
        episode: 1
      }
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socket.emit('send_chat', { roomId, username: currentUser.username, text: chatInput });
    setChatInput('');
  };

  // Helper to force take host (for debugging)
  const takeHost = () => {
    socket.emit('take_host', { roomId, username: currentUser.username });
  };

  if (!roomData) return <div style={{padding: '5rem', textAlign: 'center'}}>?????????�???�?�?????� ?? ?????????�?�?�...</div>;

  const isHost = roomData.host === currentUser?.username;

  return (
    <div className="watchroom-container" style={{display: 'flex', height: 'calc(100vh - 70px)', padding: '10px', gap: '10px', overflow: 'hidden'}}>
      {/* LEFT: PLAYER & CONTROLS */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)'}}>
        
        {/* Top bar of player area */}
        <div style={{padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.5)'}}>
          <div>
            <h2 style={{margin: 0, color: 'white'}}>{roomData.name}</h2>
            <div style={{color: 'var(--accent-color)', fontSize: '0.9rem'}}>Хост: {roomData.host}</div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            {!isHost && (
              <button className="btn-save" onClick={takeHost} style={{padding: '5px 10px', fontSize: '0.8rem'}}>Текст</button>
            )}
            <button className="btn-action" onClick={() => navigate('/lobbies')} style={{background: 'rgba(255,0,0,0.2)', color: 'red'}}>
              <LogOut size={18} />Текст</button>
          </div>
        </div>

        {/* Player Area */}
        <div style={{flex: 1, background: '#000', display: 'flex', flexDirection: 'column', position: 'relative'}}>
          {kodikUrl ? (
            <div style={{flex: 1, pointerEvents: isHost ? 'auto' : 'none'}}>
              {/* Note: In a real advanced sync, we'd pass sync commands. Here we disable pointer events for non-hosts so only host controls it for now */}
              <CustomPlayer 
                src={kodikUrl} 
                animeTitle={roomData.currentAnime?.name} 
                kodikData={kodikData}
                activeEpisode={roomData.currentAnime?.episode || 1}
                animeId={roomData.currentAnime?.id}
                showToast={showToast}
                syncCommand={syncCommand}
                onPlay={(time) => isHost && socket.emit('player_action', { roomId, action: 'play', time })}
                onPause={(time) => isHost && socket.emit('player_action', { roomId, action: 'pause', time })}
                onSeek={(time) => isHost && socket.emit('player_action', { roomId, action: 'seek', time })}
                onTranslationChange={(tId) => {
                  if (isHost) {
                    socket.emit('change_anime', {
                      roomId,
                      anime: { ...roomData.currentAnime, translation_id: tId }
                    });
                  }
                }}
                onEpisodeChange={(ep) => {
                  if (isHost) {
                    socket.emit('change_anime', {
                      roomId,
                      anime: { ...roomData.currentAnime, episode: ep }
                    });
                  }
                }}
              />
              {!isHost && (
                <div style={{position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', padding: '5px 10px', borderRadius: '8px', color: 'white', zIndex: 10}}>Текст</div>
              )}
            </div>
          ) : (
            <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '10px'}}>
              <Play size={48} opacity={0.2} />
              <h2>Плеер загружается...</h2>
            </div>
          )}
        </div>

        {/* Host Controls */}
        {isHost && (
          <div style={{padding: '15px', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid var(--border-color)'}}>
            <div style={{position: 'relative'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                <Search color="var(--text-secondary)" size={20} />
                <input 
                  type="text" 
                  placeholder="Введите значение..." 
                  value={searchQuery}
                  onChange={handleSearchAnime}
                  style={{flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none'}}
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className="tierlist-search-results" style={{position: 'absolute', bottom: '100%', left: 0, right: 0, background: 'var(--bg-surface)', zIndex: 20, border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', marginBottom: '5px', maxHeight: '300px', overflowY: 'auto'}}>
                  {searchResults.map(result => (
                    <div key={result.id} className="tierlist-search-item" onClick={() => handleSelectAnime(result)}>
                      <img src={`https://shikimori.one${result.image.preview}`} alt={result.name} />
                      <span>{result.russian || result.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: CHAT & USERS */}
      <div className="watchroom-sidebar" style={{width: '300px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
        
        {/* Users List */}
        <div style={{background: 'var(--bg-surface)', borderRadius: '12px', padding: '15px', border: '1px solid var(--border-color)', maxHeight: '30%', overflowY: 'auto'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
            <h3 style={{color: 'white', margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '5px'}}>
              <Users size={16} /> Участники ({roomData.members.length}/10)
            </h3>
            <button 
              onClick={toggleMic}
              style={{background: micEnabled ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: micEnabled ? 'var(--accent-color)' : 'white'}}
              title={micEnabled ? "Выключить микрофон" : "Включить микрофон"}
            >
              {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {roomData.members.map(m => (
              <div key={m.id} style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <img src={m.avatar} alt="avatar" style={{width: '24px', height: '24px', borderRadius: '50%'}} />
                <span style={{color: 'white', fontSize: '0.9rem', flex: 1}}>{m.username}</span>
                {m.username === roomData.host && <Crown size={14} color="gold" />}
              </div>
            ))}
          </div>
        </div>

        {/* Hidden Audio Tags for Voice Chat */}
        {Object.entries(remoteStreams).map(([id, stream]) => (
          <audio key={id} autoPlay ref={el => { if (el) el.srcObject = stream }} />
        ))}

        {/* Chat */}
        <div style={{flex: 1, background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
          <div style={{padding: '15px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid var(--border-color)', color: 'white', fontWeight: 'bold'}}>Чат комнаты</div>
          
          <div style={{flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {chat.map((msg, idx) => (
              <div key={idx} style={{display: 'flex', flexDirection: 'column', alignItems: msg.username === currentUser.username ? 'flex-end' : 'flex-start'}}>
                <span style={{fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px'}}>{msg.username}</span>
                <div style={{background: msg.username === currentUser.username ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', color: msg.username === currentUser.username ? 'black' : 'white', padding: '8px 12px', borderRadius: '12px', maxWidth: '90%', wordBreak: 'break-word'}}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div style={{padding: '10px', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '5px'}}>
            <input 
              type="text" 
              placeholder="Введите значение..." 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              style={{flex: 1, padding: '10px', borderRadius: '20px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', outline: 'none'}}
            />
            <button onClick={sendChat} style={{width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-color)', color: 'black', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}>
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WatchRoom;
