import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Items from './Items';
import ItemDetail from './ItemDetail';
import { DataProvider } from '../state/DataContext';

function App() {
  return (
    <DataProvider>
      <div className="appShell">
        <header className="navbar">
          <div className="navbarInner">
            <Link className="brand" to="/">
              Item Explorer
            </Link>
            <span className="muted" style={{ fontSize: 12 }}>
              Search, paginate, and browse details
            </span>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Items />} />
          <Route path="/items/:id" element={<ItemDetail />} />
        </Routes>
      </div>
    </DataProvider>
  );
}

export default App;