const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { KodikParser } = require('anime-parsers-js');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

let parser = null;

const initParser = async () => {
  try {
    const token = await KodikParser.getToken();
    parser = new KodikParser(token);
    console.log('Kodik Parser initialized successfully!');
  } catch (err) {
    console.error('Failed to init parser:', err);
  }
};
initParser();

// PROXY ROUTE to bypass CORS on .m3u8 and .ts files
app.use('/proxy/:domain', (req, res, next) => {
  const domain = req.params.domain;
  return createProxyMiddleware({
    target: `https://${domain}`,
    changeOrigin: true,
    followRedirects: true,
    pathRewrite: { [`^/proxy/${domain}`]: '' },
    onProxyReq: (proxyReq, req, res) => {
      // Fake a European IP to bypass Russian copyright blocks on Kodik
      proxyReq.setHeader('X-Forwarded-For', '85.214.132.117');
      proxyReq.setHeader('X-Real-IP', '85.214.132.117');
      proxyReq.setHeader('Referer', 'https://shikimori.one/');
    }
  })(req, res, next);
});

app.get('/api/kodik', async (req, res) => {
  const { shikimori_id, episode = 1, translation_id } = req.query;
  if (!shikimori_id) return res.status(400).json({ error: 'Missing shikimori_id' });
  if (!parser) return res.status(500).json({ error: 'Parser not ready' });

  try {
    const info = await parser.getInfo(shikimori_id, 'shikimori');
    if (!info || !info.translations || info.translations.length === 0) {
      return res.status(404).json({ error: 'Anime not found' });
    }

    let translationId = translation_id || info.translations[0].id;
    let seriaNum = parseInt(episode, 10);
    if (info.series_count == null || info.series_count <= 1) seriaNum = 0;

    if (!translation_id) {
      for (const t of info.translations) {
        if (!t.name) continue;
        const match = t.name.match(/\((?:(\d+)[-~])?(\d+)\s*эп\./);
        if (match) {
          const start = match[1] ? parseInt(match[1], 10) : parseInt(match[2], 10);
          const end = parseInt(match[2], 10);
          if (seriaNum >= start && seriaNum <= end) {
            translationId = t.id;
            break;
          }
        }
      }
    }

    const m3u8Link = await parser.getM3u8PlaylistLink(shikimori_id, 'shikimori', seriaNum, translationId, 1080);
    const urlObj = new URL(m3u8Link);
    const domain = urlObj.hostname;
    const path = urlObj.pathname + urlObj.search;
    
    const protocol = req.protocol || 'http';
    const host = req.headers.host || 'localhost:3001';
    const proxyUrl = `${protocol}://${host}/proxy/${domain}${path}`;

    return res.json({ 
      success: true, url: proxyUrl, translations: info.translations,
      active_translation: translationId, episodes_total: info.series_count 
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- SIMPLE JSON DATABASE FOR USERS ---
const dbPath = path.join(__dirname, 'users.json');
const getDb = () => {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ users: {} }));
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
};
const saveDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

const generateFriendCode = (db) => {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (Object.values(db.users).some(u => u.profile?.friendCode === code));
  return code;
};

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Заполните все поля' });
  const db = getDb();
  if (db.users[username]) return res.status(400).json({ error: 'Пользователь уже существует' });
  
  db.users[username] = {
    username, password,
    profile: {
      friendCode: generateFriendCode(db),
      description: 'Привет! Я новый пользователь.',
      avatar: 'https://ui-avatars.com/api/?name=' + username + '&background=00f0ff&color=000',
      friends: [], friendRequests: [],
      tierList: { 'S': [], 'A': [], 'B': [], 'C': [], 'Trash': [] }
    }
  };
  saveDb(db);
  res.json({ success: true, username, profile: db.users[username].profile });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();
  const user = db.users[username];
  if (!user || user.password !== password) return res.status(401).json({ error: 'Неверный логин или пароль' });
  
  // Ensure structure exists for old accounts
  if (!user.profile.friends) user.profile.friends = [];
  if (!user.profile.friendRequests) user.profile.friendRequests = [];
  if (!user.profile.friendCode) user.profile.friendCode = generateFriendCode(db);
  saveDb(db);

  res.json({ success: true, username, profile: user.profile });
});

app.get('/api/profile/:username', (req, res) => {
  const db = getDb();
  const user = db.users[req.params.username];
  if (!user) return res.status(404).json({ error: 'Профиль не найден' });
  
  if (!user.profile.friendCode) {
    user.profile.friendCode = generateFriendCode(db);
    saveDb(db);
  }
  
  res.json({ username: user.username, profile: user.profile });
});

app.post('/api/profile/update', (req, res) => {
  const { username, profileData } = req.body;
  const db = getDb();
  if (!db.users[username]) return res.status(404).json({ error: 'Пользователь не найден' });
  db.users[username].profile = { ...db.users[username].profile, ...profileData };
  saveDb(db);
  res.json({ success: true, profile: db.users[username].profile });
});

// FRIENDS API
app.post('/api/friends/add', (req, res) => {
  const { sender, receiver } = req.body;
  const db = getDb();
  if (!db.users[sender] || !db.users[receiver]) return res.status(404).json({ error: 'Пользователь не найден' });
  
  if (!db.users[receiver].profile.friendRequests) db.users[receiver].profile.friendRequests = [];
  if (!db.users[receiver].profile.friendRequests.includes(sender)) {
    db.users[receiver].profile.friendRequests.push(sender);
    saveDb(db);
  }
  res.json({ success: true, message: 'Заявка отправлена' });
});

app.post('/api/friends/add_by_code', (req, res) => {
  const { sender, code } = req.body;
  const db = getDb();
  
  if (!db.users[sender]) return res.status(404).json({ error: 'Ваш профиль не найден' });
  
  // Find the receiver by friendCode
  const receiverEntry = Object.entries(db.users).find(([_, user]) => user.profile?.friendCode === code);
  
  if (!receiverEntry) {
    return res.status(404).json({ error: 'Код недействителен или пользователь не найден' });
  }
  
  const receiverUsername = receiverEntry[0];
  
  if (receiverUsername === sender) {
    return res.status(400).json({ error: 'Вы не можете добавить себя в друзья' });
  }
  
  if (db.users[sender].profile.friends.includes(receiverUsername)) {
    return res.status(400).json({ error: 'Вы уже друзья с этим пользователем' });
  }

  const receiverProfile = db.users[receiverUsername].profile;
  if (!receiverProfile.friendRequests) receiverProfile.friendRequests = [];
  
  if (receiverProfile.friendRequests.includes(sender)) {
    return res.status(400).json({ error: 'Заявка уже отправлена' });
  }

  receiverProfile.friendRequests.push(sender);
  saveDb(db);
  
  res.json({ success: true, message: `Заявка отправлена пользователю ${receiverUsername}` });
});

app.post('/api/friends/accept', (req, res) => {
  const { username, sender } = req.body;
  const db = getDb();
  if (!db.users[username] || !db.users[sender]) return res.status(404).json({ error: 'User not found' });

  // Remove from requests
  db.users[username].profile.friendRequests = db.users[username].profile.friendRequests.filter(u => u !== sender);
  
  // Add to friends
  if (!db.users[username].profile.friends) db.users[username].profile.friends = [];
  if (!db.users[sender].profile.friends) db.users[sender].profile.friends = [];
  
  if (!db.users[username].profile.friends.includes(sender)) db.users[username].profile.friends.push(sender);
  if (!db.users[sender].profile.friends.includes(username)) db.users[sender].profile.friends.push(username);

  saveDb(db);
  res.json({ success: true, profile: db.users[username].profile });
});

// COMMENTS DB
const commentsPath = path.join(__dirname, 'comments.json');
const getCommentsDb = () => {
  if (!fs.existsSync(commentsPath)) fs.writeFileSync(commentsPath, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(commentsPath, 'utf8'));
};
const saveCommentsDb = (data) => fs.writeFileSync(commentsPath, JSON.stringify(data, null, 2));

app.get('/api/comments/:animeId', (req, res) => res.json(getCommentsDb()[req.params.animeId] || []));
app.post('/api/comments/:animeId', (req, res) => {
  const { username, avatar, text } = req.body;
  if (!username || !text) return res.status(400).json({ error: 'Пустой комментарий' });
  const db = getCommentsDb();
  if (!db[req.params.animeId]) db[req.params.animeId] = [];
  const newComment = { id: Date.now().toString(), username, avatar, text, date: new Date().toISOString() };
  db[req.params.animeId].push(newComment);
  saveCommentsDb(db);
  res.json({ success: true, comment: newComment });
});

// WATCH TOGETHER (WEBSOCKETS)
let lobbies = {}; // roomId -> { id, name, host, password, friendsOnly, members: [{id, username, avatar}], currentAnime: {id, name, ep}, playerState: {time, playing} }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('get_lobbies', () => {
    // Send public lobbies
    const publicLobbies = Object.values(lobbies).map(l => ({
      id: l.id, name: l.name, host: l.host, 
      hasPassword: !!l.password, friendsOnly: l.friendsOnly, 
      memberCount: l.members.length, currentAnime: l.currentAnime
    }));
    socket.emit('lobbies_list', publicLobbies);
  });

  socket.on('create_lobby', (data, callback) => {
    const { name, host, password, friendsOnly, hostAvatar } = data;
    const roomId = Date.now().toString();
    lobbies[roomId] = {
      id: roomId, name, host, password, friendsOnly,
      members: [{ id: socket.id, username: host, avatar: hostAvatar }],
      currentAnime: null,
      playerState: { time: 0, playing: false }
    };
    socket.join(roomId);
    callback({ success: true, roomId });
    io.emit('lobbies_list', Object.values(lobbies).map(l => ({
      id: l.id, name: l.name, host: l.host, hasPassword: !!l.password, friendsOnly: l.friendsOnly, memberCount: l.members.length
    })));
  });

  socket.on('join_lobby', (data, callback) => {
    const { roomId, username, password, avatar } = data;
    const lobby = lobbies[roomId];
    if (!lobby) return callback({ error: 'Лобби не найдено' });
    if (lobby.members.length >= 10) return callback({ error: 'Лобби переполнено (макс 10 человек)' });
    const existingMember = lobby.members.find(m => m.username === username);

    // Only verify password and friends if this is a new join (not a reconnect/redirect)
    if (!existingMember) {
      const cleanLobbyPass = lobby.password ? String(lobby.password).trim().toLowerCase() : '';
      const cleanJoinPass = password ? String(password).trim().toLowerCase() : '';
      if (cleanLobbyPass && cleanLobbyPass !== cleanJoinPass && lobby.host !== username) {
        return callback({ error: `Неверный пароль (ожидалось: "${cleanLobbyPass}", введено: "${cleanJoinPass}")` });
      }
      // Check friends only
      if (lobby.friendsOnly && lobby.host !== username) {
        const db = getDb();
        const hostUser = db.users[lobby.host];
        if (!hostUser || !hostUser.profile.friends.includes(username)) {
          return callback({ error: 'Лобби только для друзей хоста' });
        }
      }
    }

    // We already found existingMember above.
    if (existingMember) {
      existingMember.id = socket.id;
    } else {
      lobby.members.push({ id: socket.id, username, avatar });
    }
    
    socket.join(roomId);
    io.to(roomId).emit('room_update', lobby);
    callback({ success: true, lobby });
    io.emit('lobbies_list', Object.values(lobbies).map(l => ({
      id: l.id, name: l.name, host: l.host, hasPassword: !!l.password, friendsOnly: l.friendsOnly, memberCount: l.members.length
    })));
  });

  socket.on('leave_lobby', (roomId) => {
    const lobby = lobbies[roomId];
    if (lobby) {
      lobby.members = lobby.members.filter(m => m.id !== socket.id);
      socket.leave(roomId);
      if (lobby.members.length === 0) {
        setTimeout(() => {
          if (lobbies[roomId] && lobbies[roomId].members.length === 0) {
            delete lobbies[roomId];
            io.emit('lobbies_list', Object.values(lobbies).map(l => ({
              id: l.id, name: l.name, host: l.host, hasPassword: !!l.password, friendsOnly: l.friendsOnly, memberCount: l.members.length
            })));
          }
        }, 5000);
      } else {
        io.to(roomId).emit('room_update', lobby);
      }
      io.emit('lobbies_list', Object.values(lobbies).map(l => ({
        id: l.id, name: l.name, host: l.host, hasPassword: !!l.password, friendsOnly: l.friendsOnly, memberCount: l.members.length
      })));
    }
  });

  socket.on('change_anime', (data) => {
    const { roomId, anime } = data;
    if (lobbies[roomId]) {
      lobbies[roomId].currentAnime = anime;
      lobbies[roomId].playerState = { time: 0, playing: false };
      io.to(roomId).emit('room_update', lobbies[roomId]);
    }
  });

  socket.on('take_host', (data) => {
    const { roomId, username } = data;
    if (lobbies[roomId]) {
      lobbies[roomId].host = username;
      io.to(roomId).emit('room_update', lobbies[roomId]);
    }
  });

  socket.on('player_action', (data) => {
    const { roomId, action, time } = data; // action: 'play' | 'pause' | 'seek'
    if (lobbies[roomId]) {
      lobbies[roomId].playerState.time = time;
      if (action === 'play') lobbies[roomId].playerState.playing = true;
      if (action === 'pause') lobbies[roomId].playerState.playing = false;
      // Broadcast to EVERYONE ELSE in the room
      socket.to(roomId).emit('sync_player', { action, time });
    }
  });

  socket.on('send_chat', (data) => {
    const { roomId, username, text } = data;
    io.to(roomId).emit('receive_chat', { username, text, time: new Date().toISOString() });
  });

  // WebRTC Signaling
  socket.on('webrtc_offer', (data) => {
    io.to(data.targetId).emit('webrtc_offer', { senderId: socket.id, offer: data.offer });
  });
  socket.on('webrtc_answer', (data) => {
    io.to(data.targetId).emit('webrtc_answer', { senderId: socket.id, answer: data.answer });
  });
  socket.on('webrtc_ice_candidate', (data) => {
    io.to(data.targetId).emit('webrtc_ice_candidate', { senderId: socket.id, candidate: data.candidate });
  });

  socket.on('disconnect', () => {
    // Find all rooms this socket was in
    for (const roomId in lobbies) {
      const lobby = lobbies[roomId];
      if (lobby.members.some(m => m.id === socket.id)) {
        lobby.members = lobby.members.filter(m => m.id !== socket.id);
        if (lobby.members.length === 0) {
          setTimeout(() => {
            if (lobbies[roomId] && lobbies[roomId].members.length === 0) {
              delete lobbies[roomId];
              io.emit('lobbies_list', Object.values(lobbies).map(l => ({
                id: l.id, name: l.name, host: l.host, hasPassword: !!l.password, friendsOnly: l.friendsOnly, memberCount: l.members.length
              })));
            }
          }, 5000);
        } else {
          io.to(roomId).emit('room_update', lobby);
        }
      }
    }
  });
});

// Serve Vite Frontend in Production
app.use(express.static(path.join(__dirname, '../dist')));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend proxy running on port ${PORT}`);
});
