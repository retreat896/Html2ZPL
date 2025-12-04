import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css'

import ObjectRegistry from './classes/ObjectRegistry';
import Text from './registry/items/Text';
import Graphic from './registry/items/Graphic';
import Barcode from './registry/items/Barcode';
import Image from './registry/items/Image';

ObjectRegistry.register(Text);
ObjectRegistry.register(Graphic);
ObjectRegistry.register(Barcode);
ObjectRegistry.register(Image);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
