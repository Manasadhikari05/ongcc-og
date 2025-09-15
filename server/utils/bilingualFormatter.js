// Bilingual formatting helpers for applicant data

/**
 * Format age by appending the bilingual suffix " वर्ष / years"
 * Accepts number or string containing a number
 */
function formatAge(ageValue) {
  if (ageValue === undefined || ageValue === null) return '';
  const numeric = String(ageValue).trim();
  if (numeric.length === 0) return '';
  return `${numeric} वर्ष / years`;
}

/**
 * Map English gender to bilingual equivalent
 */
function formatGender(genderValue) {
  if (!genderValue) return '';
  const key = String(genderValue).trim().toLowerCase();
  if (key === 'female') return 'महिला / Female';
  if (key === 'male') return 'पुरुष / Male';
  if (key === 'other' || key === 'others') return 'अन्य / Other';
  // Fallback to original string if unknown
  return String(genderValue);
}

/**
 * Map category abbreviations to bilingual equivalents
 */
function formatCategory(categoryValue) {
  if (!categoryValue) return '';
  const key = String(categoryValue).trim().toUpperCase();
  if (key === 'GEN' || key === 'GENERAL') return 'सामान्य / General';
  if (key === 'OBC') return 'अन्य पिछड़ा वर्ग / OBC';
  if (key === 'SC') return ' अनुसूचित जाति / SC';
  if (key === 'ST') return ' अनुसूचित जनजाति / ST';
  // Fallback to original string if unknown
  return String(categoryValue);
}

/**
 * Apply bilingual formatting to relevant applicant fields without mutating input
 */
function formatApplicantData(applicantData = {}) {
  const formatted = { ...applicantData };

  if (applicantData.age !== undefined && applicantData.age !== null) {
    formatted.age = formatAge(applicantData.age);
  }
  if (applicantData.gender) {
    formatted.gender = formatGender(applicantData.gender);
  }
  if (applicantData.category) {
    formatted.category = formatCategory(applicantData.category);
  }

  return formatted;
}

module.exports = {
  formatApplicantData,
  formatAge,
  formatGender,
  formatCategory,
};


