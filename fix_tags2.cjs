const fs = require('fs');

let c = fs.readFileSync('src/Profile.jsx', 'utf8');
c = c.split('>/span>').join('></span>');
fs.writeFileSync('src/Profile.jsx', c, 'utf8');
