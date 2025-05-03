import * as admin from 'firebase-admin';

const userTokens = new Map<string, string>(); // Map to store userId and their FCM tokens

export const firebaseAdminProvider = {
  provide: 'FIREBASE_ADMIN',
  useFactory: () => {
    let defaultApp: admin.app.App;

    // Check if the app is already initialized
    if (!admin.apps.length) {
      defaultApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FCM_PROJECT_ID,
          clientEmail: process.env.FCM_CLIENT_EMAIL,
          privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      defaultApp = admin.app(); // Use the already initialized app
    }

    return {
      defaultApp,
      sendNotificationToUser: async (
        userId: string,
        message: { title: string; body: string }, // Simplified message parameter
      ) => {
        const token = userTokens.get(userId); // Dynamically fetch the token
        if (token) {
          try {
            const firebaseMessage: admin.messaging.Message = {
              notification: {
                title: message.title,
                body: message.body,
              },
              token,
            };
            await admin.messaging().send(firebaseMessage);
            console.log(
              `Notification sent to user ${userId}, with token ${token}`,
            );
          } catch (error) {
            console.error(
              `Error sending notification to user ${userId}:`,
              error,
            );
            throw new Error(
              `Failed to send notification to user ${userId}: ${error.message}`,
            );
          }
        } else {
          console.warn(`No token found for user ${userId}`);
          throw new Error(`No token found for user ${userId}`);
        }
      },
    };
  },
};
