const fs = require('fs');
let c = fs.readFileSync('src/Layout.jsx', 'utf8');

c = c.replace(/<span className=\"login-text\">\?\?\?\?\?\?<\/span>/g, '<span className="login-text">Войти</span>');
c = c.replace(/\{authMode === \'login\' \? \'\?\?\?\?\ \?\ \?\?\?\?\?\?\?\' \: \'\?\?\?\?\?\?\?\?\?\?\'\}/g, "{authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}");
c = c.replace(/<label>\?\?\?\?\?\?\ \?\?\?\?\?\?\?\?\?\?\?\?\?<\/label>/g, '<label>Имя пользователя</label>');
c = c.replace(/<label>\?\?\?\?\?\?<\/label>/g, '<label>Пароль</label>');
c = c.replace(/placeholder=\"\?\?\?\?\?\?\?\:\ Kirito\"/g, 'placeholder="Например: Kirito"');
c = c.replace(/placeholder=\"\?\?\?\ \?\?\?\?\?\?\"/g, 'placeholder="Ваш пароль"');
c = c.replace(/\{authMode === \'login\' \? \'\?\?\?\?\?\' \: \'\?\?\?\?\?\?\?\?\?\?\'\}/g, "{authMode === 'login' ? 'Войти' : 'Создать аккаунт'}");
c = c.replace(/<>\?\?\?\ \?\?\?\?\?\?\?\?\ <span onClick=\{\(\) => \{ setAuthMode\(\'register\'\); setAuthError\(\'\'\); \}\}>\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?<\/span><\/>/g, "<>Нет аккаунта? <span onClick={() => { setAuthMode('register'); setAuthError(''); }}>Зарегистрироваться</span></>");
c = c.replace(/<>\?\?\?\ \?\?\?\?\ \?\?\?\?\?\?\?\?\ <span onClick=\{\(\) => \{ setAuthMode\(\'login\'\); setAuthError\(\'\'\); \}\}>\?\?\?\?\?<\/span><\/>/g, "<>Уже есть аккаунт? <span onClick={() => { setAuthMode('login'); setAuthError(''); }}>Войти</span></>");

fs.writeFileSync('src/Layout.jsx', c, 'utf8');
