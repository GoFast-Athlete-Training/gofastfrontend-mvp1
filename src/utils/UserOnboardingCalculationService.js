/**
 * UserOnboardingCalculationService
 * 
 * Smart onboarding logic for MVP1:
 * - First 15 days: Show onboarding cards
 * - After 15 days: Show regular home cards
 * - Based on user state: Show/hide specific features
 */

export class UserOnboardingCalculationService {
  
  /**
   * Calculate onboarding state based on user creation date
   * @param {string} createdAt - User creation date (ISO string)
   * @returns {Object} Onboarding state
   */
  static calculateOnboardingState(createdAt) {
    const now = new Date();
    const userCreatedAt = new Date(createdAt);
    const daysSinceCreation = Math.floor((now - userCreatedAt) / (1000 * 60 * 60 * 24));
    
    return {
      isNewUser: daysSinceCreation <= 15,
      daysSinceCreation,
      onboardingPhase: daysSinceCreation <= 7 ? 'early' : daysSinceCreation <= 15 ? 'mid' : 'complete'
    };
  }

  /**
   * Get appropriate cards based on user state and onboarding phase
   * @param {Object} athlete - Athlete data from backend
   * @param {Object} onboardingState - From calculateOnboardingState
   * @returns {Array} Cards to display
   */
  static getCardsForUser(athlete, onboardingState) {
    const { isNewUser, onboardingPhase } = onboardingState;
    
    // Base cards that everyone gets
    const baseCards = [
      {
        title: "Connect Garmin",
        description: "Sync your runs and get detailed analytics",
        icon: "⌚",
        path: "/settings/devices",
        color: "bg-blue-500",
        priority: "high"
      }
    ];

    // Onboarding cards for new users (first 15 days)
    if (isNewUser) {
      return [
        ...baseCards,
        {
          title: "Join RunCrew",
          description: "Find accountability partners and running groups",
          icon: "🤝",
          path: "/runcrew/join",
          color: "bg-green-500",
          priority: "high",
          showIf: !athlete.runCrewId // Only show if not in a crew
        },
        {
          title: "Track Your Runs",
          description: "Start logging runs and see your progress",
          icon: "🏃‍♂️",
          path: "/training/track",
          color: "bg-orange-500",
          priority: "high"
        },
        {
          title: "Find Running Partners",
          description: "Connect with runners in your area",
          icon: "👥",
          path: "/connect/partners",
          color: "bg-purple-500",
          priority: "medium"
        }
      ];
    }

    // Regular cards for established users (after 15 days)
    return [
      ...baseCards,
      {
        title: "RunCrew Dashboard",
        description: athlete.runCrewId ? "Manage your crew" : "Want more accountability? Start a run crew",
        icon: "🤝",
        path: athlete.runCrewId ? "/runcrew/dashboard" : "/runcrew/start",
        color: "bg-green-500",
        priority: "high"
      },
      {
        title: "Training Analytics",
        description: "Analyze your pace and heart rate zones",
        icon: "📊",
        path: "/training/analytics",
        color: "bg-orange-500",
        priority: "high"
      },
      {
        title: "Running Partners",
        description: "Connect with runners in your area",
        icon: "👥",
        path: "/connect/partners",
        color: "bg-purple-500",
        priority: "medium"
      }
    ];
  }

  /**
   * Get onboarding message based on phase
   * @param {Object} onboardingState - From calculateOnboardingState
   * @param {Object} athlete - Athlete data
   * @returns {string} Message to display
   */
  static getOnboardingMessage(onboardingState, athlete) {
    const { isNewUser, onboardingPhase } = onboardingState;
    
    if (!isNewUser) {
      return `Welcome back, ${athlete.firstName || 'Athlete'}!`;
    }

    switch (onboardingPhase) {
      case 'early':
        return `Welcome to GoFast, ${athlete.firstName || 'Athlete'}! Let's get you started with the basics.`;
      case 'mid':
        return `You're doing great, ${athlete.firstName || 'Athlete'}! Ready to explore more features?`;
      default:
        return `Welcome, ${athlete.firstName || 'Athlete'}!`;
    }
  }

  /**
   * Check if user should see profile completion prompt
   * @param {Object} athlete - Athlete data
   * @returns {boolean} Should show profile prompt
   */
  static shouldShowProfilePrompt(athlete) {
    return !athlete.gofastHandle; // Profile incomplete if no handle
  }

  /**
   * Get profile completion status
   * @param {Object} athlete - Athlete data
   * @returns {Object} Profile completion details
   */
  static getProfileCompletionStatus(athlete) {
    const required = ['firstName', 'lastName', 'gofastHandle'];
    const completed = required.filter(field => athlete[field]);
    
    return {
      isComplete: completed.length === required.length,
      completed: completed.length,
      total: required.length,
      missing: required.filter(field => !athlete[field])
    };
  }
}

export default UserOnboardingCalculationService;
