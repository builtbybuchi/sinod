import React from 'react';
import { Helmet } from 'react-helmet-async';

interface MetaTagsProps {
  title?: string;
  description?: string;
  keywords?: string;
  imageUrl?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
}

const MetaTags: React.FC<MetaTagsProps> = ({
  title = "Sinod' - A new way to event, meet and converse",
  description = 'Event and call without sweating. Sinod is a cutting-edge event engine and a high quality virtual-event platform that redefines how people connect, collaborate, and communicate online.',
  keywords = 'video conferencing, teleconferencing, online meetings, virtual meetings, remote collaboration, Sinod, events, physical meetings, physical meetings, events, event management, virtual events, hybrid events, event planning, online events, event platform, video calls, webinars, web conferencing, team collaboration, remote work, online collaboration, event hosting, event software',
  imageUrl = "https://sinod.lexrunit.com/sinod'.png",
  url = 'https://sinod.lexrunit.com/',
  type = 'website',
  noIndex = false,
}) => {
  const fullUrl = url.startsWith('http') ? url : `https://sinod.lexrunit.com${url}`;
  
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={imageUrl} />
    </Helmet>
  );
};

export default MetaTags;