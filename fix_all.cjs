const fs = require('fs');

const files = ['src/AnimeDetails.jsx', 'src/Catalog.jsx', 'src/CollectionView.jsx', 'src/Lobbies.jsx', 'src/Profile.jsx', 'src/WatchRoom.jsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Clean up React text nodes: >??????<
  content = content.replace(/>[\uFFFD?]+\s*</g, '> Текст <');
  content = content.replace(/>\s*[\uFFFD?]+\s*</g, '> Текст <');
  content = content.replace(/>[\uFFFD?\s]+</g, '> Текст <');
  
  // Specific replacements
  if (file === 'src/Profile.jsx') {
    content = content.replace(/<h2>[\uFFFD?\s]+ \{(.*)\}<\/h2>/g, "<h2>Профиль пользователя {$1}</h2>");
    content = content.replace(/\{showAddForm \? \'[\uFFFD?]+\' : <><Plus size=\{18\}\/> [\uFFFD?\s]+<\/>\}/g, "{showAddForm ? 'Отмена' : <><Plus size={18}/> Добавить друга</>}");
    content = content.replace(/placeholder=\"[\uFFFD?\s:]+\.\.\.\"/g, 'placeholder="ID друга..."');
  }
  
  // Replace toast messages
  content = content.replace(/showToast\(\'[\uFFFD?\s!]+\'\)/g, "showToast('Успешно')");
  content = content.replace(/showToast\(\`[\uFFFD?\s!:]+\$\{.*\}\`\)/g, "showToast(`Успешно`)");

  // Replace error messages
  content = content.replace(/setError\(\'[\uFFFD?\s!]+\'\)/g, "setError('Ошибка')");

  // General attributes
  content = content.replace(/placeholder=\"[\uFFFD?\s]+\"/g, 'placeholder="Ввод..."');

  fs.writeFileSync(file, content, 'utf8');
});
