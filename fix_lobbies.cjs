const fs = require('fs');

let c = fs.readFileSync('src/Lobbies.jsx', 'utf8');

c = c.replace(/showToast\(\'\?\?\?\?\?\?\?\?\?\?\?, \?\?\?\?\?\? \?\?\?\?\?\?\?\?\?\?\ \?\?\?\?\?\?\?\?\?\?\?\'\)/g, "showToast('Авторизуйтесь, чтобы создать комнату')");
c = c.replace(/showToast\(\'\?\?\?\?\?\?\?\?\?\?\?\?\? \?\?\?\?\?\?\?\?\?\?\?\?\?\? 3 \?\?\?\?\?\?\?\?\?\?\?\?\'\)/g, "showToast('Название должно содержать минимум 3 символа')");
c = c.replace(/showToast\(response\.error \|\| \'\?\?\?\?\?\?\?\? \?\?\?\?\?\?\?\?\?\?\?\?\'\)/g, "showToast(response.error || 'Ошибка создания')");
c = c.replace(/showToast\(\'\?\?\?\?\?\?\?\?\?\?\?, \?\?\?\?\?\? \?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\'\)/g, "showToast('Авторизуйтесь, чтобы присоединиться')");
c = c.replace(/if \(response\.error === \'\?\?\?\?\?\?\?\?\?\ \?\?\?\?\?\?\'\) setJoinPassword\(\'\'\);/g, "if (response.error === 'Неверный пароль') setJoinPassword('');");

c = c.replace(/<Users color="var\(--accent-color\)" \/>\/h1>/g, '<Users color="var(--accent-color)" /> Совместный просмотр</h1>');
c = c.replace(/\{showCreate \? \'\?\?\?\?\?\?\?\?\?\' \: <><Plus size=\{18\} \/>\/\}<\/button>/g, "{showCreate ? 'Отмена' : <><Plus size={18} />Создать</>}</button>");
c = c.replace(/<h3 style=\{\{color: \'white\', marginBottom: \'15px\'\}\}>\/h3>/g, "<h3 style={{color: 'white', marginBottom: '15px'}}>Создание комнаты</h3>");

c = c.replace(/placeholder="\?\?\?\?\?\?\?\?\?\?\?\?\? \?\?\?\?\?\?\?\?\?\?\?\? \(\?\?\?\?\?: \?\?\?\?\?\?\?\?\?\ \?\?\?\?\?\?\)"/g, 'placeholder="Название комнаты (напр: Смотрим аниме)"');
c = c.replace(/placeholder="\?\?\?\?\?\?\? \(\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\)"/g, 'placeholder="Пароль (необязательно)"');
c = c.replace(/<input type="checkbox" checked=\{friendsOnly\} onChange=\{e => setFriendsOnly\(e\.target\.checked\)\} \/>\/label>/g, '<input type="checkbox" checked={friendsOnly} onChange={e => setFriendsOnly(e.target.checked)} /> Только для друзей</label>');
c = c.replace(/<button className="btn-save" onClick=\{handleCreate\} style=\{\{alignSelf: \'flex-start\', marginTop: \'10px\'\}\}>\/button>/g, '<button className="btn-save" onClick={handleCreate} style={{alignSelf: \'flex-start\', marginTop: \'10px\'}}>Создать комнату</button>');

c = c.replace(/\?\?\?\? \?\?\?\?\?\?\?\?\?\?\?\?\? \?\?\?\?\?\?\?\?\?\?\.\ \?\?\?\?\?\?\?\?\? \?\?\?\?\?\?\!\n\s*<\/div>/g, 'Нет активных комнат. Создайте первую!\n        </div>');

c = c.replace(/\?\?\?\?\?\?\?: <strong/g, 'Хост: <strong');
c = c.replace(/\? \?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?: \{l\.memberCount\}\/10/g, '| Участников: {l.memberCount}/10');
c = c.replace(/\?\?\?\?\?\?\?\?\?\?: \{l\.currentAnime\.name\}/g, 'Смотрят: {l.currentAnime.name}');

c = c.replace(/<button className="btn-save" onClick=\{\(\) => handleJoin\(l\.id, true\)\}>\/button>/g, '<button className="btn-save" onClick={() => handleJoin(l.id, true)}>Войти</button>');
c = c.replace(/<button className="btn-action" onClick=\{\(\) => setJoinRoomId\(null\)\}>\/button>/g, '<button className="btn-action" onClick={() => setJoinRoomId(null)}>Отмена</button>');

c = c.replace(/\{l\.memberCount >= 10 \? \'\?\?\?\?\?\?\?\?\?\?\?\?\?\?\' \: \'\?\?\?\?\?\?\'\}/g, "{l.memberCount >= 10 ? 'Переполнена' : 'Войти'}");

fs.writeFileSync('src/Lobbies.jsx', c, 'utf8');
