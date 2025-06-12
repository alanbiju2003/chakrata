// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Import the main App component
import './index.css'; // Import the global CSS file

const container = document.getElementById('root');
const root = createRoot(container); // Create a root

// Render the App component into the root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
