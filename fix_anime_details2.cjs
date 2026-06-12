const fs = require('fs');

let c = fs.readFileSync('src/AnimeDetails.jsx', 'utf8');

c = c.replace(/<span className="fallback-title" style=\{\{ fontSize: \'0.8rem\', opacity: 0.5 \}\}>[^<]+<\/span>/g, '<span className="fallback-title" style={{ fontSize: \'0.8rem\', opacity: 0.5 }}>Загрузка...</span>');
c = c.replace(/showToast\(\'[^\']+\'\);/g, "showToast('Успешно');");
c = c.replace(/showToast\(`[^`]+`\);/g, "showToast(`Успешно`);");
c = c.replace(/<span className="stat-label">Текст<\/span>/g, '<span className="stat-label">Информация</span>');
c = c.replace(/\{shikimoriAnime\.status === \'released\' \? \'\?\?\?\?\?\?\?\' \: \'\?\?\?\?\?\?\?\?\?\?\?\?\?\?\'\}/g, "{shikimoriAnime.status === 'released' ? 'Вышел' : 'Онгоинг'}");
c = c.replace(/\{userRating > 0 \? \`\$\{userRating\}\/10 \(\?\?\?\?\?\?\)\` \: \`\$\{shikimoriAnime\.score \|\| \'\?\'\}\/10\`\}/g, "{userRating > 0 ? `${userRating}/10 (Ваша)` : `${shikimoriAnime.score || '?'}/10`}");
c = c.replace(/<p dangerouslySetInnerHTML=\{\{__html: shikimoriAnime\.description_html \|\| shikimoriAnime\.description \|\| \'[^\']+\'\}\} \/>/g, "<p dangerouslySetInnerHTML={{__html: shikimoriAnime.description_html || shikimoriAnime.description || 'Описание отсутствует.'}} />");
c = c.replace(/<h3 style=\{\{fontFamily: \'var\(--font-heading\)\', fontSize: \'1\.5rem\', marginBottom: \'1rem\', color: \'var\(--accent-color\)\'\}\}>\s*[^\s<]+\s*<\/h3>/g, "<h3 style={{fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-color)'}}>Смотреть онлайн</h3>");
c = c.replace(/<div style=\{\{padding: \'5rem\', textAlign: \'center\'\}\}>Текст<\/div>/g, "<div style={{padding: '5rem', textAlign: 'center'}}>Выберите плеер</div>");
c = c.replace(/<h3 style=\{\{fontFamily: \'var\(--font-heading\)\', fontSize: \'1\.5rem\', marginBottom: \'1rem\', color: \'var\(--accent-color\)\', display: \'flex\', alignItems: \'center\', gap: \'10px\'\}\}>\s*<MessageSquare size=\{24\} \/> [^\(]+ \(\{comments\.length\}\)\s*<\/h3>/g, "<h3 style={{fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '10px'}}>\n            <MessageSquare size={24} /> Комментарии ({comments.length})\n          </h3>");
c = c.replace(/<div style=\{\{color: \'var\(--text-secondary\)\', fontStyle: \'italic\', padding: \'1rem\', background: \'rgba\(255,255,255,0.02\)\', borderRadius: \'12px\'\}\}>\s*[^<]+\s*<\/div>/g, "<div style={{color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px'}}>\n                Здесь пока нет комментариев. Напишите первым!\n              </div>");
c = c.replace(/placeholder=\{currentUser \? "[^"]+" : "[^"]+"\}/g, 'placeholder={currentUser ? "Написать комментарий..." : "Войдите, чтобы писать комментарии"}');

fs.writeFileSync('src/AnimeDetails.jsx', c, 'utf8');

let w = fs.readFileSync('src/WatchRoom.jsx', 'utf8');
w = w.replace(/<h2>[^<]+<\/h2>/g, '<h2>Плеер загружается...</h2>');
w = w.replace(/<div style=\{\{color: \'var\(--accent-color\)\', fontSize: \'0\.9rem\'\}\}>[^:]+: \{roomData\.host\}<\/div>/g, "<div style={{color: 'var(--accent-color)', fontSize: '0.9rem'}}>Хост: {roomData.host}</div>");
w = w.replace(/<h3 style=\{\{color: \'white\', margin: 0, fontSize: \'1rem\', display: \'flex\', alignItems: \'center\', gap: \'5px\'\}\}>\s*<Users size=\{16\} \/> [^\(]+ \(\{roomData\.members\.length\}\/10\)\s*<\/h3>/g, "<h3 style={{color: 'white', margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '5px'}}>\n              <Users size={16} /> Участники ({roomData.members.length}/10)\n            </h3>");
w = w.replace(/title=\{micEnabled \? "[^"]+" : "[^"]+"\}/g, 'title={micEnabled ? "Выключить микрофон" : "Включить микрофон"}');
w = w.replace(/<div style=\{\{padding: \'15px\', background: \'rgba\(0,0,0,0\.5\)\', borderBottom: \'1px solid var\(--border-color\)\', color: \'white\', fontWeight: \'bold\'\}\}>Текст<\/div>/g, "<div style={{padding: '15px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid var(--border-color)', color: 'white', fontWeight: 'bold'}}>Чат комнаты</div>");

fs.writeFileSync('src/WatchRoom.jsx', w, 'utf8');

// CustomPlayer labels
let p = fs.readFileSync('src/CustomPlayer.jsx', 'utf8');
p = p.replace(/label="[^"]+"/g, 'label="Настройки"');
fs.writeFileSync('src/CustomPlayer.jsx', p, 'utf8');
