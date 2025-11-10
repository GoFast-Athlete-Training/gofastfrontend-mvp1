/**
 * InviteLinkGenerator Test Utility
 * 
 * Quick test file to generate invite links for testing
 * Run this in browser console or use as reference
 */

import { 
  generateDirectInviteLink, 
  generateAuthenticatedInviteLink,
  generateShareOptions 
} from './InviteLinkGenerator';
import { generateUniversalInviteLink } from './AuthDetectionService';

// Test Configuration - Morning Warriors
const testCrewName = 'Morning Warriors';
const testCrewId = 'cmhlg0io60001sj1vlqn13vnx';
const testJoinCode = 'FAST123';

console.log('🧪 Testing Invite Link Generator');
console.log('================================');

// Universal Invite Link (Smart - Auto-detects auth state) ⭐ RECOMMENDED
const universalLink = generateUniversalInviteLink(testJoinCode);
console.log('🌟 Universal Invite Link (Recommended - Works for Both):');
console.log(universalLink);
console.log('');

// Direct Invite Link (Join Code-First Flow)
const directLink = generateDirectInviteLink(testJoinCode);
console.log('📧 Direct Invite Link (New Users Only):');
console.log(directLink);
console.log('');

// Authenticated Invite Link (Athlete-First Flow)
const authLink = generateAuthenticatedInviteLink(testJoinCode);
console.log('🔐 Authenticated Invite Link (Existing Users Only):');
console.log(authLink);
console.log('');

// Full Share Options
const shareOptions = generateShareOptions(testCrewName, testJoinCode);
console.log('📋 Full Share Options:');
console.log(shareOptions);
console.log('');

// Test Links
console.log('🧪 Test Links:');
console.log('1. Copy direct link and open in incognito window');
console.log('2. Should auto-validate code and show crew info');
console.log('3. Click "Join This Crew" → Should redirect to signup');
console.log('4. After signup → Should auto-join and redirect to RunCrew Central');

export { testCrewName, testCrewId, testJoinCode, universalLink, directLink, authLink, shareOptions };

// Quick Test Links (copy these to test)
console.log('\n📋 Quick Test Links:');
console.log('================================');
console.log(`🌟 Universal Link (Recommended): ${universalLink}`);
console.log(`📧 Direct Invite (New Users): ${directLink}`);
console.log(`🔐 Authenticated Link (Existing Users): ${authLink}`);
console.log(`\n🧪 Test Steps:`);
console.log(`1. Copy universal link: ${universalLink}`);
console.log(`2. Open in incognito window (tests new user flow)`);
console.log(`3. Should auto-validate and show "${testCrewName}"`);
console.log(`4. Click "Join This Crew" → Sign up → Auto-join → RunCrew Central`);
console.log(`\n🧪 Test Authenticated Flow:`);
console.log(`1. Copy universal link: ${universalLink}`);
console.log(`2. Open in normal window (as authenticated user)`);
console.log(`3. Should auto-redirect to /runcrew/join?code=FAST123`);
console.log(`4. Should join immediately → RunCrew Central`);

