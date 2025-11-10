/**
 * InviteLinkGenerator Service
 * 
 * Generates invite links for RunCrew join flows
 * Supports both Athlete-First and Join Code-First flows
 */

const BASE_URL = window.location.origin || 'https://athlete.gofastcrushgoals.com';

/**
 * Generate invite link for Join Code-First Flow (direct-invite)
 * This is for unauthenticated users who haven't signed up yet
 * 
 * @param {string} joinCode - The join code for the RunCrew
 * @returns {string} Full URL with join code parameter
 */
export const generateDirectInviteLink = (joinCode) => {
  if (!joinCode) {
    throw new Error('Join code is required');
  }
  
  const normalizedCode = joinCode.toUpperCase().trim();
  return `${BASE_URL}/joinruncrewwelcome?code=${encodeURIComponent(normalizedCode)}`;
};

/**
 * Generate invite link for Athlete-First Flow (authenticated users)
 * This is for users who already have an account
 * 
 * @param {string} joinCode - The join code for the RunCrew
 * @returns {string} Full URL with join code parameter
 */
export const generateAuthenticatedInviteLink = (joinCode) => {
  if (!joinCode) {
    throw new Error('Join code is required');
  }
  
  const normalizedCode = joinCode.toUpperCase().trim();
  return `${BASE_URL}/runcrew/join?code=${encodeURIComponent(normalizedCode)}`;
};

/**
 * Generate share message text for direct-invite flow
 * 
 * @param {string} crewName - Name of the RunCrew
 * @param {string} joinCode - The join code
 * @param {string} inviteLink - Optional custom invite link
 * @returns {string} Formatted share message
 */
export const generateDirectInviteMessage = (crewName, joinCode, inviteLink = null) => {
  const link = inviteLink || generateDirectInviteLink(joinCode);
  return `You've been invited to join ${crewName} on GoFast!\n\nJoin here: ${link}`;
};

/**
 * Generate share message text for authenticated flow
 * 
 * @param {string} crewName - Name of the RunCrew
 * @param {string} joinCode - The join code
 * @param {string} inviteLink - Optional custom invite link
 * @returns {string} Formatted share message
 */
export const generateAuthenticatedInviteMessage = (crewName, joinCode, inviteLink = null) => {
  const link = inviteLink || generateAuthenticatedInviteLink(joinCode);
  return `Join ${crewName} on GoFast!\n\nLink: ${link}\nCode: ${joinCode}`;
};

/**
 * Copy invite link to clipboard
 * 
 * @param {string} link - The invite link to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyInviteLink = async (link) => {
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch (err) {
    console.error('Failed to copy invite link:', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = link;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

/**
 * Copy invite message to clipboard
 * 
 * @param {string} message - The invite message to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyInviteMessage = async (message) => {
  try {
    await navigator.clipboard.writeText(message);
    return true;
  } catch (err) {
    console.error('Failed to copy invite message:', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = message;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

/**
 * Generate both invite links (for admin UI)
 * 
 * @param {string} joinCode - The join code
 * @returns {object} Object with both invite links
 */
export const generateAllInviteLinks = (joinCode) => {
  return {
    directInvite: generateDirectInviteLink(joinCode),
    authenticatedInvite: generateAuthenticatedInviteLink(joinCode),
    joinCode: joinCode.toUpperCase().trim()
  };
};

/**
 * Generate share options object (for admin UI)
 * 
 * @param {string} crewName - Name of the RunCrew
 * @param {string} joinCode - The join code
 * @returns {object} Object with all share options
 */
export const generateShareOptions = (crewName, joinCode) => {
  const links = generateAllInviteLinks(joinCode);
  
  return {
    links,
    messages: {
      directInvite: generateDirectInviteMessage(crewName, joinCode, links.directInvite),
      authenticatedInvite: generateAuthenticatedInviteMessage(crewName, joinCode, links.authenticatedInvite)
    },
    copyLink: (type = 'directInvite') => copyInviteLink(links[type]),
    copyMessage: (type = 'directInvite') => copyInviteMessage(links.messages[type])
  };
};

// Note: Universal link generation is in AuthDetectionService
// Import it directly when needed: import { generateUniversalInviteLink } from './AuthDetectionService';

export default {
  generateDirectInviteLink,
  generateAuthenticatedInviteLink,
  generateDirectInviteMessage,
  generateAuthenticatedInviteMessage,
  copyInviteLink,
  copyInviteMessage,
  generateAllInviteLinks,
  generateShareOptions
};

