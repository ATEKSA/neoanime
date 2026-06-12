const fs = require('fs');

let a = fs.readFileSync('src/AnimeDetails.jsx', 'utf8');
a = a.split('const KODIK_SERVER = /api/kodik`;').join('const KODIK_SERVER = `/api/kodik`;');
a = a.split('fetch(/api/comments/${code}`);').join('fetch(`/api/comments/${code}`);');
a = a.split('fetch(/api/profile/update`, {').join('fetch(`/api/profile/update`, {');
a = a.split('fetch(/api/comments/${code}`, {').join('fetch(`/api/comments/${code}`, {');
fs.writeFileSync('src/AnimeDetails.jsx', a, 'utf8');

let w = fs.readFileSync('src/WatchRoom.jsx', 'utf8');
w = w.split('let url = /api/kodik?shikimori_id=${id}&episode=${episode}`;').join('let url = `/api/kodik?shikimori_id=${id}&episode=${episode}`;');
fs.writeFileSync('src/WatchRoom.jsx', w, 'utf8');
