const fs = require('fs');

function replaceLines(filename, replacements) {
  let lines = fs.readFileSync(filename, 'utf8').split('\n');
  for (let [lineNumber, newText] of replacements) {
    let i = lineNumber - 1; // 0-indexed
    // Keep leading whitespace
    let leading = lines[i].match(/^\s*/)[0];
    lines[i] = leading + newText;
  }
  fs.writeFileSync(filename, lines.join('\n'), 'utf8');
}

replaceLines('src/AnimeDetails.jsx', [
  [34, '<span className="fallback-title" style={{ fontSize: \'0.8rem\', opacity: 0.5 }}>Загрузка...</span>'],
  [69, "showToast('К сожалению, видео недоступно.');"],
  [74, "showToast('Ищем альтернативный плеер (Anilibria)...');"],
  [86, "translations: [{id: 'anilibria', name: 'Anilibria (Озвучка)'}],"],
  [92, "showToast('Используется плеер Anilibria!');"],
  [97, "showToast('К сожалению, видео недоступно.');"],
  [100, "showToast('Ищем альтернативный плеер...');"],
  [119, "showToast('Плеер временно недоступен');"],
  [208, "showToast('Авторизуйтесь, чтобы продолжить');"],
  [229, "if (errorMsg) showToast('Ошибка при обновлении');"],
  [243, "const success = await updateProfileData({ favorites: newFavs }, isFavorite ? 'Удалено из избранного' : 'Добавлено в избранное', 'Ошибка при обновлении');"],
  [256, "const success = await updateProfileData({ watchlist: newWl }, inWatchlist ? 'Удалено из \"Буду смотреть\"' : 'Добавлено в \"Буду смотреть\"', 'Ошибка при обновлении');"],
  [263, "const success = await updateProfileData({ ratings: newRatings }, `Оценка установлена на ${score}/10!`, 'Ошибка при обновлении оценки');"],
  [272, "showToast('Ссылка скопирована в буфер обмена!');"],
  [277, "showToast('Авторизуйтесь, чтобы написать комментарий');"],
  [296, "showToast('Комментарий отправлен');"],
  [299, "showToast('Ошибка отправки комментария');"],
  [306, "Загрузка аниме..."],
  [312, "return <div style={{textAlign: 'center', padding: '5rem', fontSize: '1.2rem'}}>Аниме не найдено</div>;"],
  [331, "Смотреть онлайн"],
  [335, '<button className={`btn-action ${isFavorite ? \'active\' : \'\'}`} onClick={handleFavorite} title="В избранное">'],
  [338, '<button className={`btn-action ${inWatchlist ? \'active\' : \'\'}`} onClick={handleWatchlist} title="Буду смотреть">'],
  [341, '<button className="btn-action" onClick={scrollToComments} title="Комментарии">'],
  [345, '<button className={`btn-action ${userRating > 0 ? \'active\' : \'\'}`} onClick={() => {if(currentUser) setShowRatingModal(!showRatingModal); else showToast(\'Авторизуйтесь, чтобы оценить\');}} title="Оценить">'],
  [359, '<button className="btn-action" onClick={handleShare} title="Поделиться">'],
  [375, '<span className="stat-label">Год выпуска</span>'],
  [379, '<span className="stat-label">Статус</span>'],
  [380, '<span className="stat-value">{shikimoriAnime.status === \'released\' ? \'Вышел\' : \'Онгоинг\'}</span>'],
  [383, '<span className="stat-label">Эпизоды</span>'],
  [387, '<span className="stat-label">Оценка</span>'],
  [388, '<span className="stat-value"><Star size={16} color="gold" fill="gold" /> {userRating > 0 ? `${userRating}/10 (Ваша)` : `${shikimoriAnime.score || \'?\'}/10`}</span>'],
  [393, '<p dangerouslySetInnerHTML={{__html: shikimoriAnime.description_html || shikimoriAnime.description || \'Описание отсутствует.\'}} />'],
  [398, 'Онлайн-плеер'],
  [403, '<div style={{padding: \'5rem\', textAlign: \'center\'}}>Загрузка плеера...</div>'],
  [418, '<div style={{padding: \'5rem\', textAlign: \'center\'}}>Выберите плеер для просмотра</div>'],
  [426, '<MessageSquare size={24} /> Комментарии ({comments.length})'],
  [432, 'Здесь пока нет комментариев. Напишите первым!'],
  [458, 'placeholder={currentUser ? "Написать комментарий..." : "Авторизуйтесь, чтобы писать комментарии"}'],
  [469, '<Send size={16} /> Отправить']
]);

replaceLines('src/WatchRoom.jsx', [
  [76, "showToast('Ошибка при подключении к комнате');"],
  [91, "showToast('Авторизуйтесь, чтобы управлять');"],
  [132, "showToast(response.error || 'Ошибка подключения к комнате');"],
  [238, "if (!roomData) return <div style={{padding: '5rem', textAlign: 'center'}}>Подключение к комнате...</div>;"],
  [251, "<div style={{color: 'var(--accent-color)', fontSize: '0.9rem'}}>Хост: {roomData.host}</div>"],
  [256, "Взять хост"],
  [260, "<LogOut size={18} /> Выйти"],
  [300, "Только хост может управлять плеером"],
  [307, "<h2>Плеер не запущен...</h2>"],
  [320, 'placeholder="Хост: Поиск аниме для просмотра..."'],
  [349, '<Users size={16} /> Участники ({roomData.members.length}/10)'],
  [354, 'title={micEnabled ? "Выключить микрофон" : "Включить микрофон"}'],
  [378, 'Чат комнаты'],
  [396, 'placeholder="Введите сообщение..."']
]);

replaceLines('src/CustomPlayer.jsx', [
  [237, "setSkipIndicator({ type: 'forward', text: '+ 5 сек', key: Date.now() });"],
  [240, "setSkipIndicator({ type: 'backward', text: '- 5 сек', key: Date.now() });"],
  [801, '<h2 style={{color: \'#ff4444\', marginBottom: \'10px\'}}>Видео недоступно или заблокировано</h2>'],
  [803, 'К сожалению, данный провайдер заблокировал доступ к видео в вашем регионе (Kodik).'],
  [805, 'Попробуйте <strong>сменить сервер</strong> (нажмите шестеренку и выберите другой) или включите VPN.'],
  [827, '<div className="resume-prompt-title">Продолжить просмотр с {formatTime(resumePromptTime)}?</div>'],
  [829, '<button className="resume-btn" onClick={handleResume}>Продолжить</button>'],
  [830, '<button className="resume-btn-sec" onClick={handleIgnoreResume}>Сначала</button>'],
  [881, 'label="Настройки"'],
  [889, 'options={Array.from({length: kodikData.episodes_total}, (_, i) => i + 1).map(ep => ({ value: ep, label: `${ep} серия`, shortLabel: `${ep} эп.` }))}'],
  [890, 'label="Эпизод"'],
  [903, '<button onClick={() => onEpisodeChange(activeEpisode + 1)} className="control-btn" title="Следующий эпизод">']
]);

replaceLines('src/Lobbies.jsx', [
  [35, "if (!currentUser) return showToast('Авторизуйтесь, чтобы создать комнату');"],
  [36, "if (newRoomName.length < 3) return showToast('Название должно содержать минимум 3 символа');"],
  [46, "showToast('Комната успешно создана!');"],
  [49, "showToast(response.error || 'Ошибка создания комнаты');"],
  [55, "if (!currentUser) return showToast('Авторизуйтесь, чтобы присоединиться');"],
  [72, "if (response.error === 'Неверный пароль') setJoinPassword('');"],
  [81, '<Users color="var(--accent-color)" /> Совместный просмотр'],
  [84, '{showCreate ? \'Отмена\' : <><Plus size={18} /> Создать комнату</>}'],
  [90, '<h3 style={{color: \'white\', marginBottom: \'15px\'}}>Создание комнаты</h3>'],
  [94, 'placeholder="Название комнаты (напр: Смотрим аниме)"'],
  [101, 'placeholder="Пароль (необязательно)"'],
  [108, 'Только для друзей'],
  [111, 'Создать'],
  [119, 'Нет активных комнат. Создайте первую!'],
  [132, 'Хост: <strong style={{color: \'var(--accent-color)\'}}>{l.host}</strong> | Участников: {l.memberCount}/10'],
  [136, 'Смотрят: {l.currentAnime.name}'],
  [145, 'placeholder="Пароль..."'],
  [150, '<button className="btn-save" onClick={() => handleJoin(l.id, true)}>Войти</button>'],
  [151, '<button className="btn-action" onClick={() => setJoinRoomId(null)}>Отмена</button>'],
  [160, "{l.memberCount >= 10 ? 'Переполнена' : 'Войти'}"]
]);
