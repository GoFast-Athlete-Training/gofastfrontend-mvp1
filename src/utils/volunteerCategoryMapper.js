/**
 * Volunteer Category Mapper
 * Maps backend role names to categories for better organization
 */

// Map role names to categories
const ROLE_TO_CATEGORY_MAP = {
  // Marshal roles
  'Starter + Finisher Crew': 'marshal',
  'Valleywood + John Marshall Crew': 'marshal',
  'Vermont + 35th Street North Crew': 'marshal',
  'Massachusetts + Nottingham / 35th Crew': 'marshal',
  'Massachusetts / Rhode Island + Rockingham Crew': 'marshal',
  'Virginia Avenue Entry Crew': 'marshal',
  'Virginia / Nottingham Crew': 'marshal',
  
  // Pacer roles
  'Pacers – Fast': 'pacer',
  'Pacers – Medium': 'pacer',
  'Pacers – Finish Crew': 'pacer',
  
  // Water station roles
  'Water Stop #1 — Massachusetts → Rhode Island': 'water',
  'Water Stop #2 — Nottingham → 35th': 'water',
  
  // Finish line roles
  'Finish Line Holders 1': 'finish',
  'Finish Line Holders 2': 'finish',
};

// Category display names
export const CATEGORY_DISPLAY_NAMES = {
  marshal: 'Course Marshal',
  pacer: 'Pacer',
  water: 'Water Station',
  finish: 'Finish Line',
};

// All expected roles for BGR 5K (for calculating vacant slots)
export const EXPECTED_ROLES = [
  // Marshals (7)
  'Starter + Finisher Crew',
  'Valleywood + John Marshall Crew',
  'Vermont + 35th Street North Crew',
  'Massachusetts + Nottingham / 35th Crew',
  'Massachusetts / Rhode Island + Rockingham Crew',
  'Virginia Avenue Entry Crew',
  'Virginia / Nottingham Crew',
  // Pacers (3)
  'Pacers – Fast',
  'Pacers – Medium',
  'Pacers – Finish Crew',
  // Water (2)
  'Water Stop #1 — Massachusetts → Rhode Island',
  'Water Stop #2 — Nottingham → 35th',
  // Finish (2)
  'Finish Line Holders 1',
  'Finish Line Holders 2',
];

/**
 * Get category from role name
 */
export const getCategoryFromRole = (roleName) => {
  return ROLE_TO_CATEGORY_MAP[roleName] || 'other';
};

/**
 * Get category display name
 */
export const getCategoryDisplayName = (category) => {
  return CATEGORY_DISPLAY_NAMES[category] || category;
};

/**
 * Calculate volunteer statistics
 */
export const calculateVolunteerStats = (volunteers = [], expectedRoles = EXPECTED_ROLES) => {
  const filledRoles = new Set(volunteers.map(v => v.role));
  const totalFilled = filledRoles.size;
  const totalVacant = expectedRoles.length - totalFilled;
  const vacantRoles = expectedRoles.filter(role => !filledRoles.has(role));
  
  return {
    totalFilled,
    totalVacant,
    totalExpected: expectedRoles.length,
    vacantRoles,
    filledRoles: Array.from(filledRoles),
  };
};

/**
 * Group volunteers by category
 */
export const groupVolunteersByCategory = (volunteers = []) => {
  const grouped = {};
  
  volunteers.forEach(volunteer => {
    const category = getCategoryFromRole(volunteer.role);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(volunteer);
  });
  
  // Sort categories
  const categoryOrder = ['marshal', 'pacer', 'water', 'finish', 'other'];
  const sorted = {};
  categoryOrder.forEach(cat => {
    if (grouped[cat]) {
      sorted[cat] = grouped[cat];
    }
  });
  
  return sorted;
};
