import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../Models/User.js';
import { generate } from '../Utils/WebToken.js';

dotenv.config();

// Function to generate a unique username for new users
const generateUniqueUsername = async (displayName) => {
  let baseUsername = displayName.split(" ")[0].toLowerCase() + "_vellura";
  let username = baseUsername;
  let counter = 1;

  // Check if the generated username already exists, append a counter if necessary
  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
};

// Setup Google authentication middleware in the Express app
export const setupGoogleAuth = (app) => {
  app.use(passport.initialize()); // Initialize passport

  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback' // Google OAuth callback URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists in the database
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // Generate a unique username for the new user
          const uniqueUsername = await generateUniqueUsername(profile.displayName);

          // Create and save a new user in the database
          user = new User({
            name: profile.displayName,
            username: uniqueUsername,
            email: profile.emails[0].value,
            isVerified: true
          });

          await user.save();
        }

        return done(null, user); // Pass the user object to Passport
      } catch (error) {
        return done(error, null);
      }
    }
  ));
};

// Route handler to initiate Google authentication
export const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

// Route handler for the Google OAuth callback
export const googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      return res.send(
        `<script>
          window.opener.postMessage({ error: "Google authentication failed" }, "*");
          window.close();
        </script>`
      );
    }

    // Ensure the user is correctly retrieved from the database
    const dbUser = await User.findOne({ email: user.email }); 
    if (!dbUser) {
      return res.send(
        `<script>
          window.opener.postMessage({ error: "User not found in database" }, "*");
          window.close();
        </script>`
      );
    }

    // Generate JWT for the authenticated user
    const token = generate(dbUser._id, res);

    // Send the authentication response to the frontend and close the popup
    res.send(
      `<script>
        window.opener.postMessage({
          token: "${token}",
          user: { 
            name: "${dbUser.name}", 
            username: "${dbUser.username}",
            email: "${dbUser.email}", 
            userId: "${dbUser._id.toString()}"
          }
        }, "*");
        window.close();
      </script>`
    );
  })(req, res, next);
};
