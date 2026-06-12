import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Home from './Home';
import AnimeDetails from './AnimeDetails';
import Catalog from './Catalog';
import Profile from './Profile';
import Collections from './Collections';
import CollectionView from './CollectionView';
import Lobbies from './Lobbies';
import WatchRoom from './WatchRoom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="anime/:code" element={<AnimeDetails />} />
          <Route path="profile/:username" element={<Profile />} />
          <Route path="collections" element={<Collections />} />
          <Route path="collection/:username/:collectionId" element={<CollectionView />} />
          <Route path="lobbies" element={<Lobbies />} />
          <Route path="room/:roomId" element={<WatchRoom />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
