import { API_BASE_URL } from '../Service/constant';

/**
 * Converts a relative image path from the API to a full URL.
 * Format: BASE_URL + "/api" + apiResponsePath
 *
 * Handles paths like:
 * - /uploads/forms/profile_photo-xxx.png
 * - /assets/uploads/forms/xxx.png (removes /assets prefix)
 * - uploads/forms/xxx.png (without leading slash)
 * - /api/uploads/forms/xxx.png (already includes /api)
 *
 * @param imagePath - The image path from API (can be relative or absolute)
 * @returns Full URL string or null if path is invalid
 */
export const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return null;
  }

  const trimmedPath = imagePath.trim();

  // If already a full URL, return as is
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return trimmedPath;
  }

  let normalizedPath = trimmedPath;

  // Remove /assets prefix if present
  if (normalizedPath.startsWith('/assets/')) {
    normalizedPath = normalizedPath.replace(/^\/assets/, '');
  } else if (normalizedPath.startsWith('assets/')) {
    normalizedPath = `/${normalizedPath.replace(/^assets\//, '')}`;
  }

  // Ensure path starts with /
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }

  // If path already includes /api, don't add it again
  if (normalizedPath.startsWith('/api/')) {
    return `${API_BASE_URL}${normalizedPath}`;
  }

  return `${API_BASE_URL}/api${normalizedPath}`;
};

/**
 * Gets multiple image URLs from an array of paths
 * @param imagePaths - Array of image paths
 * @returns Array of full URLs (null values filtered out)
 */
export const getImageUrls = (imagePaths: (string | null | undefined)[]): string[] => {
  return imagePaths
    .map(path => getImageUrl(path))
    .filter((url): url is string => url !== null);
};
