const fs = require('fs');

let c = fs.readFileSync('src/Profile.jsx', 'utf8');
c = c.split('<h2>/h2>').join('<h2></h2>');
fs.writeFileSync('src/Profile.jsx', c, 'utf8');
