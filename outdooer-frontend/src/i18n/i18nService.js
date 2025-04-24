// src/i18n/i18nService.js
import translations from './translations';

class I18nService {
  constructor() {
    // Default language is English
    this.currentLanguage = localStorage.getItem('outdooer_language') || 'en';
    
    // Available languages
    this.availableLanguages = {
      en: 'English',
      es: 'Español'
    };
  }
  
  /**
   * Get a translation by key
   * @param {string} key - Dot notation key (e.g. 'teamManagement.pageTitle')
   * @param {Object} params - Optional parameters for interpolation
   * @returns {string} - Translated text
   */
  t(key, params = {}) {
    try {
      // Split the key by dots to navigate the translations object
      const keys = key.split('.');
      
      // Start with the current language translations
      let result = translations[this.currentLanguage];
      
      // Navigate through the nested objects
      for (const k of keys) {
        if (result[k] === undefined) {
          // If key doesn't exist, try English as fallback
          if (this.currentLanguage !== 'en') {
            console.warn(`Translation key "${key}" not found in "${this.currentLanguage}", trying English fallback`);
            return this.fallbackToEnglish(key, params);
          }
          console.warn(`Translation key "${key}" not found`);
          return key; // Return the key as a last resort
        }
        result = result[k];
      }
      
      // If the result is a function, call it with the parameters
      if (typeof result === 'function') {
        return result(params);
      }
      
      // If the result is a string, perform parameter replacement
      if (typeof result === 'string') {
        return this.replaceParams(result, params);
      }
      
      // If we get here, something went wrong
      console.warn(`Unexpected translation result type for key "${key}"`);
      return key;
    } catch (error) {
      console.error(`Error translating key "${key}":`, error);
      return key;
    }
  }
  
  /**
   * Try to fallback to English translation
   * @param {string} key - Original translation key
   * @param {Object} params - Translation parameters
   * @returns {string} - English translation or original key
   */
  fallbackToEnglish(key, params) {
    try {
      const keys = key.split('.');
      let result = translations.en;
      
      for (const k of keys) {
        if (result[k] === undefined) {
          return key; // Key doesn't exist in English either
        }
        result = result[k];
      }
      
      if (typeof result === 'function') {
        return result(params);
      }
      
      if (typeof result === 'string') {
        return this.replaceParams(result, params);
      }
      
      return key;
    } catch (error) {
      return key;
    }
  }
  
  /**
   * Replace parameters in translation string
   * @param {string} text - Text with placeholders like {{param}}
   * @param {Object} params - Parameters to replace
   * @returns {string} - Text with replaced parameters
   */
  replaceParams(text, params) {
    if (!params || typeof params !== 'object') return text;
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
      return params[paramName] !== undefined ? params[paramName] : match;
    });
  }
  
  /**
   * Change the current language
   * @param {string} lang - Language code (e.g. 'en', 'es')
   * @returns {boolean} - Success status
   */
  changeLanguage(lang) {
    if (!this.availableLanguages[lang]) {
      console.warn(`Language "${lang}" is not available`);
      return false;
    }
    
    this.currentLanguage = lang;
    localStorage.setItem('outdooer_language', lang);
    
    // Dispatch an event to notify components about language change
    const event = new CustomEvent('languageChanged', { detail: { language: lang } });
    window.dispatchEvent(event);
    
    return true;
  }
  
  /**
   * Get the current language
   * @returns {string} - Current language code
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  /**
   * Get all available languages
   * @returns {Object} - Available languages map
   */
  getAvailableLanguages() {
    return this.availableLanguages;
  }
}

// Create a singleton instance
const i18n = new I18nService();

export default i18n;