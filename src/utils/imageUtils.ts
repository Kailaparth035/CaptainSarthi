import { API_BASE_URL } from '../Service/constant';

/**
 * Converts a relative image path to a full URL
 * Handles paths like:
 * - /uploads/forms/profile_photo-xxx.png
 * - /assets/uploads/forms/xxx.png (removes /assets prefix)
 * - uploads/forms/xxx.png (without leading slash)
 * 
 * @param imagePath - The image path from API (can be relative or absolute)
 * @returns Full URL string or null if path is invalid
 */
export const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath || imagePath.trim() === '') {
    return null;
  }

  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Handle paths starting with /assets/uploads/ - remove /assets prefix
  if (imagePath.startsWith('/assets/uploads/')) {
    const pathWithoutAssets = imagePath.replace('/assets', '');
    return `${API_BASE_URL}${pathWithoutAssets}`;
  }

  // Handle paths starting with /uploads/
  if (imagePath.startsWith('/uploads/')) {
    return `${API_BASE_URL}${imagePath}`;
  }

  // Handle paths starting with assets/uploads/ (without leading slash) - remove assets prefix
  if (imagePath.startsWith('assets/uploads/')) {
    const pathWithoutAssets = imagePath.replace('assets/', '');
    return `${API_BASE_URL}/${pathWithoutAssets}`;
  }

  // Handle paths starting with uploads/ (without leading slash)
  if (imagePath.startsWith('uploads/')) {
    return `${API_BASE_URL}/${imagePath}`;
  }

  // Handle paths starting with /assets/ (other asset paths) - remove /assets prefix
  if (imagePath.startsWith('/assets/')) {
    const pathWithoutAssets = imagePath.replace('/assets', '');
    return `${API_BASE_URL}${pathWithoutAssets}`;
  }

  // Handle paths starting with assets/ (without leading slash) - remove assets prefix
  if (imagePath.startsWith('assets/')) {
    const pathWithoutAssets = imagePath.replace('assets/', '');
    return `${API_BASE_URL}/${pathWithoutAssets}`;
  }

  // For other relative paths, ensure they start with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${API_BASE_URL}${normalizedPath}`;
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

