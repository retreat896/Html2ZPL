import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import { createTheme, MantineProvider, useComputedColorScheme } from '@mantine/core';
import App from './App.jsx';
import './theme.css';
import '@mantine/core/styles.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';

import ObjectRegistry from './classes/ObjectRegistry';
import Text from './registry/items/Text';
import Graphic from './registry/items/Graphic';
import Barcode from './registry/items/Barcode';
import Line from './registry/items/Line';
import { ImageDefinition as Image } from './registry/items/Image';

ObjectRegistry.register(Text);
ObjectRegistry.register(Graphic);
ObjectRegistry.register(Barcode);
ObjectRegistry.register(Line);
ObjectRegistry.register(Image);

const themeScale = (name) => Array.from({ length: 10 }, (_, shade) => `rgb(var(--theme-${name}-${shade}))`);

const theme = createTheme({
    primaryColor: 'brand',
    primaryShade: { light: 6, dark: 7 },
    fontFamily: 'var(--theme-font-sans)',
    headings: { fontFamily: 'var(--theme-font-sans)' },
    colors: {
        brand: themeScale('brand'),
        gray: themeScale('neutral'),
        green: themeScale('success'),
        red: themeScale('danger'),
        orange: themeScale('warning'),
        lime: themeScale('accent'),
    },
});

function SyncTailwindColorScheme() {
    const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', colorScheme === 'dark');
    }, [colorScheme]);

    return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HelmetProvider>
            <MantineProvider theme={theme} defaultColorScheme="auto">
                <SyncTailwindColorScheme />
                <App />
            </MantineProvider>
        </HelmetProvider>
    </React.StrictMode>,
);
