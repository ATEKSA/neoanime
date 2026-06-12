import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';

const Home = lazy(() => import('./Home'));
const AnimeDetails = lazy(() => import('./AnimeDetails'));
const Catalog = lazy(() => import('./Catalog'));
const Profile = lazy(() => import('./Profile'));
const Collections = lazy(() => import('./Collections'));
const CollectionView = lazy(() => import('./CollectionView'));
const Lobbies = lazy(() => import('./Lobbies'));
const WatchRoom = lazy(() => import('./WatchRoom'));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <Suspense fallback={<div style={{padding: '5rem', textAlign: 'center'}}>Загрузка...</div>}>
              <Home />
            </Suspense>
          } />
          <Route path="catalog" element={
            <Suspense fallback={<div style={{padding: '5rem', textAlign: 'center'}}>Загрузка...</div>}>
              <Catalog />
            </Suspense>
          } />
          <Route path="anime/:code" element={
            <Suspense fallback={<div style={{padding: '5rem', textAlign: 'center'}}>Загрузка...</div>}>
              <AnimeDetails />
            </Suspense>
          } />
          <Route path="profile/:username" element={
            <Suspense fallback={<div style={{padding: '5rem', textAlign: 'center'}}>Загрузка...</div>}>
              <Profile />
            </Suspense>
          } />
          <Route path="collections" element={
            <Suspense fallback={<div style={{padding: '5rem', textAlign: 'center'}}>Загрузка...</div>}>
              <Collections />
            </Suspense>
          } />
          <Route path="collection/:username/:collectionId" element={
            <Suspense fallback={<div style={{padding: '5rem', textAlign: 'center'}}>Загрузка...</div>}>
              <CollectionView />
            </Suspense>
          } />
          <Route path="lobbies" element={
            <Suspense fallback={<div style={{padding: '5rem', textAlign: 'center'}}>Загрузка...</div>}>
              <Lobbies />
            </Suspense>
          } />
          <Route path="room/:roomId" element={
            <Suspense fallback={<div style={{padding: '5rem', textAlign: 'center'}}>Загрузка...</div>}>
              <WatchRoom />
            </Suspense>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
