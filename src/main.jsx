import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css'

import ObjectRegistry from './classes/ObjectRegistry';
import Text from './registry/items/Text';
import Graphic from './registry/items/Graphic';

ObjectRegistry.register(Text);
ObjectRegistry.register(Graphic);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
