/**
 * backend/functions/services/personalizationService.js
 * Personalization service for user context and recommendation
 */

const logger = require("../utils/logger");

class PersonalizationService {
  constructor() {
    logger.info("PersonalizationService initialized");
  }

  /**
   * Get user profile data
   * @param {string} userId - The user's ID
   * @returns {Object} User profile data
   */
  getUserProfile(userId) {
    return {
      id: userId,
      displayName: "Student",
      academicLevel: "undergraduate",
      modules: [],
      interests: [],
      previousQuestions: [],
      learningStyle: "balanced",
    };
  }

  /**
   * Build personalized context for LLM
   * @param {Object} userProfile - User profile dictionary
   * @param {string} context - Additional context string
   * @returns {string} Personalization context for LLM prompt
   */
  buildPersonalizationContext(userProfile, context = null) {
    try {
      // Build base context
      const academicLevel = (
        userProfile.academicLevel || "student"
      ).toLowerCase();
      let contextStr = `The user is an ${academicLevel} student`;

      // Add modules if available
      const modules = userProfile.modules || [];
      if (modules.length > 0) {
        const modulesStr = modules.slice(0, 3).join(", ");
        contextStr += ` studying ${modulesStr}`;

        if (modules.length > 3) {
          contextStr += ` and ${modules.length - 3} other modules`;
        }
      }

      // Add learning style preference
      const learningStyle = userProfile.learningStyle || "balanced";
      if (learningStyle === "visual") {
        contextStr +=
          ". The user prefers visual explanations with diagrams and examples";
      } else if (learningStyle === "analytical") {
        contextStr += ". The user prefers detailed, analytical explanations";
      } else if (learningStyle === "practical") {
        contextStr += ". The user prefers practical examples and applications";
      }

      // Add additional context if provided
      if (context) {
        contextStr += `. ${context}`;
      }

      logger.debug(`Built personalization context for user ${userProfile.id}`);
      return contextStr;
    } catch (error) {
      logger.error(`Error building personalization context: ${error.message}`);
      return "The user is a student";
    }
  }

  /**
   * Get relevant academic reminders based on query topic
   * @param {string} userId - The user's ID
   * @param {string} topic - The search topic
   * @returns {Array<Object>} List of reminders with type and message
   */
  getAcademicReminders(userId, topic) {
    try {
      const reminders = [];
      const topicLower = topic.toLowerCase();

      // Exam-related reminders
      if (
        ["exam", "test", "assessment", "final", "midterm"].some((word) =>
          topicLower.includes(word),
        )
      ) {
        reminders.push({
          type: "exam",
          message:
            "📚 Tip: Check your exam schedule and start studying early. Visit the Examination Office portal for details.",
          priority: "high",
        });
        reminders.push({
          type: "exam",
          message:
            "⏰ Reminder: Exams require proper time management. Create a study schedule today.",
          priority: "medium",
        });
      }

      // Assignment-related reminders
      if (
        ["assignment", "submission", "deadline", "project", "coursework"].some(
          (word) => topicLower.includes(word),
        )
      ) {
        reminders.push({
          type: "assignment",
          message:
            "📝 Deadline Alert: Check the assignment portal for submission deadlines and requirements.",
          priority: "high",
        });
        reminders.push({
          type: "assignment",
          message:
            "✓ Pro Tip: Submit your work early to avoid last-minute technical issues.",
          priority: "medium",
        });
      }

      // Attendance-related reminders
      if (
        [
          "attendance",
          "class",
          "lecture",
          "tutorial",
          "practical",
          "session",
        ].some((word) => topicLower.includes(word))
      ) {
        reminders.push({
          type: "attendance",
          message:
            "📍 Remember: Regular attendance is crucial for your academic success and may impact your grades.",
          priority: "high",
        });
        reminders.push({
          type: "attendance",
          message:
            "📅 Check your timetable for upcoming lectures and mark them on your calendar.",
          priority: "medium",
        });
      }

      // Academic integrity reminders
      if (
        [
          "plagiarism",
          "academic integrity",
          "cheating",
          "ethics",
          "referencing",
        ].some((word) => topicLower.includes(word))
      ) {
        reminders.push({
          type: "integrity",
          message:
            "⚖️ Academic Integrity: Always cite your sources properly. Plagiarism has serious consequences.",
          priority: "high",
        });
      }

      // Module registration/change reminders
      if (
        ["register", "enroll", "module", "course", "add", "drop"].some((word) =>
          topicLower.includes(word),
        )
      ) {
        reminders.push({
          type: "admin",
          message:
            "🗂️ Module Registration: Check the registration deadline and ensure all your modules are confirmed.",
          priority: "high",
        });
      }

      // Payment/fee reminders
      if (
        ["payment", "fee", "tuition", "bill", "invoice", "payment plan"].some(
          (word) => topicLower.includes(word),
        )
      ) {
        reminders.push({
          type: "payment",
          message:
            "💳 Payment Reminder: Ensure your fees are paid on time to maintain your enrollment status.",
          priority: "high",
        });
        reminders.push({
          type: "payment",
          message:
            "📊 Check if you qualify for financial aid or fee reductions.",
          priority: "medium",
        });
      }

      // General academic support
      if (reminders.length === 0) {
        reminders.push({
          type: "general",
          message:
            "💡 Academic Success: Utilize university resources like tutoring, writing centers, and counseling services.",
          priority: "low",
        });
      }

      logger.info(
        `Generated ${reminders.length} reminders for user ${userId} on topic: ${topic}`,
      );
      return reminders.slice(0, 3); // Return top 3 reminders
    } catch (error) {
      logger.error(
        `Error generating reminders for user ${userId}: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Update user learning preferences
   * @param {string} userId - The user's ID
   * @param {Object} preferences - Dictionary containing learningStyle, responseLength, responseFormat
   * @returns {boolean} True if successful
   */
  updateLearningPreferences(userId, preferences) {
    try {
      // Validate preferences
      const validStyles = ["visual", "analytical", "practical", "balanced"];
      const validLengths = ["brief", "balanced", "detailed"];
      const validFormats = ["text", "bullet-points", "structured"];

      let learningStyle = preferences.learningStyle || "balanced";
      if (!validStyles.includes(learningStyle)) {
        logger.warning(
          `Invalid learning style: ${learningStyle}, using default`,
        );
        learningStyle = "balanced";
      }

      let responseLength = preferences.responseLength || "balanced";
      if (!validLengths.includes(responseLength)) {
        responseLength = "balanced";
      }

      let responseFormat = preferences.responseFormat || "text";
      if (!validFormats.includes(responseFormat)) {
        responseFormat = "text";
      }

      logger.info(
        `Updated learning preferences for user ${userId}: ` +
          `style=${learningStyle}, length=${responseLength}, format=${responseFormat}`,
      );

      return true;
    } catch (error) {
      logger.error(
        `Error updating preferences for user ${userId}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Get adaptive response length based on user preferences and query complexity
   * @param {string} userId - The user's ID
   * @param {string} preferredLength - User's preferred length ('brief', 'balanced', 'detailed')
   * @param {string} queryComplexity - Query complexity level ('simple', 'medium', 'complex')
   * @returns {number} Maximum tokens for response
   */
  getAdaptiveResponseLength(
    userId,
    preferredLength = "balanced",
    queryComplexity = "medium",
  ) {
    try {
      // Base token allocation by length preference
      const lengthTokens = {
        brief: 300,
        balanced: 800,
        detailed: 1500,
      };

      // Complexity multipliers
      const complexityMultipliers = {
        simple: 0.8,
        medium: 1.0,
        complex: 1.3,
      };

      const baseTokens = lengthTokens[preferredLength] || 800;
      const multiplier = complexityMultipliers[queryComplexity] || 1.0;

      const maxTokens = Math.ceil(baseTokens * multiplier);

      logger.debug(
        `Adaptive response length for user ${userId}: ` +
          `${maxTokens} tokens (length=${preferredLength}, complexity=${queryComplexity})`,
      );

      return maxTokens;
    } catch (error) {
      logger.error(
        `Error calculating adaptive response length: ${error.message}`,
      );
      return 800; // Default
    }
  }

  /**
   * Rank search results based on user context
   * @param {Array<Object>} results - List of search results
   * @param {Object} userProfile - User profile dictionary
   * @param {Array<string>} userModules - User's enrolled modules
   * @returns {Array<Object>} Re-ranked results
   */
  rankSearchResults(results, userProfile, userModules = []) {
    try {
      // Scoring function
      const scoreResult = (result) => {
        let score = 0.0;

        // Base relevance score
        score += (result.relevance_score || 0.5) * 100;

        // Boost for user's modules
        const resultModules = result.modules || [];
        resultModules.forEach((module) => {
          if (userModules.includes(module)) {
            score += 50;
          }
        });

        // Boost for matching academic level
        const resultLevel = result.academic_level || "";
        if (resultLevel === userProfile.academicLevel) {
          score += 20;
        }

        // Recency bonus
        if (result.date) {
          const resultDate = new Date(result.date);
          const daysOld = Math.floor(
            (Date.now() - resultDate) / (1000 * 60 * 60 * 24),
          );
          if (daysOld < 30) {
            score += 30;
          } else if (daysOld < 90) {
            score += 15;
          }
        }

        return score;
      };

      // Score and sort
      const scoredResults = results.map((result) => ({
        ...result,
        personalization_score: scoreResult(result),
      }));

      const ranked = scoredResults.sort(
        (a, b) => b.personalization_score - a.personalization_score,
      );

      logger.info(`Ranked ${ranked.length} results for user ${userProfile.id}`);
      return ranked;
    } catch (error) {
      logger.error(`Error ranking search results: ${error.message}`);
      return results; // Return original order on error
    }
  }

  /**
   * Determine if a reminder should be shown based on frequency limits
   * @param {string} reminderKey - Unique identifier for reminder
   * @param {string} userId - The user's ID
   * @param {Date} lastShown - When reminder was last shown
   * @param {number} minIntervalHours - Minimum hours between showing same reminder
   * @returns {boolean} True if reminder should be shown
   */
  shouldShowReminder(
    reminderKey,
    userId,
    lastShown = null,
    minIntervalHours = 24,
  ) {
    try {
      if (!lastShown) {
        return true;
      }

      const timeSinceLastShown = Date.now() - new Date(lastShown).getTime();
      const minInterval = minIntervalHours * 60 * 60 * 1000;

      const shouldShow = timeSinceLastShown >= minInterval;

      logger.debug(
        `Reminder '${reminderKey}' for user ${userId}: ` +
          `should_show=${shouldShow} (interval=${timeSinceLastShown}ms)`,
      );

      return shouldShow;
    } catch (error) {
      logger.error(`Error checking reminder frequency: ${error.message}`);
      return true; // Show reminder by default on error
    }
  }
}

module.exports = PersonalizationService;
