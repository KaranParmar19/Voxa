import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

// Only initialize Google OAuth if credentials are properly configured
const isGoogleConfigured =
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID.length > 20 &&
    process.env.GOOGLE_CLIENT_SECRET.length > 20;

if (isGoogleConfigured) {
    console.log('✅ Google OAuth configured');

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: '/api/auth/google/callback',
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user exists
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        return done(null, user);
                    }

                    // Check if user exists with same email (link accounts)
                    user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        user.googleId = profile.id;
                        await user.save();
                        return done(null, user);
                    }

                    // Create new user
                    const newUser = await User.create({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        googleId: profile.id,
                        avatar: profile.photos[0].value,
                    });

                    done(null, newUser);
                } catch (error) {
                    done(error, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
} else {
    console.log('⚠️  Google OAuth NOT configured - using placeholder credentials');
    console.log('   To enable Google OAuth, update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
    console.log('   Email/password authentication is still available.');
}

export default passport;
