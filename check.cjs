const fs = require('fs');
['src/AnimeDetails.jsx', 'src/WatchRoom.jsx', 'src/CustomPlayer.jsx', 'src/Lobbies.jsx'].forEach(f => {
  let txt = fs.readFileSync(f, 'utf8');
  let m = txt.match(/['">][^'">]*?[\uFFFD?][^'">]*?['"<]/g) || [];
  console.log('--- ' + f + ' ---');
  m.forEach(s => console.log(s));
});
