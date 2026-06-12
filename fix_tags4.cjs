const fs = require('fs');

let c = fs.readFileSync('src/Profile.jsx', 'utf8');
c = c.replace(/\\/>\\/h2>/g, '></h2>');
c = c.split('>/h2>').join('></h2>');
fs.writeFileSync('src/Profile.jsx', c, 'utf8');
