const {onCall} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Admin SDK
admin.initializeApp();

/**
 * Cloud Function to delete user from Authentication
 * Simple version that removes user from Firebase Auth by email
 * 
 * @param {Object} request - The request object containing user data
 * @param {string} request.data.email - Email of the user to delete
 * @returns {Object} Response object with success status and message
 */
exports.deleteUserFromAuth = onCall(async (request) => {
  try {
    logger.info("deleteUserFromAuth called");
    
    const { email } = request.data;
    if (!email) {
      throw new Error("Email is required");
    }

    logger.info(`Attempting to delete user with email: ${email}`);

    try {
      // Find user by email
      const userRecord = await admin.auth().getUserByEmail(email);
      logger.info(`Found user: ${userRecord.uid}`);
      
      // Delete user from Authentication
      await admin.auth().deleteUser(userRecord.uid);
      
      logger.info(`Successfully deleted user ${email}`);
      
      return { 
        success: true, 
        message: `User ${email} deleted successfully` 
      };

    } catch (authError) {
      logger.error("Auth error:", authError);
      
      if (authError.code === 'auth/user-not-found') {
        logger.info("User not found in Authentication");
        return { 
          success: true, 
          message: "User not found in Authentication" 
        };
      }
      
      throw authError;
    }

  } catch (error) {
    logger.error("Error:", error);
    throw new Error(`Failed to delete user: ${error.message}`);
  }
});