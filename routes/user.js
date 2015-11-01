var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email: String,
        password: String,
        firstName: String,
        lastName: String
    },
    employer     : [{
        empname: String,
        streetaddress: String,
        city: String,
        state: String,
        zipcode: String,
        phonenumber: String,
        email: String,
        contact: String,
        altemail: String,
        altcontact: String,
        comments: String,
        payroll: String,
        dental: String,
        cashadvantage: String,
        vision: String
        }]
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};


// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);