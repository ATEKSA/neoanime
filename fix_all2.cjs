const fs = require('fs');

const files = ['src/Catalog.jsx', 'src/AnimeDetails.jsx', 'src/CollectionView.jsx', 'src/Lobbies.jsx', 'src/Profile.jsx', 'src/WatchRoom.jsx'];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');

  // Generic replacements for UI elements where text is corrupted
  // Matches any sequence containing lots of replacement characters
  c = c.replace(/>\s*[\uFFFD?]+(?:\s+[\uFFFD?]+)*\s*</g, '>Текст<');
  c = c.replace(/placeholder="[\uFFFD?\s\.\:]+"/g, 'placeholder="Введите значение..."');
  c = c.replace(/showToast\(['"`][\uFFFD?\s\!\.]+['"`]\)/g, "showToast('Успешно')");
  c = c.replace(/showToast\(`[\uFFFD?\s\!\.\:]+\$\{([^}]+)\}`\)/g, "showToast(`Успешно: ${$1}`)");
  c = c.replace(/setError\(['"`][\uFFFD?\s\!\.]+['"`]\)/g, "setError('Ошибка')");
  
  if (f.includes('Catalog.jsx')) {
    c = c.replace(/<h1>[\uFFFD?\s]+<\/h1>/g, '<h1>Каталог</h1>');
  }

  fs.writeFileSync(f, c, 'utf8');
});
