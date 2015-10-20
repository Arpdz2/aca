var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var adminSchema = mongoose.Schema({
        agentid: String,
        employerid: String,
        email: String,
        password: String
});

// methods ======================
// generating a hash
adminSchema.methods.generateHash = function(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
adminSchema.methods.validPassword = function(password) {
        return bcrypt.compareSync(password, this.password);
};

// create the model for employees and expose it to our app
module.exports = mongoose.model('Admin', adminSchema);