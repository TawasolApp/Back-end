import { firebaseAdminProvider } from '../firebase-admin.provider';

async function testFirebaseConnection() {
  const firebaseAdmin = firebaseAdminProvider.useFactory();

  // Register a test user with a valid FCM token
  const testUserId = 'test-user-id';
  const testToken = 'your-valid-fcm-token-here'; // Replace with a valid FCM token
  firebaseAdmin.registerUser(testUserId, testToken);

  // Send a test notification
  const message = {
    title: 'Test Notification',
    body: 'This is a test notification from Firebase.',
  };

  try {
    await firebaseAdmin.sendNotificationToUser(testUserId, message);
    console.log('Test notification sent successfully.');
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
}

testFirebaseConnection();
