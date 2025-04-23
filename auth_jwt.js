var passport = require('passport');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var User = require('./Users');

// Verify SECRET_KEY is set
if (!process.env.SECRET_KEY) {
    console.error('FATAL ERROR: SECRET_KEY environment variable is not set');
    process.exit(1);
}

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
opts.secretOrKey = process.env.SECRET_KEY;

// Log the JWT configuration
console.log('JWT Configuration:', {
    hasSecretKey: !!process.env.SECRET_KEY,
    secretKeyLength: process.env.SECRET_KEY ? process.env.SECRET_KEY.length : 0
});

passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    User.findById(jwt_payload.id, function (err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    });
}));

exports.isAuthenticated = passport.authenticate('jwt', { session : false });
exports.secret = opts.secretOrKey;