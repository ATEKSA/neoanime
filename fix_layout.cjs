const fs = require('fs');

function fixLayout() {
  let lines = fs.readFileSync('src/Layout.jsx', 'utf8').split('\n');
  
  lines = lines.map(line => {
    if (line.includes('to="/catalog"')) {
      return line.replace(/>.*<\/Link>/, '>Каталог</Link>');
    }
    if (line.includes('to="/random"')) {
      return line.replace(/>.*<\/Link>/, '>Случайное</Link>');
    }
    if (line.includes('to="/lobbies"')) {
      return line.replace(/>.*<\/Link>/, '>Комнаты</Link>');
    }
    if (line.includes('className="search-input"')) {
      return line.replace(/placeholder=\".*?\"/, 'placeholder="Поиск аниме..."');
    }
    if (line.includes('className="search-loading"') && line.includes('...')) {
      return line.replace(/>.*?</, '>Поиск...<');
    }
    if (line.includes('className="search-loading"') && !line.includes('...')) {
      return line.replace(/>.*?</, '>Ничего не найдено<');
    }
    if (line.includes('className="search-view-all"')) {
      return line.replace(/>([^<]*)</, '>Смотреть все результаты<');
    }
    if (line.includes('showToast(') && line.includes('Premium')) {
      return line.replace(/showToast\([^)]+\)/, "showToast('Функция Premium пока в разработке!')");
    }
    if (line.includes('className="login-text"')) {
      if (line.includes('!currentUser')) {
        // wait, login button
      }
      return line.replace(/>([^<]*)</, '>Войти<');
    }
    if (line.includes('authMode === \'login\' ?') && line.includes('<h2>')) {
      return line.replace(/>([^<]*)</, ">{authMode === 'login' ? 'Вход в профиль' : 'Регистрация'}<");
    }
    if (line.includes('<label>') && line.includes('Kirito')) {
      return line.replace(/>([^<]*)</, '>Имя пользователя<');
    }
    if (line.includes('placeholder="') && line.includes('Kirito')) {
      return line.replace(/placeholder=\"[^\"]+\"/, 'placeholder="Например: Kirito"');
    }
    if (line.includes('<label>') && line.includes('password')) { // it doesn't have password, but maybe input type="password" is next
      // we'll handle this manually
    }
    if (line.includes('type="password"')) {
      // previous line is label
    }
    return line;
  });

  fs.writeFileSync('src/Layout.jsx', lines.join('\n'), 'utf8');
}

fixLayout();
