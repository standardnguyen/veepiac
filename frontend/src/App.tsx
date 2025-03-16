import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from 'components/Layout';
import HomePage from 'pages/HomePage';
import SearchPage from 'pages/SearchPage';
import SubtitlePage from 'pages/SubtitlePage';
import EpisodePage from 'pages/EpisodePage';
import CreatePage from 'pages/CreatePage';
import SettingsPage from 'pages/SettingsPage';
import NotFoundPage from 'pages/NotFoundPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="subtitle/:id" element={<SubtitlePage />} />
          <Route path="episode/:id" element={<EpisodePage />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
