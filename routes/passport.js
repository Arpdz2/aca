// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
// load up the user model
var User = require('../routes/user');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {

            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function() {

                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    }
                    else if (req.body.password != req.body.passwordverify) {
                            return done(null, false, req.flash('signupMessage', 'Passwords are not the same'));
                    } else {
                        if (req.body.agentcode == 'nathantoal56712') //check to make sure they know agent code
                        {
                            // if there is no user with that email
                            // create the user
                            var newUser = new User();

                            // set the user's local credentials
                            newUser.local.email = email;
                            newUser.local.password = newUser.generateHash(password);
                            newUser.local.firstName = req.body.firstname;
                            newUser.local.lastName = req.body.lastname;
                            newUser.local.role = "agent";
                            // save the user
                            newUser.save(function (err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        } else if (req.body.agentcode == 'V,sG#g5[{]`*vBn^') {
                            
                            var newUser = new User();
                            newUser.local.email = email;
                            newUser.local.password = newUser.generateHash(password);
                            newUser.local.firstName = req.body.firstname;
                            newUser.local.lastName = req.body.lastname;
                            newUser.local.role = "admin";
                            
                            newUser.save(function (err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        }
                        else
                            return done(null, false, req.flash('signupMessage', 'Invalid Agent Code.'));
                    }

                });

            });

        }));



// =========================================================================
// LOCAL LOGIN =============================================================
// =========================================================================
// we are using named strategies since we have one for login and one for signup
// by default, if there was no name, it would just be called 'local'

passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
            
            console.log(user.local.role);
            if (user.local.role == undefined)
                return done(null, false, req.flash('loginMessage', 'No role defined for this user.'));

            // all is well, return successful user
            return done(null, user);
        });

    }));

};