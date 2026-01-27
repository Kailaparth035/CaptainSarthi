/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export const extractYouTubeVideoId = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Remove any whitespace
  const cleanUrl = url.trim();

  // Check if it's already a video ID (no URL structure)
  if (!cleanUrl.includes('youtube.com') && !cleanUrl.includes('youtu.be') && cleanUrl.length === 11) {
    return cleanUrl;
  }

  // Pattern 1: https://www.youtube.com/shorts/VIDEO_ID (YouTube Shorts)
  const shortsMatch = cleanUrl.match(/youtube\.com\/shorts\/([^&\n?#\/]+)/);
  if (shortsMatch && shortsMatch[1]) {
    return shortsMatch[1];
  }

  // Pattern 2: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = cleanUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  if (watchMatch && watchMatch[1]) {
    return watchMatch[1];
  }

  // Pattern 3: https://youtu.be/VIDEO_ID
  const shortMatch = cleanUrl.match(/youtu\.be\/([^&\n?#]+)/);
  if (shortMatch && shortMatch[1]) {
    return shortMatch[1];
  }

  // Pattern 4: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = cleanUrl.match(/youtube\.com\/embed\/([^&\n?#]+)/);
  if (embedMatch && embedMatch[1]) {
    return embedMatch[1];
  }

  return null;
};

/**
 * Check if a URL is a YouTube URL
 */
export const isYouTubeUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return url.includes('youtube.com') || url.includes('youtu.be');
};

/**
 * Get YouTube embed URL from video ID
 */
export const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
};

/**
 * Get YouTube thumbnail URL from video ID or URL
 * Quality options: maxresdefault (best), hqdefault (high), mqdefault (medium), sddefault (standard)
 */
export const getYouTubeThumbnailUrl = (
  videoIdOrUrl: string | null | undefined,
  quality: 'maxresdefault' | 'hqdefault' | 'mqdefault' | 'sddefault' = 'maxresdefault'
): string | null => {
  if (!videoIdOrUrl || typeof videoIdOrUrl !== 'string') {
    return null;
  }

  // Extract video ID if URL is provided
  const videoId = extractYouTubeVideoId(videoIdOrUrl) || videoIdOrUrl;
  
  if (!videoId || videoId.length !== 11) {
    return null;
  }

  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};
