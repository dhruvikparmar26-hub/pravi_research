const { ASSET_CATEGORY_PREFIX } = require('../config/constants');

/**
 * Generate a unique, human-readable asset tag.
 *
 * Format:  AST-<CATEGORY_PREFIX>-<YEAR>-<SEQUENCE>
 * Example: AST-HM-2026-0042
 *
 * @param {string} category   One of ASSET_CATEGORY_LIST values
 * @param {number} sequence   Auto-incremented number (from DB counter or count)
 * @returns {string}          Formatted asset tag
 */
const generateAssetTag = (category, sequence) => {
  const prefix = ASSET_CATEGORY_PREFIX[category] || 'XX';
  const year = new Date().getFullYear();
  const seq = String(sequence).padStart(4, '0');
  return `AST-${prefix}-${year}-${seq}`;
};

module.exports = { generateAssetTag };
