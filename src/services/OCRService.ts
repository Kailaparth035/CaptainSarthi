/**
 * OCR Service - Production-ready RC Book OCR with validation and parsing
 * 
 * Features:
 * - RC Book image validation using keyword detection
 * - Blur/quality detection
 * - Intelligent parsing of Vehicle Number, Chassis, Engine, Owner Name, Registration Date
 * - Handles both Android & iOS
 * - Offline processing using Google ML Kit
 * 
 * @format
 */

import TextRecognition from '@react-native-ml-kit/text-recognition';

/**
 * Extracted RC Book data structure
 */
export interface RCExtractedData {
  vehicleNumber: string;
  ownerName: string;
  chassisNumber: string;
  engineNumber: string;
  registrationDate: string; // Format: DD/MM/YYYY or DD-MM-YYYY
}

/**
 * RC Book validation keywords (case-insensitive)
 * Image must contain AT LEAST 2 of these to be considered valid RC Book
 */
const RC_VALIDATION_KEYWORDS = [
  'REGISTRATION CERTIFICATE',
  'RC BOOK',
  'VEHICLE NO',
  'REGN NO',
  'REGISTRATION NO',
  'CHASSIS',
  'ENGINE',
  'OWNER NAME',
  'OWNER',
  'RTO',
  'DATE OF REGISTRATION',
  'REGISTRATION DATE',
];

/**
 * Minimum text length to consider image readable (not blurred)
 * If OCR returns text shorter than this, image is considered blurred
 */
const MIN_READABLE_TEXT_LENGTH = 50;

/**
 * Vehicle Number regex patterns for Indian format
 * Supports formats like: GJ01AB1234, GJ 01 AB 1234, GJ-01-AB-1234
 */
const VEHICLE_NUMBER_PATTERNS = [
  /[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{1,4}/i, // GJ01AB1234
  /[A-Z]{2}\s?[0-9]{1,2}\s?[A-Z]{1,2}\s?[0-9]{1,4}/i, // GJ 01 AB 1234
  /[A-Z]{2}-[0-9]{1,2}-[A-Z]{1,2}-[0-9]{1,4}/i, // GJ-01-AB-1234
];

/**
 * Date patterns for Indian format (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY)
 */
const DATE_PATTERNS = [
  /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g, // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})/g, // DD/MM/YY
];

/**
 * Chassis number pattern (typically 17 characters alphanumeric, may include spaces/dashes)
 * More flexible pattern to handle OCR variations
 */
const CHASSIS_NUMBER_PATTERN = /[A-HJ-NPR-Z0-9]{17}/i;
const CHASSIS_NUMBER_PATTERN_FLEXIBLE = /[A-Z0-9\s-]{12,20}/i; // Flexible pattern for OCR

/**
 * Engine number pattern (typically 8-15 alphanumeric characters, may include spaces/dashes)
 */
const ENGINE_NUMBER_PATTERN = /[A-Z0-9]{8,15}/i;
const ENGINE_NUMBER_PATTERN_FLEXIBLE = /[A-Z0-9\s-]{6,18}/i; // Flexible pattern for OCR

/**
 * Extract text from image using ML Kit OCR
 * @param imageUri - Local file URI of the image
 * @returns Promise with extracted text or null if extraction fails
 */
export const extractTextFromImage = async (
  imageUri: string,
): Promise<string | null> => {
  try {
    if (!imageUri || imageUri.trim().length === 0) {
      console.error('[OCRService] Image URI is empty or invalid');
      throw new Error('Invalid image. Please select a valid image.');
    }

    console.log('[OCRService] Starting text extraction from:', imageUri);

    // Process image with ML Kit Text Recognition
    const result = await TextRecognition.recognize(imageUri);

    if (!result || !result.text) {
      console.warn('[OCRService] No text found in image');
      return null;
    }

    const extractedText = result.text.trim();
    console.log('[OCRService] Text extracted successfully, length:', extractedText.length);
    
    // Log preview of extracted text for debugging (truncated for long texts)
    const previewText = extractedText.length > 300 
      ? extractedText.substring(0, 300) + '...' 
      : extractedText;
    console.log('[OCRService] Extracted text preview:', previewText);

    return extractedText;
  } catch (error: any) {
    console.error('[OCRService] Error during text extraction:', error);
    
    // Handle specific error cases
    if (error?.message?.includes('file not found') || error?.code === 'ENOENT') {
      throw new Error('Image file not found. Please select the image again.');
    }
    
    if (error?.message?.includes('permission')) {
      throw new Error('Permission denied. Please grant required permissions.');
    }
    
    throw new Error(
      error?.message || 'Failed to extract text from image. Please try again.',
    );
  }
};

/**
 * Validate if extracted text is from an RC Book
 * Checks if text contains AT LEAST 2 of the validation keywords
 * @param text - Extracted OCR text
 * @returns Object with isValid flag and matched keywords count
 */
export const validateRCBook = (
  text: string,
): {isValid: boolean; matchedKeywords: number; matchedKeywordsList: string[]} => {
  try {
    if (!text || text.trim().length === 0) {
      console.log('[OCRService] Empty text - cannot validate RC Book');
      return {isValid: false, matchedKeywords: 0, matchedKeywordsList: []};
    }

    const upperText = text.toUpperCase();
    const matchedKeywords: string[] = [];

    // Check each keyword
    for (const keyword of RC_VALIDATION_KEYWORDS) {
      if (upperText.includes(keyword.toUpperCase())) {
        matchedKeywords.push(keyword);
      }
    }

    const matchedCount = matchedKeywords.length;
    const isValid = matchedCount >= 2;

    console.log('[OCRService] RC Book validation:', {
      matchedKeywords: matchedCount,
      required: 2,
      isValid,
      matchedKeywordsList: matchedKeywords,
    });

    return {
      isValid,
      matchedKeywords: matchedCount,
      matchedKeywordsList: matchedKeywords,
    };
  } catch (error) {
    console.error('[OCRService] Error validating RC Book:', error);
    return {isValid: false, matchedKeywords: 0, matchedKeywordsList: []};
  }
};

/**
 * Check if image is blurred or unreadable
 * Criteria: Empty text OR very short text OR mostly unreadable characters
 * @param text - Extracted OCR text
 * @returns Object with isBlurred flag and reason
 */
export const checkImageQuality = (
  text: string | null,
): {isBlurred: boolean; reason?: string} => {
  try {
    if (!text || text.trim().length === 0) {
      console.log('[OCRService] Empty text detected - image likely blurred');
      return {
        isBlurred: true,
        reason: 'No text found in image. Image may be blurred or unreadable.',
      };
    }

    const trimmedText = text.trim();

    // Check minimum readable text length
    if (trimmedText.length < MIN_READABLE_TEXT_LENGTH) {
      console.log('[OCRService] Text too short - image likely blurred:', trimmedText.length);
      return {
        isBlurred: true,
        reason: `Only ${trimmedText.length} characters found. Image appears to be blurred.`,
      };
    }

    // Check for unreadable characters (too many special characters or gibberish)
    // If more than 50% of text is non-alphanumeric (excluding spaces and common punctuation), likely blurred
    const alphanumericCount = (trimmedText.match(/[A-Z0-9]/gi) || []).length;
    const totalChars = trimmedText.length;
    const alphanumericRatio = alphanumericCount / totalChars;

    if (alphanumericRatio < 0.3) {
      console.log('[OCRService] Low alphanumeric ratio - image likely blurred:', alphanumericRatio);
      return {
        isBlurred: true,
        reason: 'Image contains too many unreadable characters.',
      };
    }

    console.log('[OCRService] Image quality check passed');
    return {isBlurred: false};
  } catch (error) {
    console.error('[OCRService] Error checking image quality:', error);
    return {
      isBlurred: true,
      reason: 'Unable to assess image quality.',
    };
  }
};

/**
 * Parse Vehicle Number from text
 * Supports Indian vehicle number formats including union territories (AN, DN, DD, etc.)
 * @param text - OCR extracted text
 * @returns Vehicle number string or empty string if not found
 */
const parseVehicleNumber = (text: string): string => {
  try {
    // Clean text for better matching
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const upperText = cleanText.toUpperCase();
    
    // Enhanced vehicle number keywords with colons and variations
    const vehicleKeywords = [
      'REG. NO',
      'REG. NO.',
      'REGN NO',
      'REGN NO.',
      'REGISTRATION NO',
      'REGISTRATION NO.',
      'VEHICLE NO',
      'VEHICLE NO.',
      'VEHICLE NUMBER',
    ];

    // First, try to find near keyword (most reliable)
    for (const keyword of vehicleKeywords) {
      const keywordIndex = upperText.indexOf(keyword);
      if (keywordIndex !== -1) {
        // Extract text after keyword (next 25-30 characters)
        let afterKeyword = cleanText.substring(
          keywordIndex + keyword.length,
          keywordIndex + keyword.length + 35,
        );
        
        // Clean up: remove leading punctuation and separators
        afterKeyword = afterKeyword.replace(/^[:;,\-.\s]+/, '').trim();
        
        // Try each vehicle number pattern on cleaned text
        for (const pattern of VEHICLE_NUMBER_PATTERNS) {
          const match = afterKeyword.match(pattern);
          if (match && match[0]) {
            let vehicleNumber = match[0]
              .replace(/\s+/g, '') // Remove all spaces for validation
              .trim()
              .toUpperCase();
            
            // Validate length (7-15 chars for Indian format: AN01J8844 = 9 chars, GJ27AJ9314 = 10 chars)
            if (vehicleNumber.length >= 7 && vehicleNumber.length <= 15) {
              // Format with spaces for readability: AN01J8844 -> AN01J 8844
              // Insert space after state code and district (if pattern matches)
              // Pattern: 2 letters (state code like AN, GJ, MH) + 1-2 digits + 1-2 letters + 1-4 digits
              const formattedMatch = vehicleNumber.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,2})(\d{1,4})$/i);
              if (formattedMatch) {
                vehicleNumber = `${formattedMatch[1]}${formattedMatch[2]}${formattedMatch[3]} ${formattedMatch[4]}`.toUpperCase();
                console.log('[OCRService] Vehicle number found near keyword:', vehicleNumber);
                return vehicleNumber;
              }
            }
          }
        }
        
        // Fallback: Try to extract directly after keyword (for cases like "REG. NO: AN01J 8844" or "REG. NO. AN01J 8844")
        // More flexible pattern that handles spaces: "AN01J 8844" or "AN 01 J 8844" or "AN01J8844"
        const directMatch = afterKeyword.match(/^([A-Z]{2})\s?(\d{1,2})\s?([A-Z]{1,2})\s?(\d{1,4})/i);
        if (directMatch && directMatch.length >= 5) {
          // Reconstruct vehicle number from matched groups
          const stateCode = directMatch[1].toUpperCase();
          const district = directMatch[2];
          const series = directMatch[3].toUpperCase();
          const number = directMatch[4];
          
          let vehicleNumber = `${stateCode}${district}${series} ${number}`;
          
          // Validate the reconstructed number
          const fullNumber = vehicleNumber.replace(/\s/g, '');
          if (fullNumber.length >= 7 && fullNumber.length <= 15) {
            console.log('[OCRService] Vehicle number found (direct match):', vehicleNumber);
            return vehicleNumber;
          }
        }
        
        // Second fallback: Try without spaces first, then format
        const noSpaceMatch = afterKeyword.replace(/\s/g, '').match(/^([A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4})/i);
        if (noSpaceMatch && noSpaceMatch[1]) {
          let vehicleNumber = noSpaceMatch[1].toUpperCase();
          if (vehicleNumber.length >= 7 && vehicleNumber.length <= 15) {
            // Format with space
            const formattedMatch = vehicleNumber.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,2})(\d{1,4})$/i);
            if (formattedMatch) {
              vehicleNumber = `${formattedMatch[1]}${formattedMatch[2]}${formattedMatch[3]} ${formattedMatch[4]}`;
              console.log('[OCRService] Vehicle number found (no-space match):', vehicleNumber);
              return vehicleNumber;
            }
          }
        }
      }
    }

    // Fallback: Search entire text for vehicle number patterns
    for (const pattern of VEHICLE_NUMBER_PATTERNS) {
      const matches = cleanText.match(pattern);
      if (matches && matches.length > 0) {
        // Take the first match that looks valid
        for (const match of matches) {
          let vehicleNumber = match.replace(/\s+/g, '').trim().toUpperCase();
          if (vehicleNumber.length >= 7 && vehicleNumber.length <= 15) {
            // Format with space
            const formattedMatch = vehicleNumber.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,2})(\d{1,4})$/i);
            if (formattedMatch) {
              vehicleNumber = `${formattedMatch[1]}${formattedMatch[2]}${formattedMatch[3]} ${formattedMatch[4]}`;
            }
            console.log('[OCRService] Vehicle number found (pattern match):', vehicleNumber);
            return vehicleNumber;
          }
        }
      }
    }

    console.log('[OCRService] No vehicle number found in text');
    return '';
  } catch (error) {
    console.error('[OCRService] Error parsing vehicle number:', error);
    return '';
  }
};

/**
 * Parse Chassis Number from text
 * Chassis numbers can be VIN format (17 chars) or shorter (like "600687B")
 * Must stop at boundaries and not include label text like "OWNER NAME"
 * @param text - OCR extracted text
 * @returns Chassis number string or empty string if not found
 */
const parseChassisNumber = (text: string): string => {
  try {
    // Clean text: replace common OCR errors
    const cleanText = text.replace(/\s+/g, ' '); // Normalize spaces
    const upperText = cleanText.toUpperCase();
    
    // Keywords that indicate end of chassis number section (stop parsing)
    const stopKeywords = [
      'OWNER',
      'ENGINE',
      'DATE',
      'FUEL',
      'REGISTRATION',
      'VALIDITY',
      'ADDRESS',
      'VEHICLE',
    ];

    // Look for text near "CHASSIS" keyword (more comprehensive search)
    const chassisKeywords = [
      'CHASSIS NO.',
      'CHASSIS NO',
      'CHASSIS NUMBER',
      'CHASSIS',
    ];
    
    for (const keyword of chassisKeywords) {
      const keywordIndex = upperText.indexOf(keyword);
      if (keywordIndex !== -1) {
        // Extract text after keyword (next 25-30 characters)
        let afterKeyword = cleanText.substring(
          keywordIndex + keyword.length,
          keywordIndex + keyword.length + 30,
        );
        
        // Clean up: remove leading punctuation and separators
        afterKeyword = afterKeyword.replace(/^[:;,\-.\s]+/, '').trim();
        
        // Find where to stop (before next field like OWNER, ENGINE, etc.)
        let stopIndex = afterKeyword.length;
        const upperAfterKeyword = afterKeyword.toUpperCase();
        for (const stopKeyword of stopKeywords) {
          const idx = upperAfterKeyword.indexOf(stopKeyword);
          if (idx !== -1 && idx < stopIndex && idx > 0) {
            stopIndex = idx;
          }
        }
        
        // Extract only the chassis number portion (before stop keywords)
        let chassisSection = afterKeyword.substring(0, stopIndex).trim();
        
        // Remove trailing punctuation and any text that looks like field labels
        chassisSection = chassisSection.replace(/[:;,\-.\n]+.*$/, '').trim();
        
        // CRITICAL: Remove any occurrences of "OWNER", "NAME", "ADDRESS" etc. that might have been concatenated
        // This handles cases like "600687BOWNERNAME" -> "600687B"
        const labelWords = ['OWNER', 'NAME', 'ADDRESS', 'NUMBER', 'NO', 'ENGINE', 'DATE', 'VEHICLE'];
        let cleanChassisSection = chassisSection;
        for (const word of labelWords) {
          // Remove the word if it appears after alphanumeric (like "600687BOWNER" -> "600687B")
          const regex = new RegExp(`([A-Z0-9]+)${word}`, 'i');
          cleanChassisSection = cleanChassisSection.replace(regex, '$1');
        }
        chassisSection = cleanChassisSection.trim();
        
        // Try exact VIN pattern first (17 chars, no spaces)
        const chassisNoSpaces = chassisSection.replace(/\s/g, '');
        const vinMatch = chassisNoSpaces.match(/^([A-HJ-NPR-Z0-9]{17})/i);
        if (vinMatch && vinMatch[1]) {
          const chassisNumber = vinMatch[1].trim().toUpperCase();
          console.log('[OCRService] Chassis number found (VIN pattern):', chassisNumber);
          return chassisNumber;
        }
        
        // Try shorter chassis numbers (like "600687B" - 6-12 chars)
        // Common format: digits + optional letter(s), must stop before any word-like text
        // Use word boundary to stop at any non-alphanumeric or transition from alphanumeric to word
        const shortChassisMatch = chassisSection.match(/^([A-Z0-9]{6,12})(?![A-Z]{2,})/i);
        if (shortChassisMatch && shortChassisMatch[1]) {
          let chassisCandidate = shortChassisMatch[1].replace(/[\s-]/g, '').trim();
          // Additional validation: should not contain common words
          const hasCommonWord = labelWords.some(word => chassisCandidate.toUpperCase().includes(word));
          if (!hasCommonWord && chassisCandidate.length >= 6 && chassisCandidate.length <= 17) {
            if (/^[A-Z0-9]{6,17}$/i.test(chassisCandidate)) {
              const chassisNumber = chassisCandidate.toUpperCase();
              console.log('[OCRService] Chassis number found (short format):', chassisNumber);
              return chassisNumber;
            }
          }
        }
        
        // More aggressive: Extract only pure alphanumeric sequence (6-12 chars) stopping at first word-like pattern
        const pureAlphanumeric = chassisNoSpaces.match(/^([A-Z0-9]{6,12})(?=[A-Z]{3,}|$)/i);
        if (pureAlphanumeric && pureAlphanumeric[1]) {
          const candidate = pureAlphanumeric[1];
          // Exclude vehicle number patterns and common words
          const isVehicleNumber = /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4}$/i.test(candidate);
          const hasCommonWord = labelWords.some(word => candidate.toUpperCase().includes(word));
          if (!isVehicleNumber && !hasCommonWord && candidate.length >= 6 && candidate.length <= 12) {
            const chassisNumber = candidate.toUpperCase();
            console.log('[OCRService] Chassis number found (pure alphanumeric):', chassisNumber);
            return chassisNumber;
          }
        }
      }
    }

    // Fallback: Search for 17-character VIN pattern in entire text
    const textWithoutSpaces = cleanText.replace(/\s/g, '');
    const allVINMatches = textWithoutSpaces.match(/[A-HJ-NPR-Z0-9]{17}/gi);
    if (allVINMatches && allVINMatches.length > 0) {
      // Take the first one that looks valid (not vehicle number format)
      for (const match of allVINMatches) {
        if (match.length === 17) {
          console.log('[OCRService] Chassis number found (fallback VIN search):', match);
          return match.toUpperCase();
        }
      }
    }

    console.log('[OCRService] No chassis number found in text');
    return '';
  } catch (error) {
    console.error('[OCRService] Error parsing chassis number:', error);
    return '';
  }
};

/**
 * Parse Engine Number from text
 * Engine numbers can be 6-17 alphanumeric characters (like "600687B")
 * Must stop at boundaries and not include label text like "OWNER NAME"
 * @param text - OCR extracted text
 * @returns Engine number string or empty string if not found
 */
const parseEngineNumber = (text: string): string => {
  try {
    // Clean text: replace common OCR errors
    const cleanText = text.replace(/\s+/g, ' '); // Normalize spaces
    const upperText = cleanText.toUpperCase();
    
    // Keywords that indicate end of engine number section (stop parsing)
    const stopKeywords = [
      'OWNER',
      'CHASSIS',
      'DATE',
      'FUEL',
      'REGISTRATION',
      'VALIDITY',
      'ADDRESS',
      'VEHICLE',
      'NAME',
    ];

    // Look for text near "ENGINE" keyword (more comprehensive search)
    const engineKeywords = [
      'ENGINE NO.',
      'ENGINE NO',
      'ENGINE NUMBER',
      'ENGINE',
    ];
    
    for (const keyword of engineKeywords) {
      const keywordIndex = upperText.indexOf(keyword);
      if (keywordIndex !== -1) {
        // Extract text after keyword (next 25-30 characters)
        let afterKeyword = cleanText.substring(
          keywordIndex + keyword.length,
          keywordIndex + keyword.length + 30,
        );
        
        // Clean up: remove leading punctuation and separators
        afterKeyword = afterKeyword.replace(/^[:;,\-.\s]+/, '').trim();
        
        // Find where to stop (before next field like OWNER, CHASSIS, etc.)
        let stopIndex = afterKeyword.length;
        const upperAfterKeyword = afterKeyword.toUpperCase();
        for (const stopKeyword of stopKeywords) {
          const idx = upperAfterKeyword.indexOf(stopKeyword);
          if (idx !== -1 && idx < stopIndex && idx > 0) {
            stopIndex = idx;
          }
        }
        
        // Extract only the engine number portion (before stop keywords)
        let engineSection = afterKeyword.substring(0, stopIndex).trim();
        
        // Remove trailing punctuation and newlines
        engineSection = engineSection.replace(/[:;,\-.\n]+.*$/, '').trim();
        
        // CRITICAL: Remove any occurrences of "OWNER", "NAME", "ADDRESS" etc. that might have been concatenated
        // This handles cases like "600687BOWNERNAME" -> "600687B"
        const labelWords = ['OWNER', 'NAME', 'ADDRESS', 'NUMBER', 'NO', 'CHASSIS', 'DATE', 'VEHICLE'];
        let cleanEngineSection = engineSection;
        for (const word of labelWords) {
          // Remove the word if it appears after alphanumeric (like "600687BOWNER" -> "600687B")
          const regex = new RegExp(`([A-Z0-9]+)${word}`, 'i');
          cleanEngineSection = cleanEngineSection.replace(regex, '$1');
        }
        engineSection = cleanEngineSection.trim();
        
        // Try exact pattern first (6-12 alphanumeric, no spaces) - stop before word-like patterns
        const engineNoSpaces = engineSection.replace(/\s/g, '');
        // Use lookahead to stop before 3+ consecutive letters (likely a word like "OWNER", "NAME")
        const engineMatch = engineNoSpaces.match(/^([A-Z0-9]{6,12})(?![A-Z]{2,})/i);
        if (engineMatch && engineMatch[1]) {
          let engineCandidate = engineMatch[1].trim();
          // Validate: should be alphanumeric, 6-12 characters, no common words
          if (engineCandidate.length >= 6 && engineCandidate.length <= 12) {
            const hasCommonWord = labelWords.some(word => engineCandidate.toUpperCase().includes(word));
            if (!hasCommonWord && /^[A-Z0-9]{6,12}$/i.test(engineCandidate)) {
              // Exclude vehicle number patterns
              const isVehicleNumber = /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4}$/i.test(engineCandidate);
              if (!isVehicleNumber) {
                const engineNumber = engineCandidate.toUpperCase();
                console.log('[OCRService] Engine number found:', engineNumber);
                return engineNumber;
              }
            }
          }
        }
        
        // Fallback: Extract pure alphanumeric sequence stopping at word boundaries
        const pureAlphanumeric = engineNoSpaces.match(/^([A-Z0-9]{6,12})(?=[A-Z]{3,}|$)/i);
        if (pureAlphanumeric && pureAlphanumeric[1]) {
          const candidate = pureAlphanumeric[1];
          // Exclude vehicle number patterns and common words
          const isVehicleNumber = /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4}$/i.test(candidate);
          const hasCommonWord = labelWords.some(word => candidate.toUpperCase().includes(word));
          if (!isVehicleNumber && !hasCommonWord && candidate.length >= 6 && candidate.length <= 12) {
            const engineNumber = candidate.toUpperCase();
            console.log('[OCRService] Engine number found (pure alphanumeric):', engineNumber);
            return engineNumber;
          }
        }
      }
    }

    // Fallback: Search for medium-length alphanumeric strings (6-17 chars) that might be engine numbers
    const textWithoutSpaces = cleanText.replace(/\s/g, '');
    const potentialEngineNumbers = textWithoutSpaces.match(/[A-Z0-9]{6,17}/gi);
    if (potentialEngineNumbers && potentialEngineNumbers.length > 0) {
      // Filter out vehicle number patterns
      for (const match of potentialEngineNumbers) {
        const isVehicleNumber = /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4}$/i.test(match);
        if (!isVehicleNumber && match.length >= 6 && match.length <= 17) {
          console.log('[OCRService] Engine number found (fallback search):', match);
          return match.toUpperCase();
        }
      }
    }

    console.log('[OCRService] No engine number found in text');
    return '';
  } catch (error) {
    console.error('[OCRService] Error parsing engine number:', error);
    return '';
  }
};

/**
 * Parse Owner Name from text
 * Looks for text after "OWNER", "OWNER NAME", "REGISTERED OWNER" keywords
 * Excludes address text that may appear before or after the owner name
 * @param text - OCR extracted text
 * @returns Owner name string or empty string if not found
 */
const parseOwnerName = (text: string): string => {
  try {
    // Address keywords to exclude from owner name
    const addressKeywords = [
      'ADDRESS',
      'VILLAGE',
      'TALUKA',
      'DISTRICT',
      'STATE',
      'PIN',
      'PINCODE',
      'POST',
      'POSTAL',
      'ROAD',
      'STREET',
      'NAGAR',
      'COLONY',
      'NEAR',
      'OPP',
      'BEHIND',
      'AT',
      'TQ',
      'DT',
      'STATE',
      'GUJARAT',
      'MAHARASHTRA',
      'RAJASTHAN',
      'MADHYA PRADESH',
      'KARNATAKA',
      'TAMIL NADU',
      'KERALA',
      'ANDHRA PRADESH',
      'TELANGANA',
      'WEST BENGAL',
      'UTTAR PRADESH',
      'BIHAR',
      'PUNJAB',
      'HARYANA',
      'DELHI',
      'MUMBAI',
      'AHMEDABAD',
      'SURAT',
      'VADODARA',
      'RAJKOT',
      'GANDHINAGAR',
    ];

    const ownerKeywords = [
      'OWNER NAME',
      'REGISTERED OWNER',
      'NAME OF OWNER',
      'OWNER\'S NAME',
      'OWNER',
    ];

    for (const keyword of ownerKeywords) {
      const upperText = text.toUpperCase();
      const keywordIndex = upperText.indexOf(keyword);
      if (keywordIndex !== -1) {
        // Extract text after keyword (next 80-100 characters for full name)
        let afterKeyword = text.substring(
          keywordIndex + keyword.length,
          keywordIndex + keyword.length + 100,
        );

        // Clean up: remove common separators and colons
        afterKeyword = afterKeyword.replace(/^[:;,\-.\s]+/, ''); // Remove leading punctuation

        // Find where to stop - look for next field indicators
        let stopIndex = afterKeyword.length;
        const upperAfterKeyword = afterKeyword.toUpperCase();
        
        // Stop at address keywords
        for (const addrKeyword of addressKeywords) {
          const addrIndex = upperAfterKeyword.indexOf(addrKeyword);
          if (addrIndex !== -1 && addrIndex < stopIndex && addrIndex > 5) {
            // Only stop if address keyword is not too close (might be part of name)
            stopIndex = addrIndex;
          }
        }

        // Stop at other field indicators (SON/DAUGHTER/WIFE, DATE, etc.)
        const fieldIndicators = [
          'SON/DAUGHTER/WIFE',
          'SON/DAUGHTER',
          'S/O',
          'W/O',
          'D/O',
          'C/O',
          'DATE',
          'REGISTRATION',
          'VALIDITY',
          'FUEL',
          'VEHICLE',
          'CHASSIS',
          'ENGINE',
          '\n\n', // Double newline indicates section break
        ];
        
        for (const indicator of fieldIndicators) {
          const idx = upperAfterKeyword.indexOf(indicator);
          if (idx !== -1 && idx < stopIndex && idx > 2) {
            stopIndex = idx;
          }
        }

        // Also stop at newlines (single newline might be within name, but check context)
        const newlineIndex = afterKeyword.indexOf('\n');
        if (newlineIndex !== -1 && newlineIndex < stopIndex && newlineIndex > 10) {
          // If newline is after at least 10 chars, it might be end of name line
          // Check if next line starts with field indicator
          const afterNewline = afterKeyword.substring(newlineIndex + 1, newlineIndex + 20).toUpperCase();
          const hasFieldAfterNewline = fieldIndicators.some(ind => afterNewline.startsWith(ind));
          if (hasFieldAfterNewline && newlineIndex < stopIndex) {
            stopIndex = newlineIndex;
          }
        }

        // Extract only the name portion (before address/other fields)
        let nameCandidate = afterKeyword.substring(0, stopIndex).trim();

        // Remove trailing punctuation, numbers, and common suffixes
        nameCandidate = nameCandidate.replace(/[:;,\-.\d]+$/, '').trim();
        
        // Remove "OF" if it appears at the end (e.g., "NAME OF" -> "NAME")
        nameCandidate = nameCandidate.replace(/\s+OF\s*$/i, '').trim();

        // CRITICAL FIX: Skip if nameCandidate is just "NAME" (the label itself, not actual name)
        // This happens when OCR reads "OWNER NAME" and we extract just "NAME"
        if (nameCandidate.toUpperCase().trim() === 'NAME' || nameCandidate.toUpperCase().trim() === 'OWNER') {
          continue; // Skip - this is just the label, not the actual name value
        }
        
        // Extract name - handle multi-word names (like "ABDUL SALEEM M K")
        // Look for alphabetic text that may contain spaces, periods, and common name characters
        // Stop at field indicators, address keywords, or numbers
        
        // Try to match name pattern: letters, spaces, dots, hyphens (for names like "M K" or "SALEEM-M")
        // Must have at least 3 characters (not just "NAME")
        let nameMatch = nameCandidate.match(/^[A-Z\s.'-]{3,}/i);
        if (!nameMatch) {
          continue; // Skip if no valid name pattern found
        }
        
        nameCandidate = nameMatch[0].trim();
        
        // Remove any trailing field indicators that might have been captured
        const fieldPatterns = [
          /SON\/DAUGHTER\/WIFE.*$/i,
          /SON\/DAUGHTER.*$/i,
          /S\/O.*$/i,
          /W\/O.*$/i,
          /D\/O.*$/i,
          /C\/O.*$/i,
        ];
        
        for (const pattern of fieldPatterns) {
          nameCandidate = nameCandidate.replace(pattern, '').trim();
        }

        // Additional validation: Check if extracted text contains address keywords (should not)
        const nameUpper = nameCandidate.toUpperCase();
        const containsAddressKeyword = addressKeywords.some(addrKeyword => 
          nameUpper.includes(addrKeyword)
        );
        
        if (containsAddressKeyword) {
          // Try to extract name before the address keyword
          for (const addrKeyword of addressKeywords) {
            const addrIndex = nameUpper.indexOf(addrKeyword);
            if (addrIndex !== -1 && addrIndex > 2) {
              nameCandidate = nameCandidate.substring(0, addrIndex).trim();
              break;
            }
          }
        }
        
        // Remove any numbers that might have been captured
        nameCandidate = nameCandidate.replace(/\d+/g, '').trim();
        
        // Split by common separators and take the first valid name portion
        const nameParts = nameCandidate.split(/[:;,\-]/);
        if (nameParts.length > 0) {
          nameCandidate = nameParts[0].trim();
        }

        // Final validation: Name should be 2-50 characters, no numbers, reasonable format
        if (
          nameCandidate.length >= 2 &&
          nameCandidate.length <= 50 &&
          /^[A-Z\s.'-]+$/i.test(nameCandidate) &&
          !/[0-9]/.test(nameCandidate) && // Names shouldn't contain numbers
          !nameCandidate.match(/^\d/) && // Shouldn't start with number
          nameCandidate.split(/\s+/).filter(w => w.length > 0).length <= 6 // Reasonable number of words (max 6 words for full name like "ABDUL SALEEM M K")
        ) {
          // Capitalize properly (handle common Indian name formats)
          const name = nameCandidate
            .split(/\s+/) // Split by any whitespace
            .filter(word => word.trim().length > 0 && !/^[^A-Za-z]*$/.test(word)) // Remove empty words and non-alphabetic-only words
            .map(word => {
              // Handle common prefixes/suffixes - skip these as they're not part of name
              const lowerWord = word.toLowerCase();
              if (lowerWord === 's/o' || lowerWord === 'w/o' || lowerWord === 'd/o' || 
                  lowerWord === 'c/o' || lowerWord === 'son' || lowerWord === 'wife' || 
                  lowerWord === 'daughter' || lowerWord === 'name' || lowerWord === 'of') {
                return null; // Filter these out
              }
              // Handle single letter initials (like "M" or "K")
              if (word.length === 1 && /[A-Za-z]/.test(word)) {
                return word.toUpperCase();
              }
              // Handle regular words - capitalize first letter, lowercase rest
              return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .filter(word => word !== null) // Remove null entries
            .join(' ')
            .trim();
          
          // Final check: ensure name doesn't contain address-related words or field labels
          const finalNameUpper = name.toUpperCase();
          const stillContainsAddress = addressKeywords.some(addrKeyword => 
            finalNameUpper.includes(addrKeyword)
          );
          
          const containsFieldLabel = ['OWNER', 'NAME', 'NO', 'NUMBER'].some(label => {
            // Check if label appears as a standalone word (not part of actual name)
            const regex = new RegExp(`\\b${label}\\b`, 'i');
            return regex.test(finalNameUpper) && finalNameUpper.split(/\s+/).length <= 2;
          });
          
          // Only exclude if it's clearly a label, not if it's part of a longer name
          if (!stillContainsAddress && !containsFieldLabel && name.length >= 2) {
            console.log('[OCRService] Owner name found:', name);
            return name;
          }
        }
      }
    }

    console.log('[OCRService] No owner name found in text');
    return '';
  } catch (error) {
    console.error('[OCRService] Error parsing owner name:', error);
    return '';
  }
};

/**
 * Parse Registration Date from text
 * Supports DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY formats
 * @param text - OCR extracted text
 * @returns Registration date string (DD/MM/YYYY format) or empty string if not found
 */
const parseRegistrationDate = (text: string): string => {
  try {
    // Look for date near "DATE OF REGISTRATION", "REGISTRATION DATE", "REGN DATE" keywords
    const dateKeywords = [
      'DATE OF REGISTRATION',
      'REGISTRATION DATE',
      'REGN DATE',
      'REG DATE',
      'DATE OF ISSUE',
    ];

    for (const keyword of dateKeywords) {
      const keywordIndex = text.toUpperCase().indexOf(keyword);
      if (keywordIndex !== -1) {
        // Extract text after keyword (next 30 characters for date)
        const afterKeyword = text.substring(
          keywordIndex + keyword.length,
          keywordIndex + keyword.length + 30,
        );

        // Try to find date pattern
        for (const pattern of DATE_PATTERNS) {
          const matches = [...afterKeyword.matchAll(pattern)];
          if (matches && matches.length > 0) {
            // Take first valid date match
            const match = matches[0];
            if (match && match.length >= 4) {
              let day = match[1].padStart(2, '0');
              let month = match[2].padStart(2, '0');
              let year = match[3];

              // Handle 2-digit year
              if (year.length === 2) {
                const yearNum = parseInt(year, 10);
                // Assume years 00-30 are 2000-2030, 31-99 are 1931-1999
                year = yearNum <= 30 ? `20${year}` : `19${year}`;
              }

              // Validate date
              const dayNum = parseInt(day, 10);
              const monthNum = parseInt(month, 10);
              const yearNum = parseInt(year, 10);

              if (
                dayNum >= 1 &&
                dayNum <= 31 &&
                monthNum >= 1 &&
                monthNum <= 12 &&
                yearNum >= 1900 &&
                yearNum <= 2100
              ) {
                const date = new Date(yearNum, monthNum - 1, dayNum);
                // Verify date is valid (e.g., not Feb 30)
                if (
                  date.getDate() === dayNum &&
                  date.getMonth() === monthNum - 1 &&
                  date.getFullYear() === yearNum
                ) {
                  const formattedDate = `${day}/${month}/${year}`;
                  console.log('[OCRService] Registration date found:', formattedDate);
                  return formattedDate;
                }
              }
            }
          }
        }
      }
    }

    // Fallback: Look for any date pattern in the text (might be registration date)
    // But only if it's in reasonable range (after 1980, before today)
    const currentYear = new Date().getFullYear();
    for (const pattern of DATE_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match && match.length >= 4) {
          let day = match[1].padStart(2, '0');
          let month = match[2].padStart(2, '0');
          let year = match[3];

          if (year.length === 2) {
            const yearNum = parseInt(year, 10);
            year = yearNum <= 30 ? `20${year}` : `19${year}`;
          }

          const yearNum = parseInt(year, 10);
          // Check if date is in reasonable range for registration (1980 to current year)
          if (yearNum >= 1980 && yearNum <= currentYear) {
            const dayNum = parseInt(day, 10);
            const monthNum = parseInt(month, 10);

            if (
              dayNum >= 1 &&
              dayNum <= 31 &&
              monthNum >= 1 &&
              monthNum <= 12
            ) {
              const date = new Date(yearNum, monthNum - 1, dayNum);
              if (
                date.getDate() === dayNum &&
                date.getMonth() === monthNum - 1 &&
                date.getFullYear() === yearNum
              ) {
                const formattedDate = `${day}/${month}/${year}`;
                console.log('[OCRService] Registration date found (fallback):', formattedDate);
                return formattedDate;
              }
            }
          }
        }
      }
    }

    console.log('[OCRService] No registration date found in text');
    return '';
  } catch (error) {
    console.error('[OCRService] Error parsing registration date:', error);
    return '';
  }
};

/**
 * Parse extracted text and return structured RC data
 * Intelligently extracts Vehicle Number, Chassis Number, Engine Number, Owner Name, and Registration Date
 * @param text - Raw text from OCR
 * @returns RCExtractedData object with parsed fields
 */
export const parseRCDetails = (text: string): RCExtractedData => {
  try {
    if (!text || text.trim().length === 0) {
      console.warn('[OCRService] Empty text provided for parsing');
      return {
        vehicleNumber: '',
        ownerName: '',
        chassisNumber: '',
        engineNumber: '',
        registrationDate: '',
      };
    }

    console.log('[OCRService] Starting RC data parsing from text');

    const extractedData: RCExtractedData = {
      vehicleNumber: parseVehicleNumber(text),
      chassisNumber: parseChassisNumber(text),
      engineNumber: parseEngineNumber(text),
      ownerName: parseOwnerName(text),
      registrationDate: parseRegistrationDate(text),
    };

    console.log('[OCRService] Parsing complete:', {
      vehicleNumberFound: extractedData.vehicleNumber.length > 0,
      chassisNumberFound: extractedData.chassisNumber.length > 0,
      engineNumberFound: extractedData.engineNumber.length > 0,
      ownerNameFound: extractedData.ownerName.length > 0,
      registrationDateFound: extractedData.registrationDate.length > 0,
    });

    return extractedData;
  } catch (error) {
    console.error('[OCRService] Error during RC data parsing:', error);
    return {
      vehicleNumber: '',
      ownerName: '',
      chassisNumber: '',
      engineNumber: '',
      registrationDate: '',
    };
  }
};

/**
 * Main function: Extract and parse RC Book data from image with validation
 * 
 * Flow:
 * 1. Extract text from image
 * 2. Check image quality (blur detection)
 * 3. Validate RC Book (keyword check)
 * 4. Parse structured data
 * 
 * @param imageUri - URI of the RC Book image to process
 * @returns Promise with RCExtractedData
 * @throws Error if validation fails or image is blurred
 */
export const extractDataFromRCImage = async (
  imageUri: string,
): Promise<RCExtractedData> => {
  try {
    // Step 1: Extract text from image
    const extractedText = await extractTextFromImage(imageUri);
    
    if (!extractedText) {
      throw new Error(
        'Image is too blurred. Please upload a clear RC Book image.',
      );
    }

    // Step 2: Check image quality (blur detection)
    const qualityCheck = checkImageQuality(extractedText);
    if (qualityCheck.isBlurred) {
      throw new Error(
        qualityCheck.reason ||
          'Image is too blurred. Please upload a clear RC Book image.',
      );
    }

    // Step 3: Validate RC Book (must contain at least 2 keywords)
    const validation = validateRCBook(extractedText);
    if (!validation.isValid) {
      throw new Error(
        'This image does not appear to be an RC Book. Please upload a valid RC Book image.',
      );
    }

    console.log(
      '[OCRService] RC Book validated successfully. Matched keywords:',
      validation.matchedKeywords,
      validation.matchedKeywordsList,
    );

    // Step 4: Parse structured data from text
    const parsedData = parseRCDetails(extractedText);
    
    return parsedData;
  } catch (error: any) {
    console.error('[OCRService] Error in extractDataFromRCImage:', error);
    // Re-throw with user-friendly message
    throw error;
  }
};

/**
 * Process both RC front and back images
 * Combines text from both images for better extraction accuracy
 * 
 * @param frontUri - URI of RC front image
 * @param backUri - URI of RC back image
 * @returns Promise with RCExtractedData (combined from both images)
 * @throws Error if validation fails or images are blurred
 */
export const extractDataFromRCImages = async (
  frontUri: string,
  backUri: string,
): Promise<RCExtractedData> => {
  try {
    console.log('[OCRService] Processing both RC images (front + back)');

    // Process both images in parallel for better performance
    const [frontText, backText] = await Promise.all([
      extractTextFromImage(frontUri),
      extractTextFromImage(backUri),
    ]);

    // Combine text from both images
    const combinedText = [frontText, backText]
      .filter(text => text && text.trim().length > 0)
      .join('\n\n');

    if (!combinedText || combinedText.trim().length === 0) {
      throw new Error(
        'Both images are too blurred. Please upload clear RC Book images.',
      );
    }

    // Check combined text quality
    const qualityCheck = checkImageQuality(combinedText);
    if (qualityCheck.isBlurred) {
      throw new Error(
        qualityCheck.reason ||
          'Images are too blurred. Please upload clear RC Book images.',
      );
    }

    // Validate RC Book using combined text
    const validation = validateRCBook(combinedText);
    if (!validation.isValid) {
      throw new Error(
        'These images do not appear to be an RC Book. Please upload valid RC Book images.',
      );
    }

    console.log(
      '[OCRService] RC Book validated (combined). Matched keywords:',
      validation.matchedKeywords,
    );

    // Parse combined text (should have better accuracy)
    const parsedData = parseRCDetails(combinedText);

    return parsedData;
  } catch (error: any) {
    console.error('[OCRService] Error in extractDataFromRCImages:', error);
    throw error;
  }
};
