const {onCall} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");

// אתחול Admin SDK
admin.initializeApp();

// Cloud Function למחיקת משתמש מ-Authentication - גרסה פשוטה
exports.deleteUserFromAuth = onCall(async (request) => {
  try {
    logger.info("deleteUserFromAuth called");
    
    const { email } = request.data;
    if (!email) {
      throw new Error("Email is required");
    }

    logger.info(`Attempting to delete user with email: ${email}`);

    try {
      // מציאת המשתמש לפי email
      const userRecord = await admin.auth().getUserByEmail(email);
      logger.info(`Found user: ${userRecord.uid}`);
      
      // מחיקת המשתמש מ-Authentication
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