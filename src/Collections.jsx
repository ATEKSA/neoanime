import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Plus, FolderHeart, Trash2 } from 'lucide-react';


const BAD_WORDS = ['хуй', 'пизд', 'ебан', 'блять', 'сука', 'fuck', 'shit', 'bitch', 'шлюха', 'уебок', 'хер'];
const isProfane = (str) => {
  const s = str.toLowerCase();
  return BAD_WORDS.some(w => s.includes(w));
};

const Collections = () => {
  const { currentUser, setCurrentUser, showToast } = useOutletContext();
  const [showCreate, setShowCreate] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const handleCreate = async () => {
    if (!currentUser) return showToast('Авторизуйтесь в профиле');
    if (newCollectionName.length < 3) return showToast('Название слишком короткое (мин 3 символа)');
    if (isProfane(newCollectionName)) return showToast('Название содержит нецензурные слова!');
    
    const newCollection = {
      id: Date.now().toString(),
      name: newCollectionName,
      items: [],
      createdAt: new Date().toISOString()
    };

    const updatedCollections = [...(currentUser.profile?.collections || []), newCollection];

    try {
      const res = await fetch(`/api/profile/update`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          username: currentUser.username,
          profile: { ...currentUser.profile, collections: updatedCollections }
        })
      });
      if(res.ok) {
        showToast('Коллекция создана!');
        const updatedUser = { ...currentUser, profile: { ...currentUser.profile, collections: updatedCollections }};
        setCurrentUser(updatedUser);
        localStorage.setItem('neoanime_user', JSON.stringify(updatedUser));
        setNewCollectionName('');
        setShowCreate(false);
      } else {
        showToast('Ошибка при создании');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!currentUser) {
    return (
      <div className="collections-container" style={{textAlign: 'center', paddingTop: '100px'}}>
        <h2>Авторизуйтесь в профиле, чтобы создавать коллекции</h2>
      </div>
    );
  }

  const collections = currentUser.profile?.collections || [];

  return (
    <div className="collections-container">
      <div className="collections-header">
        <h1 style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <FolderHeart color="var(--accent-color)" /> Мои коллекции
        </h1>
        <button className="btn-create" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Отмена' : <><Plus size={18} /> Создать коллекцию</>}
        </button>
      </div>

      {showCreate && (
        <div className="create-collection-card">
          <h3 style={{color: 'white', marginBottom: '15px'}}>Новая коллекция</h3>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <input 
              type="text" 
              placeholder="Название (например: Любимые аниме)" 
              value={newCollectionName}
              onChange={e => setNewCollectionName(e.target.value)}
              className="collection-input"
            />
            <button className="btn-save" onClick={handleCreate}>Сохранить</button>
          </div>
          <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px'}}>
            * К названиям применяется фильтр мата.
          </p>
        </div>
      )}

      <div className="collections-grid">
      {collections.length === 0 ? (
        <div style={{color: 'var(--text-secondary)', padding: '2rem 0', gridColumn: '1 / -1'}}>
          У вас еще нет коллекций. Создайте первую!
        </div>
      ) : (
        collections.map(col => (
          <Link to={`/collection/${col.id}`} key={col.id} className="collection-card">
            <div className="collection-icon">
              <FolderHeart size={40} color="var(--accent-color)" />
            </div>
            <div className="collection-info">
              <h3>{col.name}</h3>
              <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>{col.items?.length || 0} тайтлов</div>
            </div>
          </Link>
        ))
      )}
      </div>
    </div>
  );
};

export default Collections;
