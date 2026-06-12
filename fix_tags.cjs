const fs = require('fs');

['src/Lobbies.jsx', 'src/CollectionView.jsx', 'src/Profile.jsx'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.split('>/button>').join('></button>');
  c = c.split('>/div>').join('></div>');
  c = c.split('>/label>').join('></label>');
  c = c.split('>/h1>').join('></h1>');
  c = c.split('>/h3>').join('></h3>');
  c = c.split('/>/>}').join('/></>}');
  fs.writeFileSync(f, c, 'utf8');
});
