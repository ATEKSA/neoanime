const fs = require('fs');

let w = fs.readFileSync('src/WatchRoom.jsx', 'utf8');
w = w.split('fetch(/proxy/shikimori.one/api/animes?search=${encodeURIComponent(q)}&limit=5`);').join('fetch(`/proxy/shikimori.one/api/animes?search=${encodeURIComponent(q)}&limit=5`);');
fs.writeFileSync('src/WatchRoom.jsx', w, 'utf8');
