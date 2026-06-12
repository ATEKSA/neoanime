const fs = require('fs');

function fixProfile() {
  let c = fs.readFileSync('src/Profile.jsx', 'utf8');
  
  c = c.replace(/<p>[\uFFFD?\s]+ \[\?\?\?\]\.\.\.<\/p>/g, "<p>Загрузка профиля...</p>");
  c = c.replace(/<h2>[\uFFFD?\s]+ \?\? [\uFFFD?\s]+<\/h2>/g, "<h2>Профиль не найден</h2>");
  c = c.replace(/>[\uFFFD?\s]+</g, "> Редактировать <");
  // wait, replacing all nodes is dangerous.
  
  fs.writeFileSync('src/Profile.jsx', c, 'utf8');
}

fixProfile();
