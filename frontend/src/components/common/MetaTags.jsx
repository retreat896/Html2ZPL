import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';

const MetaTags = () => {
    const { activeLabel } = useProject();
    const { pathname } = useLocation();
    const isHomePage = pathname === '/';

    const baseTitle = isHomePage ? 'HTML2ZPL - Visual Zebra Label Editor' : 'ZPL Label Editor';
    const baseDescription = isHomePage
        ? 'An open-source browser workspace for designing, previewing, and exporting labels for Zebra printers.'
        : 'Create, edit, and preview ZPL labels locally with this web-based editor. Support for barcodes, images, and more.';
    
    // Dynamic content based on active label
    const title = !isHomePage && activeLabel?.name
        ? `${activeLabel.name} - ${baseTitle}`
        : baseTitle;
    
    // In the future, we could generate a description based on the label content
    const description = baseDescription;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{title}</title>
            <meta name="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            {/* <meta property="og:image" content="/og-image.png" /> Placeholder for future dynamic image */}
            
            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
        </Helmet>
    );
};

export default MetaTags;
