/**
 * AI Service - Now using Python Backend
 * Integration with Google Gemini AI for city descriptions and content generation
 * API keys are securely stored on the backend
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Generate meeting summary (placeholder for future feature)
 */
export const generateMeetingSummary = async (transcript: string): Promise<string> => {
  return Promise.resolve(`**AI Summary**\n\nThis is a placeholder summary feature that will be implemented with the Python backend.`);
};

export interface CityData {
  name: string;
  description: string;
  imageUrl: string;
  highlights: string[];
}

/**
 * Generate city description using AI via Python backend
 */
export const generateCityDescription = async (
  cityName: string, 
  country: string
): Promise<CityData> => {
  // Fallback data
  const fallbackData: CityData = {
    name: cityName,
    description: `Discover amazing events in ${cityName}, ${country}. A vibrant hub for technology, innovation, and community gatherings.`,
    imageUrl: getUnsplashCityImage(cityName),
    highlights: ['Tech Events', 'Networking', 'Innovation', 'Community']
  };

  try {
    const payload = {
      city_name: cityName,
      country: country,
      max_words: 150,
    };

    console.log('Generating city description via backend:', payload);

    const response = await fetch(`${BACKEND_URL}/ai/city-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        name: cityName,
        description: data.description || fallbackData.description,
        imageUrl: getUnsplashCityImage(cityName),
        highlights: ['Events', 'Innovation', 'Networking', 'Community'], // Can be enhanced later
      };
    } else {
      console.error('Failed to generate city description:', data);
      return fallbackData;
    }
  } catch (error: any) {
    console.error(`Error generating city description for ${cityName}:`, error);
    return fallbackData;
  }
};

// Curated Unsplash images for top cities - carefully selected for iconic views
const cityImages: Record<string, string> = {
  // Nigeria - Major Tech & Business Hubs
  'lagos': 'https://images.unsplash.com/photo-1719314073622-9399d167725b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1917', 
  'abuja': 'https://images.unsplash.com/photo-1721642472312-cd30e9bd7cac?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1035', 
  'port-harcourt': 'https://plus.unsplash.com/premium_photo-1671089657680-9d86ebc74976?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1035', 
  'ibadan': 'https://images.unsplash.com/photo-1668773309553-c9f53621d6db?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1035', 
  'nsukka': 'https://as1.ftcdn.net/jpg/05/11/87/60/1000_F_511876094_cqpwgDAImibd5b62QR2VWgqRADSS4pd1.jpg',
  'enugu': 'https://www.nairaland.com/attachments/19262670_1917869920250330134041jpeg3a2906ce7044a2452cf780067946eaa82_jpeg_jpeg0d39b21f56951f7babdaa00aeedaf28a', 
  
  // Zimbabwe - Historic & Growing Cities
  'harare': 'https://images.unsplash.com/photo-1575285272212-d52e915d01c7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2340?auto=format&fit=crop&w=1600&q=80', // Harare city center
  'bulawayo': 'https://images.unsplash.com/photo-1750704108947-13b6f876f028?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1287?auto=format&fit=crop&w=1600&q=80', // Bulawayo skyline
  
  // Top African Cities - Innovation & Culture
  'cape-town': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1600&q=80', // Table Mountain view
  'johannesburg': 'https://images.unsplash.com/photo-1577948000111-9c970dfe3743?auto=format&fit=crop&w=1600&q=80', // Johannesburg skyline
  'nairobi': 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?auto=format&fit=crop&w=1600&q=80', // Nairobi cityscape
  'cairo': 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1600&q=80', // Cairo with pyramids
  'accra': 'https://images.unsplash.com/photo-1632236501896-84ba90b2e6d8?auto=format&fit=crop&w=1600&q=80', // Accra modern city
  'kigali': 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1600&q=80', // Kigali hills
  'dar-es-salaam': 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?auto=format&fit=crop&w=1600&q=80', // Dar es Salaam waterfront
  'addis-ababa': 'https://images.unsplash.com/photo-1623018035782-b269248df916?auto=format&fit=crop&w=1600&q=80', // Addis Ababa skyline
  
  // Global Cities - World Tech Hubs
  'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80', // London Bridge & Big Ben
  'new-york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1600&q=80', // NYC skyline
  'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80', // Burj Khalifa
  'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1600&q=80', // Marina Bay Sands
  'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80', // Eiffel Tower
  'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=80', // Tokyo Tower night
};

export const getUnsplashCityImage = (cityName: string): string => {
  const slug = cityName.toLowerCase().replace(/\s+/g, '-');
  return cityImages[slug] || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80';
};
