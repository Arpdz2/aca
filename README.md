# ACA

A Node.js app built specifically for [ACA Insurance Group](http://acainsuresme.com/).

This application uses [Express 4](http://expressjs.com/en/index.html), [MongoDB](https://www.mongodb.org/), [Mandrill](http://www.mandrill.com/), and [passport-local](https://github.com/jaredhanson/passport-local) to deliver a robust set of features hosted on a flexible [Heroku](https://www.heroku.com/) platform.

## Running Locally

Make sure you have [Node.js](https://nodejs.org/en/) and the [Heroku Toolbelt](https://toolbelt.heroku.com/) installed.

```sh
$ git clone https://github.com/bsmckamey/aca.git # or clone your own fork
$ cd aca
$ npm install
$ npm start
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Application Structure

```sh
- public
------ common-files                     <!-- startup framework kit -->
------ flat-ui                          <!-- flat-ui kit -->
------ img                              <!-- custom images -->
------ js                               <!-- custom js -->
------ less                             <!-- custom less -->
------ pdf                              <!-- default pdfs -->
------ stylesheets                      <!-- custom css -->
------ video                            <!-- custom videos -->
- routes
------ admin.js                         <!-- admin model -->
------ captcha.js                       <!-- captcha settings -->
------ db.js                            <!-- database connection settings -->
------ employee.js                      <!-- employee model -->
------ fdfdata.js                       <!-- forms data format (fdf) model -->
------ passport.js                      <!-- local strategies for passport -->
------ sendEmail.js                     <!-- reusable passwordReset and forgotEmail functions -->
------ udpdateEmail.js                  <!-- reusable update function for data change notices -->
------ user.js                          <!-- user model -->
------ userFunctions.js                 <!-- holds mongodb functions for user collection -->
------ utility.js                       <!-- random utilities stored here -->
- views
------ pages
------------ adminDashboard.ejs         <!-- show admin dashboard -->
------------ adminEmployee.ejs          <!-- show admin editing employee -->
------------ adminEmployer.ejs          <!-- show admin editing employer -->
------------ agentDashboard.ejs         <!-- show agent dashboard -->
------------ case.ejs                   <!-- create new employer case -->
------------ confirm.ejs                <!-- confirm changes -->
------------ contact.ejs                <!-- show contact us page -->
------------ db.ejs                     <!-- show database results -->
------------ employee.ejs               <!-- show employee created page -->
------------ employer.ejs               <!-- show employer case -->
------------ healthplan.ejs             <!-- show healthplan page -->
------------ index.ejs                  <!-- show home page -->
------------ information.ejs            <!-- show employee their information -->
------------ login.ejs                  <!-- employee login -->
------------ login2.ejs                 <!-- agent/admin login -->
------------ passwordExpired.ejs        <!-- password has expired, prompt for new one -->
------------ quote.ejs                  <!-- get a quote -->
------------ recovery.ejs               <!-- account recovery -->
------------ search.ejs                 <!-- agent search functionality -->
------------ signup.ejs                 <!-- employee signup -->
------------ signup2.ejs                <!-- agent/admin signup -->
------------ smallbusiness.ejs          <!-- show small business page -->
------------ success.ejs                <!-- show email has been sent -->
------ partials
------------ footer.ejs                 <!-- footer partial -->
------------ header.ejs                 <!-- header partial -->
------------ nav.ejs                    <!-- navigation partial -->
- app.json                              <!-- application info for web -->
- index.js                              <!-- application guts -->
- package.json                          <!-- handle npm packages -->
- Procfile                              <!-- tell heroku how to launch app -->
- README.md                             <!-- application info for reader -->
```

## Application

### Packages

#### package.json

```sh
{
  "name": "aca",
  "version": "0.1.4",
  "description": "Affordable Care Act Insurance Group",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "bcrypt-nodejs": "0.0.3",
    "body-parser": "*",
    "connect-flash": "^0.1.1",
    "cookie-parser": "^1.4.0",
    "ejs": "^2.3.1",
    "express": "~4.9.x",
    "express-session": "^1.11.3",
    "express-sslify": "^1.0.1",
    "fdf": "*",
    "fs": "*",
    "https": "^1.0.0",
    "method-override": "^2.3.5",
    "mongoose": "^4.1.8",
    "morgan": "^1.6.1",
    "nodemailer": "*",
    "nodemailer-mandrill-transport": "*",
    "passport": "^0.3.0",
    "passport-local": "^1.0.0",
    "path": "*",
    "pdfkit": "^0.7.1",
    "random-js": "^1.0.6",
    "util": "^0.10.3"
  },
  "engines": {
    "node": "0.12.2"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/bsmckamey/aca"
  },
  "keywords": [
    "ACA",
    "ACA Insurance Group",
    "Affordable Care Act"
  ],
  "license": "MIT"
}
```

### Application Setup

#### index.js

```sh
var express = require('express'),
    sendEmail = require('./routes/sendEmail.js'),
    passwordExpired = require('./routes/passwordExpired.js'),
    bodyParser = require('body-parser'),
    app = express(),
    dbConfig = require('./routes/db.js'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    flash = require('connect-flash'),
    morgan = require('morgan'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    random = require("random-js"),
    user = require('./routes/user.js'),
    employee = require('./routes/employee.js'),
    userFunctions = require('./routes/userFunctions.js'),
    nodemailer = require('nodemailer'),
    mandrillTransport = require('nodemailer-mandrill-transport'),
    fdf = require('fdf'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    util = require('util'),
    PDFDocument = require ('pdfkit'),
    enforce = require('express-sslify'),
    utility = require('./routes/utility.js'),
    fdfgenerator = require('./routes/fdfdata.js'),
    updateEmail = require('./routes/updateEmail.js');


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)

mongoose.connect(dbConfig.url);

require('./routes/passport')(passport);

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// required for passport
app.use(session({ secret: 'qwdqwdqwdqwdrfergwefdwcwcqcqwdlkqwjmqwdi' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


/*used to enforce https on get requests
app.use('*', function(req,res,next){
    var requestedurl = req.protocol + '://' + req.get('Host') + req.url;
    if (requestedurl.indexOf('localhost') != -1){
        console.log("no https enforced");
        next();
        //dont enforce https
    }
    else {
        app.use(enforce.HTTPS({ trustProtoHeader: true }));
        console.log("https enforced");
        next();
    }
});
*/


//app.use(enforce.HTTPS({ trustProtoHeader: true })); //*****Enable for production to force https******

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/employee/pdf/generator/:employeeid', isLoggedIn, function(req, res)
{
    employee.findOne({_id: req.params.employeeid}, function (err, result) {
        if (result.signature) {
            var img = result.signature;
            // strip off the data: url prefix to get just the base64-encoded bytes
            var data = img.replace(/^data:image\/\w+;base64,/, "");
            var buf = new Buffer(data, 'base64');
            fs.writeFile(result._id + '.png', buf, function (err) {
                console.log("image produced");
                var doc = new PDFDocument;
                var writeStream = fs.createWriteStream(result._id + 'stamp.pdf');
                doc.pipe(writeStream);
                doc.image(result._id + '.png', 60, 432, {width: 160, height: 12});
                doc.end();
                writeStream.on('finish', function () {
                console.log("stamp pdf");
                    var stamped = spawn('cpdf', ['-stamp-on', result._id + 'stamp.pdf', './public/pdf/combinedpdf.pdf', '2', '-o', result._id + '.pdf']);
                    stamped.on('close', function(code){
                    console.log("stamped pdf");
                        fdfgenerator.generate(result, function(fdfdata){
                        var data = fdfdata;
                        fs.writeFile(result._id + '.fdf', data, function (err) {
                        console.log("fdf");
                            var final = spawn('pdftk', [result._id + '.pdf', 'fill_form', result._id + ".fdf", 'output', result._id + 'final.pdf', 'flatten']);
                            final.on('close', function(code){
                                console.log("final pdf");
                                    res.redirect('/pdf/' + result.id + "/employee.pdf");
                                    console.log("redirect");
                            });
                        });
                    });
                });
            });
        });
    }
        else {
        res.redirect(req.get('referer'));
        }
    });
});

app.get('/pdf/:employeeid/employee.pdf', isLoggedIn, function(request, response){
    var emp = request.params.employeeid;
    var tempFile= request.params.employeeid + "final.pdf";
    fs.readFile(tempFile, function (err,data){
        response.contentType("application/pdf");
        response.send(data);
        console.log("pdf load")
        response.on('finish', function() {
        fs.unlink(emp + '.fdf', function(err) {
            fs.unlink(emp + '.pdf', function(err) {
                fs.unlink(emp + '.png', function(err) {
                    fs.unlink(emp + 'stamp.pdf', function(err) {
                        fs.unlink(emp + 'final.pdf', function(err) {
                            console.log("All files successfully removed");
                            });
                        });
                    });
                });
            });
        });
    });
});

app.get('/passwordExpired', function(req, res){
    console.log(req.session.email);
    emailAddress = req.session.email;
    res.render('pages/passwordExpired', {emailAddress : emailAddress, message : ''});
});

app.post('/passwordExpired', function(req, res){
    employee.findOne({ 'email' :  req.body.email }, function(err, user) {
        if (err) {
            console.log("error");
        }
        if (req.body.password != req.body.passwordverify)
        {
            res.render('pages/passwordExpired', {emailAddress : emailAddress, message : "Passwords are not the same" });
        }
        else
        {
            employee.findOne({_id: req.session.employee}, function (err, result) {
                var mongo = new employee();
                result.password = mongo.generateHash(req.body.password);
                result.passwordIsExpired = "FALSE";
                result.save(function (err) {
                    res.redirect('/information');
                });
            });
        }  
    });
});

app.get('/quote', function(request, response) {
  response.render('pages/quote');
});

app.post('/submitContactForm', function(request, response) {
    var firstName = request.body.firstName
    var lastName = request.body.lastName
    var companyName = request.body.companyName
    var emailAddress = request.body.emailAddress
    var phoneNumber = request.body.phoneNumber
    var comments = request.body.comments
    
//    sendEmail.sendQuote(firstName, lastName, streetAddress, city, state, zipCode, phoneNumber, emailAddress, comments, function(statusCode, result) {
//        console.log("Email sent...");
//    })
    response.render('pages/success');
});


app.get('/success', function(request, response) {
  response.render('pages/success');
});

app.get('/smallbusiness', function(request, response) {
    response.render('pages/smallbusiness');
    console.log("Rendering small business tab");
});

app.get('/healthplan', function(request, response) {
    response.render('pages/healthplan');
    console.log("Rendering health plan tab");
});

app.get('/contact', function(request, response) {
    response.render('pages/contact');
    console.log("Rendering contact us tab");
});

app.get('/agentLogin', function(req, res) {
    res.render('pages/login',{ message: req.flash('loginMessage') });
    console.log("Rendering login tab");
});

app.get('/signup', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('pages/signup', { message: req.flash('signupMessage') });
});

app.get('/agentDashboard', isLoggedIn, function(req, res) {
    res.render('pages/agentDashboard', {
        user : req.user // get the user out of session and pass to template
    });
});

app.get('/adminDashboard', isLoggedIn, function(req, res) {
    userFunctions.list(function (err, data) {
        res.render('pages/adminDashboard', {
            user : req.user, // get the user out of session and pass to template
            users : data
        });
    });
});

app.post('/search', isLoggedIn, function(req, res) {
    console.log(req.body.search);
    employee.find(
        { $text : { $search : req.body.search } },
        { score : { $meta: "textScore" } }
    )
        .sort({ score : { $meta : 'textScore' } })
        .exec(function(err, results) {
            if (err) {
                res.redirect('/agentDashboard');
            }
            else if (results) {
                res.render('pages/search', {
                    user: req.user, search: results // get the user out of session and pass to template
                });
            }
            else {
                res.redirect('/agentDashboard');
            }
    });
});


app.get('/logout', function(req, res) {
    req.logout();
    req.session.employee = null;
    res.redirect('/');
});


// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    
    if (req.isAuthenticated()) {
        // if user is authenticated in the session, carry on
        return next();
    } else {
        // if they aren't redirect them to the home page
        res.redirect('/');
    }
}

app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/agentDashboard', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

app.post('/agentLogin',
         passport.authenticate('local-login', { failureRedirect : '/agentLogin', failureFlash : true }),
        function(req, res) {
            console.log(req.user.local.role);
            if (req.user.local.role == "agent") {
                res.redirect('/agentDashboard');
            } else if (req.user.local.role == "admin") {
                res.redirect('/adminDashboard');
            }
        }
);

//add a new case
app.get('/profile/case', isLoggedIn, function(req, res)
{
    res.render('pages/case', {
        user : req.user // get the user out of session and pass to template
    });
});

//post employer info and ref it to corresponding agent
app.post('/profile/case', isLoggedIn,function (req, res, next){
    var a = req.user;
    user.findByIdAndUpdate(
        a._id,
        {$push: {"employer": {  empname: req.body.empname,
                                streetaddress: req.body.streetaddress,
                                city: req.body.city,
                                state: req.body.state,
                                zipcode: req.body.zipcode,
                                phonenumber: req.body.phonenumber,
                                email: req.body.email,
                                contact: req.body.contact,
                                altemail: req.body.altemail,
                                altcontact: req.body.altcontact,
                                comments: req.body.comments,
                                payroll: req.body.payroll,
                                dental: req.body.dental,
                                cashadvantage: req.body.cashadvantage,
                                vision: req.body.vision
        }}},
        {safe: true, upsert: true, new : true},
        function(err, model)
        {
            console.log(err);
            return res.redirect('/agentDashboard');
        }
    );
});

app.get('/:employer/sendemail/:id/:eid/:employeremail/:altemail', isLoggedIn, function(req, res) {
    var agentEmail = req.user.local.email;
    var transport = nodemailer.createTransport(mandrillTransport({
        auth: {
            apiKey: 'y-Z7eNsStP65JC4YKJD3Lg'
        }
    }));
    transport.sendMail({
        from: 'ACA Insurance Group  <noreply@acainsuresme.com>',
        to: req.params.employeremail,
        cc: req.params.altemail + ", " + agentEmail,
        subject: 'ACA Insurance Employee Registration Link',
        html: '<p>Dear ' + req.params.employer + ',</p><p>Please forward the below link to your employees in order to register for ACA coverage:</p><p>' + req.protocol + '://' + req.get("host") + '/signup/' + req.params.id + '/' + req.params.eid + '</p><br/><p>Thank you,</p><p>ACA Insurance Group</p>'
    }, function(err, info) {
        if (err) {
            console.error(err);
        } else {
            console.log('Message sent: ' + info.response);
            res.redirect('/agentDashboard');
        }
    });
});


app.get('/:id/:eid', isLoggedIn, function(req, res)
{
    //var a = req.user;
    var signupUrl = req.protocol + '://' + req.get('host') + '/signup'  + req.originalUrl;
    var eid = req.params.eid;
    var id = req.params.id;
    req.session.empid = eid;
    console.log(req.session.empid);
    user.findOne({'_id' : req.params.id }, function (err, user) {
        if (err) {
            throw(err);
        }
        console.log("User:" + user);
        employee.find({}, function(err, docs){
            if(err) {
                throw(err);
            }
            res.render('pages/employer', {user : user, page : eid, emp : docs, url: signupUrl/*, title: post.title, url: post.URL */});
        });
    });
});

app.get('/:id/:eid/:firstName/:lastName', isLoggedIn, function(req, res)
{
    var url = req.originalUrl;
    var eid = req.params.eid;
    var id = req.params.id;
    req.session.empid = eid;
    console.log(req.session.empid);
    employee.find({}, function(err, docs){
        if(err) {
            res.json(err);
        }
        res.render('pages/adminEmployee');
    });
});


app.get('/delete', isLoggedIn, function(req, res) {
    var a = req.user;
    //var url = req.originalUrl;
    //var eid = url.substr(url.lastIndexOf('/')+1);
    var eid = req.session.empid;
    console.log(eid);
    console.log(mongoose.Types.ObjectId.isValid(eid));
    var isvalid = mongoose.Types.ObjectId.isValid(eid)
    if (isvalid === true) {
        employee.remove({employerid: eid}, function (err) {
            if (!err) {
                console.log("Successfully removed corresponding employee accounts");
            }
        });
        a.employer.pull(eid)
            a.save(function (err) {
                req.session.empid = null;
                res.redirect('/agentDashboard');
            });
    }
});

app.post('/update/:id/:employerid', isLoggedIn, function(req, res){
    //var a = req.user;
    var a = req.params.id;
    var id = req.params.employerid;
    //user.update({"_id" : a._id, "employer._id" : id},{$set : {
    user.update({"employer._id" : id},{$set : {
        "employer.$.empname": req.body.empname,
        "employer.$.contact": req.body.contact,
        "employer.$.altemail": req.body.altemail,
        "employer.$.altcontact": req.body.altcontact,
        "employer.$.streetaddress": req.body.streetaddress,
        "employer.$.city": req.body.city,
        "employer.$.state": req.body.state,
        "employer.$.zipcode": req.body.zipcode,
        "employer.$.phonenumber": req.body.phonenumber,
        "employer.$.email": req.body.email,
        "employer.$.comments": req.body.comments
    }}, function(err, docs) {
        if (err) console.log(err);
        else if (docs) console.log(docs);
        else console.log("failure");
    });
    //res.redirect('/' + a._id + '/' + id);
    res.redirect('/' + a + '/' + id);
});

app.get('/signup/:agentid/:employerid', function(req,res){
    req.session.agentid = req.params.agentid;
    req.session.employerid = req.params.employerid;
    user.findOne({'_id' : req.params.agentid }, function(err, docs) {
        if (err) res.redirect('/');
        else if(docs == null) res.redirect('/');
        else {
            user.find({
                '_id': { $in: [
                    req.params.employerid
                ]}
            }, function(err, docs){
                console.log(docs);
                if (docs != undefined)
                res.render('pages/signup2', {message: ""});
                else res.redirect('/');
            });
        }
    });
});

app.post('/signup2', function(req,res){
    employee.findOne({ 'email' :  req.body.email }, function(err, user) {
        if (err) {
            console.log("error");
        }
        if (user) {
            res.render('pages/signup2', {message : "Email already taken" });
        }
        else if (req.body.password != req.body.passwordverify)
        {
            res.render('pages/signup2', {message : "Passwords are not the same" });
        }
        else
        {
            var newuser = new employee();
            newuser.email = req.body.email;
            newuser.password = newuser.generateHash(req.body.password);
            newuser.agentid = req.session.agentid;
            newuser.employerid = req.session.employerid;
            newuser.save(function (err) {
                req.session.employee = newuser._id;
                res.redirect('/information');
            });
        }
    });
});

app.get('/login', function(req,res){
    res.render('pages/login2', {message : "" });
});

app.post('/login', function(req,res){
    employee.findOne({ 'email' :  req.body.email }, function(err, user) {
        if (err) {
            console.log(err);
        // if no user is found, return the message
        } else if (!user) {
            res.render('pages/login2', {message : "No user exists" });
        // if the user is found but the password is wrong
        } else if (!user.validPassword(req.body.password)) {
            res.render('pages/login2', {message : "Invalid Password" });
        // if the user's password is expired
        } else if (user.passwordIsExpired == "TRUE") {
            console.log("Password is expired.")
            req.session.email = req.body.email;
            req.session.employee = user._id
            res.redirect('/passwordExpired');
        // all is well, return successful user
        } else {
            req.session.employee = user._id;
            res.redirect('/information');
        }
    });
});

app.get('/recovery', function(req, res){
    res.render('pages/recovery');
});

app.post('/recovery', function(req, res){
    
    var optionsRadios = req.body.optionsRadios;
    
    if (optionsRadios == 'option1') {
        sendEmail.passwordReset(req, function(string){
            res.render('pages/login2', {message : string});
        });
    } else if (optionsRadios == 'option2') {
        sendEmail.forgotEmail(req, res, function(string) {
            res.render('pages/login2', {message : string});
        });
    } else if (optionsRadios == 'option3') {
        console.log("option3 not setup.");
    }
    

});

app.get('/information', function(req,res){
    if (req.session.employee && req.session.employee != null) {
        employee.findOne({_id: req.session.employee}, function (err, result) {
            var agentid = result.agentid;
            var employerid = result.employerid;
            user.findOne({'_id': agentid}, function (err, docs) {
                res.render('pages/information', {employee: result, user: docs, employerid: employerid});
            });
        });
    }
    else{
        res.redirect('/');
    }
});

app.post('/information', function(req,res){
    if (req.session.employee && req.session.employee != null) {
        employee.findOne({_id: req.session.employee}, function (err, result) {
            updateEmail.update(req, result, function(message) {
                console.log(message);
                if (req.body.signatureid) {
                    result.signature = req.body.signatureid;
                }
                result.firstname = req.body.FirstName;
                result.lastname = req.body.LastName;
                result.maritalstatus = req.body.MaritalStatus;
                result.spousefirstname = req.body.SpouseFirstName;
                result.spouselastname = req.body.SpouseLastName;
                result.phonenumber = req.body.PhoneNumber;
                result.altphonenumber = req.body.AlternatePhoneNumber;
                result.address = req.body.Address;
                result.city = req.body.City;
                result.state = req.body.State;
                result.zip = req.body.Zip;
                result.email = req.body.Email;
                result.birthdate = req.body.BirthDate;
                result.coveragenumber = req.body.NumberofPeopleThatNeedCoverage;
                result.ss = req.body.PrimarySocialSecurity;
                result.gender = req.body.Gender;
                result.d1firstname = req.body.Dependent1FirstName;
                result.d1lastname = req.body.Dependent1LastName;
                result.d1birthdate = req.body.Dependent1BirthDate;
                result.d1ss = req.body.Dependent1SocialSecurity;
                result.d1gender = req.body.Dependent1Gender;
                result.d1coverage = req.body.Dependent1NeedsCoverage;
                result.d2firstname = req.body.Dependent2FirstName;
                result.d2lastname = req.body.Dependent2LastName;
                result.d2birthdate = req.body.Dependent2BirthDate;
                result.d2ss = req.body.Dependent2SocialSecurity;
                result.d2gender = req.body.Dependent2Gender;
                result.d2coverage = req.body.Dependent2NeedsCoverage;
                result.d3firstname = req.body.Dependent3FirstName;
                result.d3lastname = req.body.Dependent3LastName;
                result.d3birthdate = req.body.Dependent3BirthDate;
                result.d3ss = req.body.Dependent3SocialSecurity;
                result.d3gender = req.body.Dependent3Gender;
                result.d3coverage = req.body.Dependent3NeedsCoverage;
                result.d4firstname = req.body.Dependent4FirstName;
                result.d4lastname = req.body.Dependent4LastName;
                result.d4birthdate = req.body.Dependent4BirthDate;
                result.d4ss = req.body.Dependent4SocialSecurity;
                result.d4gender = req.body.Dependent4Gender;
                result.d4coverage = req.body.Dependent4NeedsCoverage;
                result.employername = req.body.employer;
                result.employerphone = req.body.employerphone;
                result.income = req.body.income;
                result.physician = req.body.physician;
                result.physicianspecialty = req.body.physicianspecialty;
                result.ailment1 = req.body.ailment1;
                result.ailment2 = req.body.ailment2;
                result.ailment3 = req.body.ailment3;
                result.prescription1 = req.body.prescription1;
                result.prescription2 = req.body.prescription2;
                result.prescription3 = req.body.prescription3;
                result.dosage1 = req.body.dosage1;
                result.dosage2 = req.body.dosage2;
                result.dosage3 = req.body.dosage3;
                result.save(function (err) {
                    res.redirect('/information?=saved');
                });
            });
        });
    }
    else{
        res.redirect('/');
    }
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
```

### Database Config

#### db.js

```sh
module.exports = {
    'url' : process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://heroku_1f0cf70q:kc3p5id312rg7abe74gt7f8ola@ds051953.mongolab.com:51953/heroku_1f0cf70q'
}
```

### Routes

#### captcha.js

```sh
var https = require('https');

exports.verifyRecaptcha = function(key, callback) {
    var SECRET = "6LdUuRATAAAAADwh_LDpYuzexNtNtNm0qXKY4G9l";
    https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET + "&response=" + key, function(res) {
        var data = "";
        res.on('data', function (chunk) {
            data += chunk.toString();
        });
        res.on('end', function() {
            try {
                var parsedData = JSON.parse(data);
                callback(parsedData.success);
            } catch (e) {
                callback(false);
            }
        });
    });
}
```

#### fdfdata.js

```sh
var fdf = require('fdf')
utility = require('./utility.js');

exports.generate = function(result, callback) {
    var single = "Off";
    var married = "Off";
    var spousefirst = result.spousefirstname;
    var spouselast = result.spouselastname;
    var datetime = new Date().toDateString();
    if (result.maritalstatus == 'Single') {single = "Yes"; spousefirst = ""; spouselast = "";}
    if (result.maritalstatus == 'Married') {married = "Yes";}
    var data = fdf.generate({
        "first name": result.firstname,
        "last name": result.lastname,
        "agent_id": result.agentid,
        "Agent Date": datetime,
        "single" : single,
        "married" : married,
        "spousefirstname" : spousefirst,
        "spouselastname" : spouselast,
        "Phone" : result.phonenumber,
        "ALT" : result.altphonenumber,
        "Address" : result.address,
        "City" : result.city,
        "State" : result.state,
        "Zip" : result.zip,
        "Email" : result.email,
        "Birth date" : utility.convertDate(result.birthdate),
        "Number of People" : result.coveragenumber,
        "Primary Social Security" : result.ss,
        "d1firstname" : result.d1firstname,
        "d1lastname" : result.d1lastname,
        "d1birthdate" : utility.convertDate(result.d1birthdate),
        "d1ss" : result.d1ss,
        "d1gender" : result.d1gender,
        "d1gendercigna" : result.d1gender,
        "d1coverage" : result.d1coverage,
        "d2firstname" : result.d2firstname,
        "d2lastname" : result.d2lastname,
        "d2birthdate" : utility.convertDate(result.d2birthdate),
        "d2ss" : result.d2ss,
        "d2gender" : result.d2gender,
        "d2gendercigna" : result.d2gender,
        "d2coverage" : result.d2coverage,
        "d3firstname" : result.d3firstname,
        "d3lastname" : result.d3lastname,
        "d3birthdate" : utility.convertDate(result.d3birthdate),
        "d3ss" : result.d3ss,
        "d3gender" : result.d3gender,
        "d3gendercigna" : result.d3gender,
        "d3coverage" : result.d3coverage,
        "d4firstname" : result.d4firstname,
        "d4lastname" : result.d4lastname,
        "d4birthdate" : utility.convertDate(result.d4birthdate),
        "d4ss" : result.d4ss,
        "d4gender" : result.d4gender,
        "d4gendercigna" : result.d4gender,
        "d4coverage" : result.d4coverage,
        "employername" : result.employername,
        "employerphone" : result.employerphone,
        "income" : result.income,
        "physician" : result.physician,
        "specialty" : result.physicianspecialty,
        "ailment1" : result.ailment1,
        "ailment2" : result.ailment2,
        "ailment3" : result.ailment3,
        "prescription1" : result.prescription1,
        "prescription2" : result.prescription2,
        "prescription3" : result.prescription3,
        "dosage1" : result.dosage1,
        "dosage2" : result.dosage2,
        "dosage3" : result.dosage2,
        "gender" : result.gender
    });
    callback(data);
}
```

#### passport.js

```sh
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
```

#### sendEmail.js

```sh
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var employee = require('./employee.js');
var nodemailer = require('nodemailer');
var mandrillTransport = require('nodemailer-mandrill-transport');
var captcha = require('./captcha.js');


exports.passwordReset = function(req, callback) {

    employee.findOne({ 'email' : req.body.email }, function(err, user) {
            if (err) {
                console.log(err);
                callback("Invalid Email: No recovery Email sent.");
            } else if (user && user != null) {
                callback("Email Sent!");
                var password = Math.random().toString(36).slice(-8);
                var mongo = new employee();
                user.password = mongo.generateHash(password);
                user.passwordIsExpired = "TRUE";
                user.save(function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                
                var transport = nodemailer.createTransport(mandrillTransport({
                    auth: {
                        apiKey: 'y-Z7eNsStP65JC4YKJD3Lg'
                    }
                }));
                
                transport.sendMail({
                    from: 'ACA Insurance Group  <noreply@acainsuresme.com>',
                    to: user.email,
                    subject: 'ACA Insurance Credentials',
                    html: '<p>Dear ' + user.firstname + ',<br/>Your temporary password for ACA Insurance is below. Your username will be sent in a separate email. Please use the link below to login.<br/><b>Password: </b>' + password + '<br/><b>Link to site: </b>' + req.protocol + '://' + req.get("host") + '<br/>If you have any questions or issues regarding access to ACA Insurance, please e-mail EMAILHERE or call TEAMHERE at NUMBERHERE.</p><p>Thank you,<br/>ACA Insurance Group</p>'
                }, function(err, info) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Message sent: ' + info.response);
                    }
                });

                transport.sendMail({
                    from: 'ACA Insurance Group  <noreply@acainsuresme.com>',
                    to: user.email,
                    subject: 'ACA Insurance Credentials',
                    html: '<p>Dear ' + user.firstname + ',<br/>Your username for ACA Insurance is below. Your temporary password will be sent in a separate email. Please use the link below to login.<br/><b>Username: </b>' + user.email + '<br/><b>Link to site: </b>' + req.protocol + '://' + req.get("host") + '<br/>If you have any questions or issues regarding access to ACA Insurance, please e-mail EMAILHERE or call TEAMHERE at NUMBERHERE.</p><p>Thank you,<br/>ACA Insurance Group</p>'
                }, function(err, info) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Message sent: ' + info.response);
                    }
                });
                console.log("Password reset sent to " + user.email);
            }
        else {
                callback("Invalid Email: No recovery Email sent.");
            }

        });
};

exports.forgotEmail = function(req, res, callback) {
captcha.verifyRecaptcha(req.body["g-recaptcha-response"], function(success) {
    if (success) {
        console.log(success);
        employee.findOne({'ss': req.body.ss}, function (err, user) {
            if (err) {
                console.log(err);
                callback("No account was created with this SSN.");
            } else if (user && user != null) {
                callback("Your Email is " + user.email);
            }
            else {
                callback("No account was created with this SSN.");
            }
        });
    }
    else {
        console.log("Captcha failed");
        res.redirect('/recovery');
    }
    });
};
```

#### udpdateEmail.js

```sh
var express = require('express');
var user = require('./user.js');
var nodemailer = require('nodemailer');
var mandrillTransport = require('nodemailer-mandrill-transport');

exports.update = function(req, result, callback) {
    user.findOne({_id: result.agentid}, function (err, doc) {
        if (doc) {
            var update = ["<table style='width:100%'>", "<tr><td><b>Field</b></td><td><b>New</b></td><td><b>Old</b></td><tr>"];
            if (result.firstname != req.body.FirstName)                                 {update.push("<tr><td>First Name</td><td>" +  req.body.FirstName + "</td><td>" + result.firstname + "</td>")};
            if (result.lastname != req.body.LastName)                                   {update.push("<tr><td>Last Name</td><td>" +  req.body.LastName + "</td><td>" + result.lastname + "</td>")};
            if (result.maritalstatus != req.body.MaritalStatus)                         {update.push("<tr><td>Marital Status</td><td>" +  req.body.MaritalStatus + "</td><td>" + result.maritalstatus + "</td>")};
            if (result.spousefirstname != req.body.SpouseFirstName)                     {update.push("<tr><td>Spouse First Name</td><td>" +  req.body.SpouseFirstName + "</td><td>" + result.spousefirstname + "</td>")};
            if (result.spouselastname != req.body.SpouseLastName)                       {update.push("<tr><td>Spouse Last Name</td><td>" +  req.body.SpouseLastName + "</td><td>" + result.spouselastname + "</td>")};
            if (result.phonenumber != req.body.PhoneNumber)                             {update.push("<tr><td>Phone Number</td><td>" +  req.body.PhoneNumber + "</td><td>" + result.phonenumber + "</td>")};
            if (result.altphonenumber != req.body.AlternatePhoneNumber)                 {update.push("<tr><td>Alternate Phone Number</td><td>" +  req.body.AlternatePhoneNumber + "</td><td>" + result.altphonenumber + "</td>")};
            if (result.address != req.body.Address)                                     {update.push("<tr><td>Address</td><td>" +  req.body.Address + "</td><td>" + result.address + "</td>")};
            if (result.city != req.body.City)                                           {update.push("<tr><td>City</td><td>" +  req.body.City + "</td><td>" + result.city + "</td>")};
            if (result.state != req.body.State)                                         {update.push("<tr><td>State</td><td>" +  req.body.State + "</td><td>" + result.state + "</td>")};
            if (result.zip != req.body.Zip)                                             {update.push("<tr><td>Zip Code</td><td>" +  req.body.Zip + "</td><td>" + result.zip + "</td>")};
            if (result.email != req.body.Email)                                         {update.push("<tr><td>Email</td><td>" +  req.body.Email + "</td><td>" + result.email + "</td>")};
            if (result.birthdate != req.body.BirthDate)                                 {update.push("<tr><td>Birth Date</td><td>" +  req.body.BirthDate + "</td><td>" + result.birthdate + "</td>")};
            if (result.coveragenumber != req.body.NumberofPeopleThatNeedCoverage)       {update.push("<tr><td># of people receiving coverage</td><td>" +  req.body.NumberofPeopleThatNeedCoverage + "</td><td>" + result.coveragenumber + "</td>")};
            if (result.ss != req.body.PrimarySocialSecurity)                            {update.push("<tr><td>SSN</td><td>" +  req.body.PrimarySocialSecurity + "</td><td>" + result.ss + "</td>")};
            if (result.gender != req.body.Gender)                                       {update.push("<tr><td>Gender</td><td>" +  req.body.Gender + "</td><td>" + result.gender + "</td>")};
            if (result.d1firstname != req.body.Dependent1FirstName)                     {update.push("<tr><td>Dependent 1 First Name</td><td>" +  req.body.Dependent1FirstName + "</td><td>" + result.d1firstname + "</td>")};
            if (result.d1lastname != req.body.Dependent1LastName)                       {update.push("<tr><td>Dependent 1 Last Name</td><td>" +  req.body.Dependent1LastName + "</td><td>" + result.d1lastname + "</td>")};
            if (result.d1birthdate != req.body.Dependent1BirthDate)                     {update.push("<tr><td>Dependent 1 Birth Date</td><td>" +  req.body.Dependent1BirthDate + "</td><td>" + result.d1birthdate + "</td>")};
            if (result.d1ss != req.body.Dependent1SocialSecurity)                       {update.push("<tr><td>Dependent 1 Social Security</td><td>" +  req.body.Dependent1SocialSecurity + "</td><td>" + result.d1ss + "</td>")};
            if (result.d1gender != req.body.Dependent1Gender)                           {update.push("<tr><td>Dependent 1 Gender</td><td>" +  req.body.Dependent1Gender + "</td><td>" + result.d1gender + "</td>")};
            if (result.d1coverage != req.body.Dependent1NeedsCoverage)                  {update.push("<tr><td>Dependent 1 Coverage</td><td>" +  req.body.Dependent1NeedsCoverage + "</td><td>" + result.d1coverage + "</td>")};
            if (result.d2firstname != req.body.Dependent2FirstName)                     {update.push("<tr><td>Dependent 2 First Name</td><td>" +  req.body.Dependent2FirstName + "</td><td>" + result.d2firstname + "</td>")};
            if (result.d2lastname != req.body.Dependent2LastName)                       {update.push("<tr><td>Dependent 2 Last Name</td><td>" +  req.body.Dependent2LastName + "</td><td>" + result.d2lastname + "</td>")};
            if (result.d2birthdate != req.body.Dependent2BirthDate)                     {update.push("<tr><td>Dependent 2 Birth Date</td><td>" +  req.body.Dependent2BirthDate + "</td><td>" + result.d2birthdate + "</td>")};
            if (result.d2ss != req.body.Dependent2SocialSecurity)                       {update.push("<tr><td>Dependent 2 Social Security</td><td>" +  req.body.Dependent2SocialSecurity + "</td><td>" + result.d2ss + "</td>")};
            if (result.d2gender != req.body.Dependent2Gender)                           {update.push("<tr><td>Dependent 2 Gender</td><td>" +  req.body.Dependent2Gender + "</td><td>" + result.d2gender + "</td>")};
            if (result.d2coverage != req.body.Dependent2NeedsCoverage)                  {update.push("<tr><td>Dependent 2 Coverage</td><td>" +  req.body.Dependent2NeedsCoverage + "</td><td>" + result.d2coverage + "</td>")};
            if (result.d3firstname != req.body.Dependent3FirstName)                     {update.push("<tr><td>Dependent 3 First Name</td><td>" +  req.body.Dependent3FirstName + "</td><td>" + result.d3firstname + "</td>")};
            if (result.d3lastname != req.body.Dependent3LastName)                       {update.push("<tr><td>Dependent 3 Last Name</td><td>" +  req.body.Dependent3LastName + "</td><td>" + result.d3lastname + "</td>")};
            if (result.d3birthdate != req.body.Dependent3BirthDate)                     {update.push("<tr><td>Dependent 3 Birth Date</td><td>" +  req.body.Dependent3BirthDate + "</td><td>" + result.d3birthdate + "</td>")};
            if (result.d3ss != req.body.Dependent3SocialSecurity)                       {update.push("<tr><td>Dependent 3 Social Security</td><td>" +  req.body.Dependent3SocialSecurity + "</td><td>" + result.d3ss + "</td>")};
            if (result.d3gender != req.body.Dependent3Gender)                           {update.push("<tr><td>Dependent 3 Gender</td><td>" +  req.body.Dependent3Gender + "</td><td>" + result.d3gender + "</td>")};
            if (result.d3coverage != req.body.Dependent3NeedsCoverage)                  {update.push("<tr><td>Dependent 3 Coverage</td><td>" +  req.body.Dependent3NeedsCoverage + "</td><td>" + result.d3coverage + "</td>")};
            if (result.d4firstname != req.body.Dependent4FirstName)                     {update.push("<tr><td>Dependent 4 First Name</td><td>" +  req.body.Dependent4FirstName + "</td><td>" + result.d4firstname + "</td>")};
            if (result.d4lastname != req.body.Dependent4LastName)                       {update.push("<tr><td>Dependent 4 Last Name</td><td>" +  req.body.Dependent4LastName + "</td><td>" + result.d4lastname + "</td>")};
            if (result.d4birthdate != req.body.Dependent4BirthDate)                     {update.push("<tr><td>Dependent 4 Birth Date</td><td>" +  req.body.Dependent4BirthDate + "</td><td>" + result.d4birthdate + "</td>")};
            if (result.d4ss != req.body.Dependent4SocialSecurity)                       {update.push("<tr><td>Dependent 4 Social Security</td><td>" +  req.body.Dependent4SocialSecurity + "</td><td>" + result.d4ss + "</td>")};
            if (result.d4gender != req.body.Dependent4Gender)                           {update.push("<tr><td>Dependent 4 Gender</td><td>" +  req.body.Dependent4Gender + "</td><td>" + result.d4gender + "</td>")};
            if (result.d4coverage != req.body.Dependent4NeedsCoverage)                  {update.push("<tr><td>Dependent 4 Coverage</td><td>" +  req.body.Dependent4NeedsCoverage + "</td><td>" + result.d4coverage + "</td>")};
            if (result.employername != req.body.employer)                               {update.push("<tr><td>Employer Name</td><td>" +  req.body.employer + "</td><td>" + result.employername + "</td>")};
            if (result.employerphone != req.body.employerphone)                         {update.push("<tr><td>Employer Phone</td><td>" +  req.body.employerphone + "</td><td>" + result.employerphone + "</td>")};
            if (result.income != req.body.income)                                       {update.push("<tr><td>Household Income</td><td>" +  req.body.income + "</td><td>" + result.income + "</td>")};
            if (result.physician != req.body.physician)                                 {update.push("<tr><td>Physician</td><td>" +  req.body.physician + "</td><td>" + result.physician + "</td>")};
            if (result.physicianspecialty != req.body.physicianspecialty)               {update.push("<tr><td>Physician Specialty</td><td>" +  req.body.physicianspecialty + "</td><td>" + result.physicianspecialty + "</td>")};
            if (result.ailment1 != req.body.ailment1)                                   {update.push("<tr><td>Physical Ailment</td><td>" +  req.body.ailment1 + "</td><td>" + result.ailment1 + "</td>")};
            if (result.ailment2 != req.body.ailment2)                                   {update.push("<tr><td>Physical Ailment</td><td>" +  req.body.ailment2 + "</td><td>" + result.ailment2 + "</td>")};
            if (result.ailment3 != req.body.ailment3)                                   {update.push("<tr><td>Physical Ailment</td><td>" +  req.body.ailment3 + "</td><td>" + result.ailment3 + "</td>")};
            if (result.prescription1 != req.body.prescription1)                         {update.push("<tr><td>Prescription</td><td>" +  req.body.prescription1 + "</td><td>" + result.prescription1 + "</td>")};
            if (result.prescription2 != req.body.prescription2)                         {update.push("<tr><td>Prescription</td><td>" +  req.body.prescription2 + "</td><td>" + result.prescription2 + "</td>")};
            if (result.prescription3 != req.body.prescription3)                         {update.push("<tr><td>Prescription</td><td>" +  req.body.prescription3 + "</td><td>" + result.prescription3 + "</td>")};
            if (result.dosage1 != req.body.dosage1)                                     {update.push("<tr><td>Dosage</td><td>" +  req.body.dosage1 + "</td><td>" + result.dosage1 + "</td>")};
            if (result.dosage2 != req.body.dosage2)                                     {update.push("<tr><td>Dosage</td><td>" +  req.body.dosage2 + "</td><td>" + result.dosage2 + "</td>")};
            if (result.dosage3 != req.body.dosage3)                                     {update.push("<tr><td>Dosage</td><td>" +  req.body.dosage3 + "</td><td>" + result.dosage3 + "</td>")};
            update.push("</table>");

            if (update.length > 3) {
                var data = "";
                for (var i = 0; i < update.length; i++) {
                    data += update[i];
                }
            var transport = nodemailer.createTransport(mandrillTransport({
                auth: {
                    apiKey: 'y-Z7eNsStP65JC4YKJD3Lg'
                }
            }));

            transport.sendMail({
                from: 'ACA Insurance Group  <noreply@acainsuresme.com>',
                to: doc.local.email,
                subject: 'ACA Employee Updated Information',
                html: result.firstname + ' ' + result.lastname + ' employed at ' + result.employername  + ' has changed their information:<br><br>'
                + data
                ,
            }, function(err, info) {
                if (err) {
                    console.error(err);
                } else {
                    callback("email sent");
                }
            });
                }
            else {callback("no update");}
            }
    });
}
```

#### userFunctions.js

```sh
var express = require('express');
var user = require('../routes/user.js');

exports.list = function(onResult) {
    user.find({}, function(err, users) {
        if (err) {
            onResult(err, null);
        } else {
            onResult(null, users);
        }
    });
};
```

#### utility.js

```sh
exports.convertDate = function(string) {
    if (string.indexOf("-") > -1) {
        var birthdate = string.split("-");
        var finalbirthdate = birthdate[1] + "/" + birthdate[2] + "/" + birthdate[0];
        return finalbirthdate;
    }
    else {return string};
}
```

### Views

#### adminDashboard.ejs

```sh
<!-- views/profile.ejs -->
<!doctype html>
<html>
<head>
    <% include ../partials/header.ejs %></head>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
<script src="/js/setloginsession.js"> </script>
<style>
    iframe {
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        height: 400px;
        width: 100%;
    }
</style>
<body>
    <div class="page-wrapper">
        <% include ../partials/nav.ejs %>
        <div class="container">

            <div class="page-header text-center">
                <h1><span class="glyphicon glyphicon-home" aria-hidden="true"></span> Admin Dashboard</h1>
            </div>
            <div class="row">
                <!-- LOCAL INFORMATION -->
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="fa fa-user"></span> Your Info</h3>
                        <p>
                            <strong>Admin ID</strong>: <%= user._id %><br>
                            <strong>Name</strong>: <%= user.local.firstName %> <%= user.local.lastName %><br>
                            <strong>E-mail</strong>: <%= user.local.email %>
                        </p>
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span> Your Cases</h3>
                        <p>
                        <% user.employer.forEach(function(employer) { %>
                        <a href="/<%= user._id %>/<%= employer._id %>"><%= employer.empname %></a>   <br>
                        <% }); %>
                        </p>
                        <p>
                            <a href="/profile/case" class="btn btn-default"> Add New Case</a>
                        </p>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="glyphicon glyphicon-calendar" aria-hidden="true"></span> Calendar</h3>
                        <p>
                            <iframe src="https://calendar.google.com/calendar/embed?src=acainsuresme%40gmail.com&ctz=America/Chicago" style="border: 0" frameborder="0" scrolling="yes"></iframe>
                        </p>
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span> All Cases</h3>
                        <p>
                        <% users.forEach(function(users) { %>
                            <% users.employer.forEach(function(employers) { %>
                            <a href="/<%= users._id %>/<%= employers._id %>"><%= employers.empname %></a>   <br>
                            <% }); %>
                        <% }); %>
                        </p>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="glyphicon glyphicon-search" aria-hidden="true"></span>Employee Search</h3>
                        <p>
                        <form class="form-inline" action="/search" method="post">
                            <div class="form-group">
                                <input type="search" name="search" class="form-control" id="search">
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-default">Search</button>
                            </div>
                        </form>
                        </p>
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span> All Agents</h3>
                        <p>
                        <% users.forEach(function(users) { %>
                        <!--
                        <a href="/<%= user._id %>/<%= users._id %>/<%= users.local.firstName %>/<%= users.local.lastName %>"><%= users.local.firstName + " " + users.local.lastName %></a> <br>
                        -->
                        <p><%= users.local.firstName + " " + users.local.lastName %></p>
                        <% }); %>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <% include ../partials/footer.ejs %>

</body>
</html>
```

#### adminEmployee.ejs

```sh
<!DOCTYPE html>
<html>
<head>
    <% include ../partials/header.ejs %></head>
<body>
    <div class="page-wrapper-index">
        <% include ../partials/nav.ejs %>
        <section>
            <div class="container">
                <div class="row">
                    <div class="col-sm-10">
                        <h1>Admin Employee</h1>
                    </div>
                </div>
            </div>
        </section>
    </div>
    
    <% include ../partials/footer.ejs %>

    <!-- Placed at the end of the document so the pages load faster -->
    <script src="/common-files/js/jquery-1.10.2.min.js"></script>
    <script src="/flat-ui/js/bootstrap.min.js"></script>
    <script src="/common-files/js/modernizr.custom.js"></script>
    <script src="/common-files/js/jquery.scrollTo-1.4.3.1-min.js"></script>
    <script src="/common-files/js/jquery.parallax.min.js"></script>
    <script src="/common-files/js/startup-kit.js"></script>
    <script src="/common-files/js/jquery.backgroundvideo.min.js"></script>
    <script src="/js/script.js"></script>
</body>
</html>
```

#### adminEmployer.ejs

```sh
<!DOCTYPE html>
<html>
<head>
    <% include ../partials/header.ejs %></head>
<body>
    <div class="page-wrapper-index">
        <% include ../partials/nav.ejs %>
        <section>
            <div class="container">
                <div class="row">
                    <div class="col-sm-10">
                        <h1>Admin Employer</h1>
                    </div>
                </div>
            </div>
        </section>
    </div>
    
    <% include ../partials/footer.ejs %>

    <!-- Placed at the end of the document so the pages load faster -->
    <script src="/common-files/js/jquery-1.10.2.min.js"></script>
    <script src="/flat-ui/js/bootstrap.min.js"></script>
    <script src="/common-files/js/modernizr.custom.js"></script>
    <script src="/common-files/js/jquery.scrollTo-1.4.3.1-min.js"></script>
    <script src="/common-files/js/jquery.parallax.min.js"></script>
    <script src="/common-files/js/startup-kit.js"></script>
    <script src="/common-files/js/jquery.backgroundvideo.min.js"></script>
    <script src="/js/script.js"></script>
</body>
</html>
```

#### agentDashboard.ejs

```sh
<!-- views/profile.ejs -->
<!doctype html>
<html>
<head>
    <% include ../partials/header.ejs %></head>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
<script src="/js/setloginsession.js"> </script>
<style>
    iframe {
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        height: 400px;
        width: 100%;
    }
</style>
<body>
    <div class="page-wrapper">
        <% include ../partials/nav.ejs %>
        <div class="container">

            <div class="page-header text-center">
                <h1><span class="glyphicon glyphicon-home" aria-hidden="true"></span> Agent Dashboard</h1>
            </div>
            <div class="row">
                <!-- LOCAL INFORMATION -->
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="fa fa-user"></span> Agent Info</h3>
                        <p>
                            <strong>Agent ID</strong>: <%= user._id %><br>
                            <strong>Name</strong>: <%= user.local.firstName %> <%= user.local.lastName %><br>
                            <strong>E-mail</strong>: <%= user.local.email %>
                        </p>
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span> Agent Cases</h3>
                        <p>
                        <% user.employer.forEach(function(employer) { %>
                        <a href="/<%= user._id %>/<%= employer._id %>"><%= employer.empname %></a>   <br>
                        <% }); %>
                        </p>
                        <p>
                            <a href="/profile/case" class="btn btn-default"> Add New Case</a>
                        </p>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="glyphicon glyphicon-calendar" aria-hidden="true"></span> Calendar</h3>
                        <p>
                            <iframe src="https://calendar.google.com/calendar/embed?src=acainsuresme%40gmail.com&ctz=America/Chicago" style="border: 0" frameborder="0" scrolling="yes"></iframe>
                        </p>
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="well">
                        <h3><span class="glyphicon glyphicon-search" aria-hidden="true"></span>Employee Search</h3>
                        <p>
                        <form class="form-inline" action="/search" method="post">
                            <div class="form-group">
                                <input type="search" name="search" class="form-control" id="search">
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-default">Search</button>
                            </div>
                        </form>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <% include ../partials/footer.ejs %>

</body>
</html>
```

#### case.ejs

```sh
<!DOCTYPE html>
<html>
<head>
    <% include ../partials/header.ejs %>
</head>

<body>

    <div class="page-wrapper">
        <% include ../partials/nav.ejs %>
        <div class="container">
            <div class="well">
            <div style="padding-top: 99px; text-align: center;">
                <form class="form-horizontal" action="/profile/case" method="post">
                    <div class="form-group">
                        <label for="firstName" class="col-sm-2 control-label">Employer Name:</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" name="empname" id="empname" placeholder="Employer Name" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="contactName" class="col-sm-2 control-label">Contact Name:</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" name="contact" id="contact" placeholder="Contact Name">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="altcontactName" class="col-sm-2 control-label">Alternate Contact Name:</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" name="altcontact" id="altcontact" placeholder="Alternate Contact Name">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="altcontactEmail" class="col-sm-2 control-label">Alternate Contact Email:</label>
                        <div class="col-sm-10">
                            <input type="email" class="form-control" name="altemail" id="altemail" placeholder="Alternate Contact Email" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="streetAddress" class="col-sm-2 control-label">Street Address:</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" name="streetaddress" id="streetaddress" placeholder="Street Address">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="city" class="col-sm-2 control-label">City:</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" name="city" id="city" placeholder="City">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="state" class="col-sm-2 control-label">State:</label>
                        <div class="col-sm-10">
                            <select name="state" id="state" class="form-control">
                                <option value="AL">AL</option>
                                <option value="AK">AK</option>
                                <option value="AZ">AZ</option>
                                <option value="AR">AR</option>
                                <option value="CA">CA</option>
                                <option value="CO">CO</option>
                                <option value="CT">CT</option>
                                <option value="DE">DE</option>
                                <option value="DC">DC</option>
                                <option value="FL">FL</option>
                                <option value="GA">GA</option>
                                <option value="HI">HI</option>
                                <option value="ID">ID</option>
                                <option value="IL">IL</option>
                                <option value="IN">IN</option>
                                <option value="IA">IA</option>
                                <option value="KS">KS</option>
                                <option value="KY">KY</option>
                                <option value="LA">LA</option>
                                <option value="ME">ME</option>
                                <option value="MD">MD</option>
                                <option value="MA">MA</option>
                                <option value="MI">MI</option>
                                <option value="MN">MN</option>
                                <option value="MS">MS</option>
                                <option value="MO">MO</option>
                                <option value="MT">MT</option>
                                <option value="NE">NE</option>
                                <option value="NV">NV</option>
                                <option value="NH">NH</option>
                                <option value="NJ">NJ</option>
                                <option value="NM">NM</option>
                                <option value="NY">NY</option>
                                <option value="NC">NC</option>
                                <option value="ND">ND</option>
                                <option value="OH">OH</option>
                                <option value="OK">OK</option>
                                <option value="OR">OR</option>
                                <option value="PA">PA</option>
                                <option value="RI">RI</option>
                                <option value="SC">SC</option>
                                <option value="SD">SD</option>
                                <option value="TN">TN</option>
                                <option value="TX">TX</option>
                                <option value="UT">UT</option>
                                <option value="VT">VT</option>
                                <option value="VA">VA</option>
                                <option value="WA">WA</option>
                                <option value="WV">WV</option>
                                <option value="WI">WI</option>
                                <option value="WY">WY</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="zipCode" class="col-sm-2 control-label">Zip Code:</label>
                        <div class="col-sm-10">
                            <input type="text" pattern="\d{5}-?(\d{4})?" class="form-control" name="zipcode" id="zipcode" placeholder="##### or #####-####">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="phoneNumber" class="col-sm-2 control-label">Phone Number:</label>
                        <div class="col-sm-10">
                            <input type="tel" pattern="\d{3}-\d{3}-\d{4}" class="form-control" name="phonenumber" id="phonenumber" placeholder="###-###-####">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="emailAddress" class="col-sm-2 control-label">Employer E-mail Address:</label>
                        <div class="col-sm-10">
                            <input type="email" class="form-control" name="email" id="email" placeholder="Employer E-mail Address" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="col-sm-10">
                            <input type="checkbox"  name="payroll" id="payroll" value="True"> Payroll Deposit &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            <input type="checkbox"  name="dental" id="dental" value="True"> Dental Plan &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            <input type="checkbox"  name="cashadvantage" id="cashadvantage" value="True"> Cash Advantage Plan &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            <input type="checkbox"  name="vision" id="vision" value="True"> Vision Plan &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="comments" class="col-sm-2 control-label">Comments:</label>
                        <div class="col-sm-10">
                            <textarea type="text" class="form-control" name="comments" id="comments" placeholder="Enter comments here!" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="col-sm-offset-2 col-sm-10">
                            <button type="submit" value="submit" class="btn btn-success">Submit</button>
                            <button type="reset" class="btn btn-danger">Reset</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
    </div>
    <% include ../partials/footer.ejs %>


<!-- Placed at the end of the document so the pages load faster -->
<script src="/common-files/js/jquery-1.10.2.min.js"></script>
<script src="/flat-ui/js/bootstrap.min.js"></script>
<script src="/common-files/js/modernizr.custom.js"></script>
<script src="/common-files/js/jquery.scrollTo-1.4.3.1-min.js"></script>
<script src="/common-files/js/jquery.parallax.min.js"></script>
<script src="/common-files/js/startup-kit.js"></script>
<script src="/common-files/js/jquery.backgroundvideo.min.js"></script>
<script src="/js/script.js"></script>


</body>
</html>
```

#### confirm.ejs

```sh
<form action="/confirm" method="post">
<div class="form-group">
    <label>Please enter your employer password <br></label>
    <input type="password" class="form-control" name="password" required>
</div>
</form>
```

#### contact.ejs

```sh
<!DOCTYPE html>
<html>
<head>
    <% include ../partials/header.ejs %>
    <script src="/js/forcehttps.js"> </script>
</head>
<body>
    <div class="page-wrapper">
        <% include ../partials/nav.ejs %>
        <div class="container">
            <div style="padding-top: 99px; text-align: center;">
                <form class="form-horizontal" action="/submitContactForm/" method="post">
                    <div class="form-group">
                        <label for="firstName" class="col-sm-2 control-label">First Name:</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" name="firstName" id="firstName" placeholder="First Name" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="lastName" class="col-sm-2 control-label">Last Name:</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" name="lastName" id="lastName" placeholder="Last Name" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="company" class="col-sm-2 control-label">Company Name:</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" name="company" id="company" placeholder="Company Name" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="emailAddress" class="col-sm-2 control-label">E-mail Address:</label>
                        <div class="col-sm-10">
                            <input type="email" class="form-control" name="emailAddress" id="emailAddress" placeholder="E-mail Address" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="phoneNumber" class="col-sm-2 control-label">Phone Number:</label>
                        <div class="col-sm-10">
                            <input type="tel" class="form-control" pattern="\d{3}-\d{3}-\d{4}" name="phoneNumber" id="phoneNumber" placeholder="###-###-####" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="comments" class="col-sm-2 control-label">Comments:</label>
                        <div class="col-sm-10">
                            <textarea type="text" class="form-control" name="comments" id="comments" placeholder="Enter comments here!" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="col-sm-offset-2 col-sm-10">
                            <button type="submit" value="submit" class="btn btn-success">Submit</button>
                            <button type="reset" class="btn btn-danger">Reset</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <% include ../partials/footer.ejs %>


</body>
</html>
```

#### db.ejs

```sh
<!DOCTYPE html>
<html>
<head>
  <% include ../partials/header.ejs %>
</head>

<body>

<% include ../partials/nav.ejs %>

<div class="container">
<h2>Database Results</h2>

<ul>
    <% results.forEach(function(r) { %>
        <li><%= r.id %> - <%= r.name %></li>
    <% }); %>
</ul>

</div>

</body>
</html>
```

#### employee.ejs

```sh
<p>
    <% user.employer.forEach(function(employer) { %>
    <%if (employer._id == emp) { %>
    New employee account created! with an agent id of <%= user.id %> and an employer id of
    <%= employer._id %><br>

</p>

<br><br>

<a href="/<%= user._id %>/<%= employer._id %>" class="btn btn-default"></span> Back to Employer Page</a>
<% } %>
<% }); %>
```

#### employer.ejs

```sh
<!DOCTYPE html>
<html>
<head>
    <% include ../partials/header.ejs %></head>

<body>
<link rel="stylesheet" href="/stylesheets/popup.css">
<% user.employer.forEach(function(employer) { %>
<%if (employer._id == page) { %>
<div id="abc" style="display: none;">
    <!-- Popup Div Starts Here -->
    <div id="popupContact">
        <!-- Contact Us Form -->
        <form class="form-horizontal" action="/update/<%= user._id%>/<%= employer._id%>" method="post">
            <img id="close" src="/img/close.png" onclick ="div_hide()">
            <h2 style="text-align:center;">Update Info</h2> <br>
                <div class="form-group">
                    <label for="firstName" class="col-sm-2 control-label">Employer Name:</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" name="empname" id="empname" placeholder="Employer Name" value="<%= employer.empname%>" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="contactName" class="col-sm-2 control-label">Contact Name:</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" name="contact" id="contact" value="<%= employer.contact%>" placeholder="Contact Name">
                    </div>
                </div>
                <div class="form-group">
                    <label for="altcontactName" class="col-sm-2 control-label">Alternate Contact Name:</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" name="altcontact" id="altcontact" value="<%= employer.altcontact%>" placeholder="Alternate Contact Name">
                    </div>
                </div>
                <div class="form-group">
                    <label for="altcontactEmail" class="col-sm-2 control-label">Alternate Contact Email:</label>
                    <div class="col-sm-10">
                        <input type="email" class="form-control" name="altemail" id="altemail" value="<%= employer.altemail%>" placeholder="Alternate Contact Email" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="streetAddress" class="col-sm-2 control-label">Street Address:</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" name="streetaddress" id="streetaddress" placeholder="Street Address" value="<%= employer.streetaddress%>">
                    </div>
                </div>
                <div class="form-group">
                    <label for="city" class="col-sm-2 control-label">City:</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" name="city" id="city" placeholder="City" value="<%= employer.city%>">
                    </div>
                </div>
                <div class="form-group">
                    <label for="state" class="col-sm-2 control-label">State:</label>
                    <div class="col-sm-10">
                        <select name="state" id="state" class="form-control">
                            <option value="AL" <%= (employer.state == 'AL')?'selected':'' %> >AL </option>
                            <option value="AK" <%= (employer.state == 'AK')?'selected':'' %> >AK </option>
                            <option value="AZ" <%= (employer.state == 'AZ')?'selected':'' %> >AZ </option>
                            <option value="AR" <%= (employer.state == 'AR')?'selected':'' %> >AR</option>
                            <option value="CA" <%= (employer.state == 'CA')?'selected':'' %> >CA</option>
                            <option value="CO" <%= (employer.state == 'CO')?'selected':'' %> >CO</option>
                            <option value="CT" <%= (employer.state == 'CT')?'selected':'' %> >CT</option>
                            <option value="DE" <%= (employer.state == 'DE')?'selected':'' %> >DE</option>
                            <option value="FL" <%= (employer.state == 'FL')?'selected':'' %> >FL</option>
                            <option value="GA" <%= (employer.state == 'GA')?'selected':'' %> >GA</option>
                            <option value="HI" <%= (employer.state == 'HI')?'selected':'' %> >HI</option>
                            <option value="ID" <%= (employer.state == 'ID')?'selected':'' %> >ID</option>
                            <option value="IL" <%= (employer.state == 'IL')?'selected':'' %> >IL</option>
                            <option value="IN" <%= (employer.state == 'IN')?'selected':'' %> >IN</option>
                            <option value="IA" <%= (employer.state == 'IA')?'selected':'' %> >IA</option>
                            <option value="KS" <%= (employer.state == 'KS')?'selected':'' %> >KS</option>
                            <option value="KY" <%= (employer.state == 'KY')?'selected':'' %> >KY</option>
                            <option value="LA" <%= (employer.state == 'LA')?'selected':'' %> >LA</option>
                            <option value="ME" <%= (employer.state == 'ME')?'selected':'' %> >ME</option>
                            <option value="MD" <%= (employer.state == 'MD')?'selected':'' %> >MD</option>
                            <option value="MA" <%= (employer.state == 'MA')?'selected':'' %> >MA</option>
                            <option value="MI" <%= (employer.state == 'MI')?'selected':'' %> >MI</option>
                            <option value="MN" <%= (employer.state == 'MN')?'selected':'' %> >MN</option>
                            <option value="MS" <%= (employer.state == 'MS')?'selected':'' %> >MS</option>
                            <option value="MO" <%= (employer.state == 'MO')?'selected':'' %> >MO</option>
                            <option value="MT" <%= (employer.state == 'MT')?'selected':'' %> >MT</option>
                            <option value="NE" <%= (employer.state == 'NE')?'selected':'' %> >NE</option>
                            <option value="NV" <%= (employer.state == 'NV')?'selected':'' %> >NV</option>
                            <option value="NH" <%= (employer.state == 'NH')?'selected':'' %> >NH</option>
                            <option value="NJ" <%= (employer.state == 'NJ')?'selected':'' %> >NJ</option>
                            <option value="NM" <%= (employer.state == 'NM')?'selected':'' %> >NM</option>
                            <option value="NY" <%= (employer.state == 'NY')?'selected':'' %> >NY</option>
                            <option value="NC" <%= (employer.state == 'NC')?'selected':'' %> >NC</option>
                            <option value="ND" <%= (employer.state == 'ND')?'selected':'' %> >ND</option>
                            <option value="OH" <%= (employer.state == 'OH')?'selected':'' %> >OH</option>
                            <option value="OK" <%= (employer.state == 'OK')?'selected':'' %> >OK</option>
                            <option value="OR" <%= (employer.state == 'OR')?'selected':'' %> >OR</option>
                            <option value="PA" <%= (employer.state == 'PA')?'selected':'' %> >PA</option>
                            <option value="RI" <%= (employer.state == 'RI')?'selected':'' %> >RI</option>
                            <option value="SC" <%= (employer.state == 'SC')?'selected':'' %> >SC</option>
                            <option value="SD" <%= (employer.state == 'SD')?'selected':'' %> >SD</option>
                            <option value="TN" <%= (employer.state == 'TN')?'selected':'' %> >TN</option>
                            <option value="TX" <%= (employer.state == 'TX')?'selected':'' %> >TX</option>
                            <option value="UT" <%= (employer.state == 'UT')?'selected':'' %> >UT</option>
                            <option value="VT" <%= (employer.state == 'VT')?'selected':'' %> >VT</option>
                            <option value="VA" <%= (employer.state == 'VA')?'selected':'' %> >VA</option>
                            <option value="WA" <%= (employer.state == 'WA')?'selected':'' %> >WA</option>
                            <option value="WV" <%= (employer.state == 'WV')?'selected':'' %> >WV</option>
                            <option value="WI" <%= (employer.state == 'WI')?'selected':'' %> >WI</option>
                            <option value="WY" <%= (employer.state == 'WY')?'selected':'' %> >WY</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="zipCode" class="col-sm-2 control-label">Zip Code:</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" pattern="\d{5}-?(\d{4})?" name="zipcode" id="zipcode" placeholder="##### or #####-####" value="<%= employer.zipcode%>">
                    </div>
                </div>
                <div class="form-group">
                    <label for="phoneNumber" class="col-sm-2 control-label">Phone Number:</label>
                    <div class="col-sm-10">
                        <input type="tel" class="form-control" pattern="\d{3}-\d{3}-\d{4}" name="phonenumber" id="phonenumber" placeholder="###-###-####" value="<%= employer.phonenumber%>">
                    </div>
                </div>
                <div class="form-group">
                    <label for="emailAddress" class="col-sm-2 control-label">Employer E-mail Address:</label>
                    <div class="col-sm-10">
                        <input type="email" class="form-control" name="email" id="email" placeholder="Employer E-mail Address" value="<%= employer.email%>" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="comments" class="col-sm-2 control-label">Comments:</label>
                    <div class="col-sm-10">
                        <textarea type="text" class="form-control" name="comments" id="comments" placeholder="Enter comments here!"  rows="3"><%=employer.comments%></textarea>
                    </div>
                </div>
                <div class="form-group">
                    <div class="col-sm-offset-2 col-sm-10">
                        <button type="submit" value="submit" class="btn btn-success">Submit</button>
                        <button type="reset" class="btn btn-danger">Reset</button>
                    </div>
                </div>
            </form>
    </div>
    <!-- Popup Div Ends Here -->
</div>
    <div class="page-wrapper">
        <% include ../partials/nav.ejs %>
        <div class="container">
            <br>
            <ul class="nav nav-tabs nav-justified">
                <li role="presentation"><button onclick="goBack()"><span class="glyphicon glyphicon-arrow-left" aria-hidden="true"></span> Back</button></li>
            </ul>
            <br>
            <div class="row">
                <div class="col-sm-6">
                    <div class="well">
                        <h2>Employer Data</h2>
                        <p>
                            <strong>Employer Id</strong>: <%= employer._id %><br>
                            <strong>Employer Name</strong>: <%= employer.empname %><br>
                            <strong>Contact Name</strong>: <%= employer.contact %><br>
                            <strong>Alternate Contact</strong>: <%= employer.altcontact %><br>
                            <strong>Alternate Contact Email</strong>: <%= employer.altemail %><br>
                            <strong>Street Address</strong>: <%= employer.streetaddress %><br>
                            <strong>City</strong>: <%= employer.city %><br>
                            <strong>State</strong>: <%= employer.state %><br>
                            <strong>Zip Code</strong>: <%= employer.zipcode %><br>
                            <strong>Phone Number</strong>: <%= employer.phonenumber %><br>
                            <strong>Email</strong>: <%= employer.email %><br>
                            <strong>Payroll Deposit</strong>: <%= employer.payroll %><br>
                            <strong>Dental Plan</strong>: <%= employer.dental %><br>
                            <strong>Cash Advantage Plan</strong>: <%= employer.cashadvantage %><br>
                            <strong>Vision Plan</strong>: <%= employer.vision %><br>
                            <strong>Comments</strong>: <%= employer.comments %><br>
                            <!--
                            <a href="/agentDashboard" class="btn btn-default"> Back to Agent Dashboard</a>
                            -->
                            <br>
                            <center>
                                <a id="send-email" href="/<%= employer.empname %>/sendemail/<%= user._id %>/<%= employer._id %>/<%= employer.email%>/<%= employer.altemail%>" class="btn btn-info"><span class="glyphicon glyphicon-envelope" aria-hidden="true"></span> Send Registration Info</a>
                                <a href="/delete" name="delete" class="btn btn-danger" disabled><span class="glyphicon glyphicon-remove" aria-hidden="true"></span> Delete Record</a>
                                <a onclick="div_show()" class="btn btn-info"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span> Update Info </a>
                            </center>
                        </p>
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="well">
                        <h2>Employee Data</h2>
                        <p>
                            <p>
                                <% emp.forEach(function(employee) { %>
                                <%if (employer._id == employee.employerid && user._id == employee.agentid) { %>
                                <strong>Name</strong>:  <a href="/employee/pdf/generator/<%= employee._id %>"><%= employee.firstname %>&nbsp;<%= employee.lastname%> </a> <br>
                                <% } %>
                                <% }); %>
                        </p>
                    </div>
                </div>
            </div>

            <ul class="nav nav-tabs nav-justified">
                <li role="presentation"><button onclick="goBack()"><span class="glyphicon glyphicon-arrow-left" aria-hidden="true"></span> Back</button></li>
            </ul>
        </div>
    </div>
    <!--
    <h2><strong>Employee Signup Link</strong>: <%= url %> </h2>
    -->
<% } %>
<% }); %>
    <% include ../partials/footer.ejs %>

    <script type="text/javascript">
        var elems = document.getElementsByName('delete');
        var confirmIt = function (e) {
            if (!confirm('Are you sure you want to delete this employer account?')) e.preventDefault();
        };
        for (var i = 0, l = elems.length; i < l; i++) {
            elems[i].addEventListener('click', confirmIt, false);
        }
    </script>
    <script>
        function div_show() {
            document.getElementById('abc').style.display = "block";
        }
        function div_hide(){
            document.getElementById('abc').style.display = "none";
        }
    </script>
    <script>
        function goBack() {
            window.history.back();
        }
    </script>
</body>
</html>
```

#### healthplan.ejs

```sh
<!DOCTYPE html>
<html>
    <head>
        <% include ../partials/header.ejs %>
    </head>
    <body>

    <div class="page-wrapper">
        <% include ../partials/nav.ejs %>
        <section>
            <div class="container">
                <div class="row">
                    <div class="col-sm-4">
                        <img src="../../img/7815141.jpg" alt="" style="padding-top:60px;">
                    </div>
                    <div class="col-sm-6">
                        <h1>A better way to control your healthcare costs.</h1>
                        <p>The HAP plan uses a combination of core health insurance, education, and supplemental coverage to create a turn-key solution that will <u>drive down the cost</u> of premiums for employers and give employees more <u>needed</u> benefits.</p>
                    </div>
                </div>
            </div>
        </section>
        <section>
            <div class="container">
                <div class="row">
                    <div class="col-sm-6">
                        <h1>Plan Features</h1>
                        <p>
                            <ul>
                                <li>Average $200 in savings per month per employee</li>
                                <li>Low fixed individual cost to employer</li>
                                <li>No annual increases for the employer</li>
                                <li>Pre-tax option to offset employer contribution</li>
                                <li>Individually Personalized Health Insurance</li>
                                <li>National and Regional provider networks</li>
                                <li>$5000 payable upon cancer diagnosis</li>
                                <li>$1000/Day Hospital Confinement benefit for up to 30 days</li>
                                <li>Up to $10,000 critical illness benefit</li>
                                <li>One-on-One Benefits communication & education</li>
                                <li>Full Service Payroll Administration</li>
                                <li>One Monthly Bill!</li>
                            </ul>
                        </p>
                    </div>
                    <div class="col-sm-4">
                        <img src="../../img/463389.png" alt="" style="padding-top:60px;">
                        <p>
                            <center>
                                <small>Monthly and annual employer savings.</small>
                            </center>
                        </p>
                        <p>
                            <center>
                                <em>A small business having a profit margin of 32% with 20 employees on the HAP plan would be the equivalent of $101,250 in sales annually.</em>
                            </center>
                        </p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-10">
                        <h1>Retain capital while retaining your employees.</h1>
                        <p>With constant change in health care it is hard for small business owners to keep up. The <strong>HAP</strong> produces a <strong>hands-off</strong> approach for small business owners and puts all the questions and concerns of the employees in our hands. We are here to get you “out of the insurance business” and give you more needed time to grow your business and overall, increase <strong>profitability.</strong></p>
                    </div>
                </div>
            </div>
            <br/>
            <br/>
            <br/>
        </section>
    </div>
    <div><div id="968244701478285836" align="center" style="width: 100%; overflow-y: hidden; margin-bottom: 30px;" class="wcustomhtml"><script id="setmore_script" type="text/javascript" src="https://my.setmore.com/js/iframe/setmore_iframe.js"></script><a id="Setmore_button_iframe" style="float:none" href="https://my.setmore.com/shortBookingPage/52b3edf9-5324-4ef0-bcae-4e25f31281ff"><img border="none" src="https://my.setmore.com/images/bookappt/SetMore-book-button.png" alt="Book an appointment with ACA Insurance Group using SetMore" /></a>
        </div>


        <% include ../partials/footer.ejs %>

    <!-- Placed at the end of the document so the pages load faster -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>

    </body>
</html>
```

#### index.ejs

```sh
<!DOCTYPE html>
<html>
<head>
  <% include ../partials/header.ejs %>
</head>

<body>
    <div class="page-wrapper-index">
        <% include ../partials/nav.ejs %>
        <section class="header-10-sub v-center">
            <div class="background">
                &nbsp;
            </div>
            <div>
                <div class="container">
                    <div class="hero-unit">
                        <h1>Your path to peace of mind.</h1>
                        <p>
                            Our proven benefit packages can help you
                            <br/>
                            through today's benefit twists and turns...
                        </p>
                    </div>
                </div>
            </div>
            <a class="control-btn fui-arrow-down" href="#"> </a>
        </section>

        <!-- content-7  -->
        <section class="content-7 v-center">
            <div>

                <div class="container">
                    <h3>We are not your normal brokerage.</h3>

                    <div class="row v-center">
                        <div class="col-sm-3">
                            <div>
                                ACA takes the time to find the best and most affordable packages for your business.
                            </div>
                        </div>
                        <div class="col-sm-4">
                            <div class="col-sm-offset-1">
                                <div class="screen-wrapper">
                                    <img src="../../common-files/img/content/offer.jpg" alt="">
                                    <!--
                                    <div class="screen">
                                        <img src="../../common-files/img/content/offer.jpg" alt="">
                                    </div>
                                    -->
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-3">
                            <div class="col-sm-offset-2">
                                <h6>Save Time</h6>
                                Our goal is to save you one of the most valuable resources, time. We take the benefit management process out of your hands and let you get back to building your business.
                                <h6>Provide Solutions</h6>
                                With our turn-key solutions we put much needed capital back in the hands of the small business owner and their employees.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- content-23  -->
        <!--
        <section class="content-23 bg-midnight-blue custom-bg">
            <div class="holder v-center">
                <div>
                    <div class="container">
                        <div class="hero-unit hero-unit-bordered">
                            <h1>Let us be your Affordable Care Associates</h1>
                        </div>
                    </div>
                </div>
            </div>
            <a class="control-btn fui-arrow-down" href="#"> </a>
        </section>
        -->

        <!-- content-8  -->
        <!--
        <section class="content-8 v-center">
            <div>
                <div class="container">
                    <div class="img">
                        <img src="../../common-files/img/content/offer.jpg" alt="">
                    </div>
                    <h3>Take a look at what we have to offer</h3>
                    <div class="row">
                        <div class="col-sm-6 col-sm-offset-3">
                            <p>We provide a wide array of solutions
                            </p>
                            <a class="btn btn-large btn-clear" href="#">Learn More</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        -->

        <!-- content-23  -->
        <section class="content-23 bg-midnight-blue">
            <div id="bgVideo" class="background"></div>
            <div class="holder v-center">
                <div>
                    <div class="container">
                        <div class="hero-unit">
                            <h1>Find the perfect plans for
                            <br class="hidden-phone">
                            your insurance needs</h1>
                        </div>
                    </div>
                </div>   
            </div>
            <a class="control-btn fui-arrow-down" href="#"> </a>
        </section>

        <!-- content-8  -->
        <section class="content-8 v-center">
            <div>
                <div class="container">
                    <div class="img second">
                        <img alt="" src="img/aca380x187.png"/>
                    </div>
                    <h3>Learn more about our programs</h3>
                    <div class="row">
                        <div class="col-sm-6 col-sm-offset-3">
                            <p>
                                We put big company benefits in place that were not offered before.
                            </p>
                            <a class="btn btn-large btn-clear" href="/contact">Learn More Now</a>
                            <div><div id="968244701478285836" align="center" style="width: 100%; overflow-y: hidden; margin-top: 25px;" class="wcustomhtml"><script id="setmore_script" type="text/javascript" src="https://my.setmore.com/js/iframe/setmore_iframe.js"></script><a id="Setmore_button_iframe" style="float:none" href="https://my.setmore.com/shortBookingPage/52b3edf9-5324-4ef0-bcae-4e25f31281ff"><img border="none" src="https://my.setmore.com/images/bookappt/SetMore-book-button.png" alt="Book an appointment with ACA Insurance Group using SetMore" /></a>
                                </div>


                            </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
    <% include ../partials/footer.ejs %>

    <!-- Placed at the end of the document so the pages load faster -->
    <script src="/common-files/js/jquery-1.10.2.min.js"></script>
    <script src="/flat-ui/js/bootstrap.min.js"></script>
    <script src="/common-files/js/modernizr.custom.js"></script>
    <script src="/common-files/js/jquery.scrollTo-1.4.3.1-min.js"></script>
    <script src="/common-files/js/jquery.parallax.min.js"></script>
    <script src="/common-files/js/startup-kit.js"></script>
    <script src="/common-files/js/jquery.backgroundvideo.min.js"></script>
    <script src="/js/script.js"></script>

</body>
</html>
```

#### information.ejs

```sh
<!DOCTYPE html>
<html>
    <head>
        <% include ../partials/header.ejs %>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
        <script src="/js/setloginsession.js"> </script>
        <style>
            div#signature_container canvas,
            div#signature_container img
            {
                border:dashed 1px #CCCCCC;
            }
            #wrapperr {
                margin: auto;
                width: 50%;
            }
            #myImage{
                display:block;
                margin:auto;
            }
            #loading{
                text-align: center;
            }
            #info {
                text-align: center;
            }
            .form-group.required .control-label:after {
                content:"*";
                color:red;
            }
        </style>
    </head>
    <body>
        <div  class="page-wrapper">
            <div id="my-modal" style="display: none; margin-top: 160px;" class="modal fade in">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button id="closemodal" type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                            <h4 class="modal-title">Save Successful!</h4>
                        </div>
                        <div class="modal-body">
                            <p>All your information has been saved, and you can check the information below for accuracy.<br><br>
                            Your agent will be contacting you for further updates. <br><br>
                            Thank you!</p>
                        </div>
                    </div>
                </div>
            </div>
            <% include ../partials/nav.ejs %>
            <!--<div id = "wrapperr" class="well"> <img id = "myImage" src ="/img/ajax_loader.gif" > <br><br><br> <h3 id="loading"> Ensuring a secure connection...</h3></div>-->
            <div id = "wholepage" class="container">
                <div class="page-header text-center">
                    <% user.employer.forEach(function(employer) { %>
                    <%if (employer._id == employerid) { %>
                    <h1>Employee Profile Page</h1>
                    <h3>Employer: <%= employer.empname %></h3>
                </div>
                <div class="row">
                    <!--<div class="col-sm-6">-->
                        <div id= "info" class="well">
                            <h4><%= employee.email%> <br></h4>
                            <p>
                                Your coverage: <br>


                                <% if (employer.payroll == "True") { %>
                                Payroll Deposit <br>
                                <% } %>
                                <% if (employer.dental == "True") { %>
                                Dental Plan <br>
                                <% } %>
                                <% if (employer.cashadvantage == "True") { %>
                                Cash Advantage Plan <br>
                                <% } %>
                                <% if (employer.vision == "True") { %>
                                Vision Plan <br>
                                <% } %>
                            <p>
                        </div>
                    </div>
                    <!--<div class="col-sm-6">-->

                        <div class="well">
                            <form class="form-horizontal" method="post">
                                <div class="row" style="margin: auto;">
                                    <button type="submit" value="submit" class="btn btn-success">Save</button>
                                </div>
                                <div class="form-group required">
                                <h5 style="text-align:center;">Primary</h5>
                                    <label for="FirstName"  class="col-sm-2 control-label">First Name</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" id="FirstName" name="FirstName" type="text" class="required" title="First Name" placeholder="First Name" value="<%= employee.firstname %>"required>
                                </div>
                                </div>
                                <div class="form-group required">
                                    <label for="LastName"  class="col-sm-2 control-label">Last Name</label>
                                    <div class="col-sm-10">
                                    <input class="form-control"  id="LastName" name="LastName" type="text" class="required" title="Last Name" placeholder="Last Name" value="<%= employee.lastname %>"required>
                                </div>
                                </div>
                                <div class="form-group required">
                                    <fieldset>
                                        <label for="GenderPrimary"  class="col-sm-2 control-label">Gender</label>
                                        <div class="col-sm-10">
                                            <span><input value="Male" id="Gender" name="Gender" type="radio" <%= (employee.gender == 'Male')?'checked="checked"':'' %>> <label for="GenderPrimary">Male</label></span>
                                            <span><input value="Female" id="Gender" name="Gender" type="radio" <%= (employee.gender == 'Female')?'checked="checked"':'' %>> <label for="GenderPrimary">Female</label></span>
                                        </div>
                                    </fieldset>
                                </div>
                                <div class="form-group required">
                                    <% if (employee.maritalstatus == "Single") { %>
                                    <fieldset>
                                        <div class="col-sm-12">
                                        <label for="MaritalStatus"  class="col-sm-2 control-label"> Marital Status</label>
                                        <span><input value="Single" id="MaritalStatus_21" name="MaritalStatus" type="radio" class="required" title="Single" checked="checked" required> <label for="MaritalStatus_21">Single</label></span>
                                        <span><input value="Married" id="MaritalStatus_22" name="MaritalStatus" type="radio" class="required" title="Married" required> <label for="MaritalStatus_22">Married</label></span>
                                        </div>
                                    </fieldset>
                                    <% } %>
                                    <% if (employee.maritalstatus == "Married") { %>
                                    <fieldset>
                                        <div class="col-sm-12">
                                        <label for="MaritalStatus"  class="col-sm-2 control-label">Marital Status</label>
                                        <span><input  value="Single" id="MaritalStatus_21" name="MaritalStatus" type="radio" class="required" title="Single"  required> <label for="MaritalStatus_21">Single</label></span>
                                        <span><input  value="Married" id="MaritalStatus_22" name="MaritalStatus" type="radio" class="required" title="Married" checked="checked" required> <label for="MaritalStatus_22">Married</label></span>
                                        </div>
                                    </fieldset>
                                    <% } %>
                                    <% if (employee.maritalstatus == null) { %>
                                    <fieldset>
                                        <div class="col-sm-12">
                                        <label for="MaritalStatus"  class="col-sm-2 control-label">Marital Status</label>
                                        <span><input value="Single" id="MaritalStatus_21" name="MaritalStatus" type="radio" class="required" title="Single"  required> <label for="MaritalStatus_21">Single</label></span>
                                        <span><input value="Married" id="MaritalStatus_22" name="MaritalStatus" type="radio" class="required" title="Married" required> <label for="MaritalStatus_22">Married</label></span>
                                        </div>
                                    </fieldset>
                                    <% } %>
                                    </div>
                                <div class="form-group">
                                    <label for="SpouseFirstName" class="col-sm-2 control-label">Spouse First Name</label>
                                    <div class="col-sm-10">
                                    <input  class="form-control" id="SpouseFirstName" name="SpouseFirstName" type="text" placeholder="First Name" value="<%= employee.spousefirstname %>">
                                </div>
                                    </div>
                                <div class="form-group">
                                    <label for="SpouseLastName" class="col-sm-2 control-label">Spouse Last Name</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" id="SpouseLastName" name="SpouseLastName" type="text" placeholder="Last Name" value="<%= employee.spouselastname %>">
                                    </div>
                                </div>
                                <div class="form-group required">
                                    <label for="PhoneNumber" class="col-sm-2 control-label">Phone Number</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" pattern="\d{3}-\d{3}-\d{4}" id="PhoneNumber" name="PhoneNumber" type="tel" class="required" placeholder="###-###-####" value="<%= employee.phonenumber %>" required>
                                    </div>
                                </div>
                                <div class="form-group required">
                                    <label for="AlternatePhoneNumber" class="col-sm-2 control-label">Alternate Phone Number</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" pattern="\d{3}-\d{3}-\d{4}" id="AlternatePhoneNumber" name="AlternatePhoneNumber" type="tel" class="required" placeholder="###-###-####" value="<%= employee.altphonenumber %>" required>
                                </div>
                                    </div>
                                <div class="form-group required">
                                    <label for="Address" class="col-sm-2 control-label">Address</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" id="Address" name="Address" type="text" class="required" title="Address" placeholder="Address" value="<%= employee.address %>" required>
                                </div>
                                    </div>
                                <div class="form-group required">
                                    <label for="City" class="col-sm-2 control-label">City</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" id="City" name="City" type="text" class="required" title="City" placeholder="City" value="<%= employee.city %>" required>
                                </div>
                                </div>
                                <div class="form-group required">
                                    <label for="State" class="col-sm-2 control-label">State</label>
                                    <div class="col-sm-10">
                                    <select class="form-control" id="State" name="State" class="required" title="State" onload="myFunction();" required>
                                        <option value="AL" <%= (employee.state == 'AL')?'selected':'' %> >AL </option>
                                        <option value="AK" <%= (employee.state == 'AK')?'selected':'' %> >AK </option>
                                        <option value="AZ" <%= (employee.state == 'AZ')?'selected':'' %> >AZ </option>
                                        <option value="AR" <%= (employee.state == 'AR')?'selected':'' %> >AR</option>
                                        <option value="CA" <%= (employee.state == 'CA')?'selected':'' %> >CA</option>
                                        <option value="CO" <%= (employee.state == 'CO')?'selected':'' %> >CO</option>
                                        <option value="CT" <%= (employee.state == 'CT')?'selected':'' %> >CT</option>
                                        <option value="DE" <%= (employee.state == 'DE')?'selected':'' %> >DE</option>
                                        <option value="FL" <%= (employee.state == 'FL')?'selected':'' %> >FL</option>
                                        <option value="GA" <%= (employee.state == 'GA')?'selected':'' %> >GA</option>
                                        <option value="HI" <%= (employee.state == 'HI')?'selected':'' %> >HI</option>
                                        <option value="ID" <%= (employee.state == 'ID')?'selected':'' %> >ID</option>
                                        <option value="IL" <%= (employee.state == 'IL')?'selected':'' %> >IL</option>
                                        <option value="IN" <%= (employee.state == 'IN')?'selected':'' %> >IN</option>
                                        <option value="IA" <%= (employee.state == 'IA')?'selected':'' %> >IA</option>
                                        <option value="KS" <%= (employee.state == 'KS')?'selected':'' %> >KS</option>
                                        <option value="KY" <%= (employee.state == 'KY')?'selected':'' %> >KY</option>
                                        <option value="LA" <%= (employee.state == 'LA')?'selected':'' %> >LA</option>
                                        <option value="ME" <%= (employee.state == 'ME')?'selected':'' %> >ME</option>
                                        <option value="MD" <%= (employee.state == 'MD')?'selected':'' %> >MD</option>
                                        <option value="MA" <%= (employee.state == 'MA')?'selected':'' %> >MA</option>
                                        <option value="MI" <%= (employee.state == 'MI')?'selected':'' %> >MI</option>
                                        <option value="MN" <%= (employee.state == 'MN')?'selected':'' %> >MN</option>
                                        <option value="MS" <%= (employee.state == 'MS')?'selected':'' %> >MS</option>
                                        <option value="MO" <%= (employee.state == 'MO')?'selected':'' %> >MO</option>
                                        <option value="MT" <%= (employee.state == 'MT')?'selected':'' %> >MT</option>
                                        <option value="NE" <%= (employee.state == 'NE')?'selected':'' %> >NE</option>
                                        <option value="NV" <%= (employee.state == 'NV')?'selected':'' %> >NV</option>
                                        <option value="NH" <%= (employee.state == 'NH')?'selected':'' %> >NH</option>
                                        <option value="NJ" <%= (employee.state == 'NJ')?'selected':'' %> >NJ</option>
                                        <option value="NM" <%= (employee.state == 'NM')?'selected':'' %> >NM</option>
                                        <option value="NY" <%= (employee.state == 'NY')?'selected':'' %> >NY</option>
                                        <option value="NC" <%= (employee.state == 'NC')?'selected':'' %> >NC</option>
                                        <option value="ND" <%= (employee.state == 'ND')?'selected':'' %> >ND</option>
                                        <option value="OH" <%= (employee.state == 'OH')?'selected':'' %> >OH</option>
                                        <option value="OK" <%= (employee.state == 'OK')?'selected':'' %> >OK</option>
                                        <option value="OR" <%= (employee.state == 'OR')?'selected':'' %> >OR</option>
                                        <option value="PA" <%= (employee.state == 'PA')?'selected':'' %> >PA</option>
                                        <option value="RI" <%= (employee.state == 'RI')?'selected':'' %> >RI</option>
                                        <option value="SC" <%= (employee.state == 'SC')?'selected':'' %> >SC</option>
                                        <option value="SD" <%= (employee.state == 'SD')?'selected':'' %> >SD</option>
                                        <option value="TN" <%= (employee.state == 'TN')?'selected':'' %> >TN</option>
                                        <option value="TX" <%= (employee.state == 'TX')?'selected':'' %> >TX</option>
                                        <option value="UT" <%= (employee.state == 'UT')?'selected':'' %> >UT</option>
                                        <option value="VT" <%= (employee.state == 'VT')?'selected':'' %> >VT</option>
                                        <option value="VA" <%= (employee.state == 'VA')?'selected':'' %> >VA</option>
                                        <option value="WA" <%= (employee.state == 'WA')?'selected':'' %> >WA</option>
                                        <option value="WV" <%= (employee.state == 'WV')?'selected':'' %> >WV</option>
                                        <option value="WI" <%= (employee.state == 'WI')?'selected':'' %> >WI</option>
                                        <option value="WY" <%= (employee.state == 'WY')?'selected':'' %> >WY</option>
                                    </select>
                                </div>
                                </div>
                                <div class="form-group required">
                                    <label for="Zip" class="col-sm-2 control-label">Zip</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" id="Zip" name="Zip" type="text" pattern="\d{5}-?(\d{4})?" class="required" title="Zip" placeholder="##### or #####-####" value="<%= employee.zip %>" required>
                                </div>
                                </div>
                                <div class="form-group required">
                                    <label for="Email" class="col-sm-2 control-label">Email</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" id="Email" name="Email" type="email" class="required" title="Email" placeholder="Email" value="<%= employee.email %>" readonly>
                                </div>
                                    </div>
                                <div class="form-group required">
                                    <label for="BirthDate" class="col-sm-2 control-label">Birth Date</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" id="BirthDate" name="BirthDate" pattern="\d{4}-\d{2}-\d{2}" placeholder="YYYY-MM-DD" type="date" class="required" title="Birth Date" value="<%= employee.birthdate %>" required>
                                </div>
                                </div>
                                <div class="form-group required">
                                    <label for="NumberofPeopleThatNeedCoverage" class="col-sm-2 control-label">Number of People That Need Coverage</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" id="NumberofPeopleThatNeedCoverage" name="NumberofPeopleThatNeedCoverage" type="number" class="required" title="Number of People That Need Coverage" placeholder="0" value="<%= employee.coveragenumber %>"required>
                                </div>
                                </div>
                                    <div class="form-group required">
                                    <label for="PrimarySocialSecurity" class="col-sm-2 control-label">Primary Social Security #</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" id="PrimarySocialSecurity" pattern="\d{3}-\d{2}-\d{4}" name="PrimarySocialSecurity" type="text" class="required" title="Primary Social Security #" placeholder="###-##-####" value="<%= employee.ss %>"required>
                                </div>
                                    </div>
                            <div id="Dependent1div">
                                <div class="form-group">
                                    <h5 style="text-align:center;">Dependent 1</h5>
                                    <label for="Dependent1FirstName" class="col-sm-2 control-label">Dependent 1 First Name</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" id="Dependent1FirstName" name="Dependent1FirstName" value="<%= employee.d1firstname %>" type="text">
                                </div>
                                </div>
                                <div class="form-group">
                                    <label for="Dependent1LastName" class="col-sm-2 control-label">Dependent 1 Last Name</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" id="Dependent1LastName" name="Dependent1LastName" value="<%= employee.d1lastname %>" type="text">
                                </div>
                                    </div>
                                <div class="form-group">
                                    <label for="Dependent1BirthDate" class="col-sm-2 control-label">Dependent 1 Birth Date </label>
                                    <div class="col-sm-10">
                                    <input class="form-control" id="Dependent1BirthDate" pattern="\d{4}-\d{2}-\d{2}" placeholder="YYYY-MM-DD" name="Dependent1BirthDate" value="<%= employee.d1birthdate %>"type="date">
                                </div>
                                </div>
                                <div class="form-group">
                                    <label for="Dependent1SocialSecurity#"  class="col-sm-2 control-label">Dependent 1 Social Security #</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" pattern="\d{3}-\d{2}-\d{4}" placeholder= "###-##-####" id="Dependent1SocialSecurity#" value="<%= employee.d1ss %>" name="Dependent1SocialSecurity" type="text">
                                </div>
                                </div>
                                <div class="form-group">
                                    <fieldset>
                                        <label for="Dependent1Gender"  class="col-sm-2 control-label">Dependent 1 Gender</label>
                                        <div class="col-sm-10">
                                        <span><input value="Male" id="Dependent1Gender" <%= (employee.d1gender == 'Male')?'checked="checked"':'' %> name="Dependent1Gender" type="radio"> <label for="Dependent1Gender">Male</label></span>
                                        <span><input value="Female" id="Dependent1Gender" <%= (employee.d1gender == 'Female')?'checked="checked"':'' %> name="Dependent1Gender" type="radio"> <label for="Dependent1Gender">Female</label></span>
                                        </div>
                                    </fieldset>
                                </div>
                                <div class="form-group">
                                    <span><label for="Dependent1NeedsCoverage" class="col-sm-2 control-label">Dependent 1 Needs Coverage</label></span>
                                    <div class="col-sm-10">
                                    <input  id="Dependent1NeedsCoverage" name="Dependent1NeedsCoverage" <%= (employee.d1coverage == 'on')?'checked="checked"':'' %> type="checkbox">
                                </div>
                                    </div>
                            </div>
                                <input type="button" id="dependent2button" value="add/show next dependent" onclick="showDependent2()" />
                            <div id="Dependent2div" style="display: none">
                                <div class="form-group">
                                    <h5 style="text-align:center;">Dependent 2</h5>
                                    <label for="Dependent2FirstName" class="col-sm-2 control-label">Dependent 2 First Name</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="Dependent2FirstName" value="<%= employee.d2firstname %>" name="Dependent2FirstName" type="text">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="Dependent2LastName" class="col-sm-2 control-label">Dependent 2 Last Name</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="Dependent2LastName" value="<%= employee.d2lastname %>" name="Dependent2LastName" type="text">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="Dependent2BirthDate" class="col-sm-2 control-label">Dependent 2 Birth Date </label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="Dependent2BirthDate" pattern="\d{4}-\d{2}-\d{2}" placeholder="YYYY-MM-DD" value="<%= employee.d2birthdate %>" name="Dependent2BirthDate" type="date">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="Dependent2SocialSecurity#"  class="col-sm-2 control-label">Dependent 2 Social Security #</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" pattern="\d{3}-\d{2}-\d{4}" placeholder= "###-##-####" id="Dependent2SocialSecurity#" value="<%= employee.d2ss %>" name="Dependent2SocialSecurity" type="text">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <fieldset>
                                        <label for="Dependent2Gender"  class="col-sm-2 control-label">Dependent 2 Gender</label>
                                        <div class="col-sm-10">
                                            <span><input value="Male" id="Dependent2Gender" <%= (employee.d2gender == 'Male')?'checked="checked"':'' %> name="Dependent2Gender" type="radio"> <label for="Dependent2Gender">Male</label></span>
                                            <span><input value="Female" id="Dependent2Gender" <%= (employee.d2gender == 'Female')?'checked="checked"':'' %> name="Dependent2Gender" type="radio"> <label for="Dependent2Gender">Female</label></span>
                                        </div>
                                    </fieldset>
                                </div>
                                <div class="form-group">
                                    <span><label for="Dependent2NeedsCoverage" class="col-sm-2 control-label">Dependent 2 Needs Coverage</label></span>
                                    <div class="col-sm-10">
                                        <input  id="Dependent2NeedsCoverage" name="Dependent2NeedsCoverage" <%= (employee.d2coverage == 'on')?'checked="checked"':'' %> type="checkbox">
                                    </div>
                                </div>
                            </div>
                                <input type="button" id="dependent3button" value="add/show next dependent" style="display: none" onclick="showDependent3()" />
                            <div id="Dependent3div" style="display: none">
                                <div class="form-group">
                                    <h5 style="text-align:center;">Dependent 3</h5>
                                    <label for="Dependent3FirstName" class="col-sm-2 control-label">Dependent 3 First Name</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="Dependent3FirstName" value="<%= employee.d3firstname %>" name="Dependent3FirstName" type="text">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="Dependent3LastName" class="col-sm-2 control-label">Dependent 3 Last Name</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="Dependent3LastName" value="<%= employee.d3lastname %>" name="Dependent3LastName" type="text">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="Dependent3BirthDate" class="col-sm-2 control-label">Dependent 3 Birth Date </label>
                                    <div class="col-sm-10">
                                        <input class="form-control" pattern="\d{4}-\d{2}-\d{2}" placeholder="YYYY-MM-DD" id="Dependent3BirthDate" value="<%= employee.d3birthdate %>" name="Dependent3BirthDate" type="date">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="Dependent3SocialSecurity#"  class="col-sm-2 control-label">Dependent 3 Social Security #</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" pattern="\d{3}-\d{2}-\d{4}" placeholder= "###-##-####" value="<%= employee.d3ss %>" id="Dependent3SocialSecurity#" name="Dependent3SocialSecurity" type="text">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <fieldset>
                                        <label for="Dependent3Gender"  class="col-sm-2 control-label">Dependent 3 Gender</label>
                                        <div class="col-sm-10">
                                            <span><input value="Male" id="Dependent3Gender" <%= (employee.d3gender == 'Male')?'checked="checked"':'' %> name="Dependent3Gender" type="radio"> <label for="Dependent3Gender">Male</label></span>
                                            <span><input value="Female" id="Dependent3Gender" <%= (employee.d3gender == 'Female')?'checked="checked"':'' %> name="Dependent3Gender" type="radio"> <label for="Dependent3Gender">Female</label></span>
                                        </div>
                                    </fieldset>
                                </div>
                                <div class="form-group">
                                    <span><label for="Dependent3NeedsCoverage" class="col-sm-2 control-label">Dependent 3 Needs Coverage</label></span>
                                    <div class="col-sm-10">
                                        <input  id="Dependent3NeedsCoverage" <%= (employee.d3coverage == 'on')?'checked="checked"':'' %> name="Dependent3NeedsCoverage" type="checkbox">
                                    </div>
                                </div>
                            </div>
                                <input type="button" id="dependent4button" value="add/show next dependent" style="display: none" onclick="showDependent4()" />
                            <div id="Dependent4div" style="display: none">
                                <div class="form-group">
                                    <h5 style="text-align:center;">Dependent 4</h5>
                                    <label for="Dependent4FirstName" class="col-sm-2 control-label">Dependent 4 First Name</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="Dependent4FirstName" value="<%= employee.d4firstname %>" name="Dependent4FirstName" type="text">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="Dependent4LastName" class="col-sm-2 control-label">Dependent 4 Last Name</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="Dependent4LastName" value="<%= employee.d4lastname %>" name="Dependent4LastName" type="text">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="Dependent4BirthDate" class="col-sm-2 control-label">Dependent 4 Birth Date </label>
                                    <div class="col-sm-10">
                                        <input class="form-control" pattern="\d{4}-\d{2}-\d{2}" placeholder="YYYY-MM-DD" id="Dependent4BirthDate" value="<%= employee.d4birthdate %>" name="Dependent4BirthDate" type="date">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="Dependent4SocialSecurity#"  class="col-sm-2 control-label">Dependent 4 Social Security #</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" pattern="\d{3}-\d{2}-\d{4}" placeholder= "###-##-####" value="<%= employee.d4ss %>" id="Dependent4SocialSecurity#" name="Dependent4SocialSecurity" type="text">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <fieldset>
                                        <label for="Dependent4Gender"  class="col-sm-2 control-label">Dependent 4 Gender</label>
                                        <div class="col-sm-10">
                                            <span><input value="Male" id="Dependent4Gender" <%= (employee.d4gender == 'Male')?'checked="checked"':'' %> name="Dependent4Gender" type="radio"> <label for="Dependent4Gender">Male</label></span>
                                            <span><input value="Female" id="Dependent4Gender" <%= (employee.d4gender == 'Female')?'checked="checked"':'' %> name="Dependent4Gender" type="radio"> <label for="Dependent4Gender">Female</label></span>
                                        </div>
                                    </fieldset>
                                </div>
                                <div class="form-group">
                                    <span><label for="Dependent4NeedsCoverage" class="col-sm-2 control-label">Dependent 4 Needs Coverage</label></span>
                                    <div class="col-sm-10">
                                        <input  id="Dependent4NeedsCoverage" <%= (employee.d4coverage == 'on')?'checked="checked"':'' %> name="Dependent4NeedsCoverage" type="checkbox">
                                    </div>
                                </div>
                            </div>
                                <div class="form-group">
                                    <label for="employer"  class="col-sm-2 control-label">Employer</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="employer" name="employer" type="text" value="<%= employer.empname %>" readonly>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="employerphone"  class="col-sm-2 control-label">Employer Phone #</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="employerphone" name="employerphone" type="tel" value="<%= employer.phonenumber %>" readonly>
                                    </div>
                                </div>
                                <div class="form-group required">
                                    <label for="income"  class="col-sm-2 control-label">Household Income $</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="income" name="income" type="number" value="<%= employee.income %>" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="physician"  class="col-sm-2 control-label">Primary Care Physician</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="physician" name="physician" type="text" value="<%= employee.physician %>">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="physicianspecialty"  class="col-sm-2 control-label">Primary Care Physician Specialty</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="physicianspecialty" name="physicianspecialty" type="text" value="<%= employee.physicianspecialty %>">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="ailment1"  class="col-sm-2 control-label">Physical Ailment Requiring Treatment</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="ailment1" name="ailment1" placeholder="Leave blank if none" type="text" value="<%= employee.ailment1 %>">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="ailment2"  class="col-sm-2 control-label">Physical Ailment Requiring Treatment</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="ailment2" name="ailment2" placeholder="Leave blank if none" type="text" value="<%= employee.ailment2 %>">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="ailment3"  class="col-sm-2 control-label">Physical Ailment Requiring Treatment</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="ailment3" name="ailment3" placeholder="Leave blank if none" type="text" value="<%= employee.ailment3 %>">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="prescription1"  class="col-sm-2 control-label">Prescription</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="prescription1" name="prescription1" placeholder="Leave blank if none" type="text" value="<%= employee.prescription1 %>">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="dosage1"  class="col-sm-2 control-label">Dosage</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="dosage1" name="dosage1" placeholder="Leave blank if none" type="text" value="<%= employee.dosage1 %>">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="prescription2"  class="col-sm-2 control-label">Prescription</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="prescription2" name="prescription2" placeholder="Leave blank if none" type="text" value="<%= employee.prescription2 %>">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="dosage2"  class="col-sm-2 control-label">Dosage</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="dosage2" name="dosage2" placeholder="Leave blank if none" type="text" value="<%= employee.dosage2 %>">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="prescription3"  class="col-sm-2 control-label">Prescription</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="prescription3" name="prescription3" placeholder="Leave blank if none" type="text" value="<%= employee.prescription3 %>">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="dosage3"  class="col-sm-2 control-label">Dosage</label>
                                    <div class="col-sm-10">
                                        <input class="form-control" id="dosage3" name="dosage3" placeholder="Leave blank if none" type="text" value="<%= employee.dosage3 %>">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="signatureid"  class="col-sm-2 control-label">SignatureId</label>
                                    <div class="col-sm-10">
                                    <input class="form-control" id="signatureid" name="signatureid" type="text" value="<%= employee.signature %>" readonly>
                                </div>
                                    </div>
                                <div class="row" style="text-align: center;">
                                    <div id="signature_container"><canvas style="margin-left: auto; margin-right: auto;" data-processing-sources="signature.pde" id="signature"></canvas></div>
                                    <script src="//cdnjs.cloudflare.com/ajax/libs/processing.js/1.4.8/processing.min.js"></script>
                                </div>
                                <div class="row" style="margin: auto;">
                                    <button type="submit" value="submit" class="btn btn-success">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <% } %>
        <% }); %>
        <% include ../partials/footer.ejs %>
        <script>
        function savedSignature()
        {
        var img = document.getElementById("signature_image");
        var id = img.getAttribute('src');
        if (id != null) {
            document.getElementById('signatureid').readonly = false;
            document.getElementById('signatureid').value = id;
            document.getElementById('signatureid').readonly = true;
        }
        }
        </script>
        <!--<script type = "text/javascript">-->

            <!--function show() {-->
                <!--document.getElementById("wholepage").style.display = "none";-->
                <!--var string = window.location.toString();-->
                <!-- -->
                <!--if (window.location.protocol == 'https:' || string.indexOf("localhost") != -1) {-->
                <!--}-->
                <!--else {-->
                    <!--window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);-->
                <!--}-->
                <!--var x = document.cookie.toString().split(';'); //for localhost cookies-->

                <!--if(document.cookie == "https=True" || x[1] == " https=True" || x[2] == " https=True") {-->
                    <!--hide();-->
                <!--}-->
                <!--else {-->
                    <!--var d = new Date();-->
                    <!--console.log(d);-->
                    <!--var newd = new Date();-->
                    <!--//based on +5 hrs-->
                    <!--newd.setMinutes(newd.getMinutes() + 320);-->
                    <!--console.log(newd);-->
                    <!--document.getElementById("wholepage").style.display = "none";-->
                    <!--document.getElementById("wrapperr").style.display = "block";-->
                    <!--document.cookie="https=True; expires=" + newd.toString() +";";-->
                    <!--setTimeout("hide()", 1700);-->
                <!--}-->
            <!--}-->

            <!--function hide() {-->
                <!--document.getElementById("wrapperr").style.display="none";-->
                <!--document.getElementById("wholepage").style.display="block";-->
                <!--setLoginSession();-->
            <!--}-->
            <!--window.onload = show;-->

        <!--</script>-->
        <script src="/js/dependentbuttons.js"> </script>
        <script>
            var queryString = window.location.search;
            queryString = queryString.substring(2);
            if(queryString == "saved"){
                document.getElementById("my-modal").style.display = "block";
            }

            $("#closemodal").click(function () {
                $("#my-modal").css("display", "none");
                window.location.href = "/information";
            });
        </script>
    </body>
</html>
```

#### login.ejs

```sh
<!DOCTYPE html>
<html>
<head>
  <% include ../partials/header.ejs %>
    <script src="/js/forcehttps.js"> </script>
</head>
<body>
    <div class="page-wrapper">
        <% include ../partials/nav.ejs %>
        <div class="container">

            <div class="col-sm-6 col-sm-offset-3">
                <div class="well">
                <h1><span class="fa fa-sign-in"></span> Agent Login</h1>

                <!-- show any messages that come back with authentication -->
                <% if (message.length > 0) { %>
                <div class="alert alert-danger"><%= message %></div>
                <% } %>

                <!-- LOGIN FORM -->
                <form action="/agentLogin" method="post">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="text" class="form-control" name="email" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" class="form-control" name="password" required>
                    </div>

                    <button type="submit" class="btn btn-primary">Login</button>
                </form>

                <hr>

                <p>Need an account? <a href="/signup">Signup</a></p>
                <p>Or go <a href="/">home</a>.</p>

            </div>
        </div>
        </div>
    </div>
    <% include ../partials/footer.ejs %>

</body>
</html>
```

#### login2.ejs

```sh
<!doctype html>
<html>
<head>
    <% include ../partials/header.ejs %>
    <script src="/js/forcehttps.js"> </script>
</head>
<body>
<div class="page-wrapper">
    <% include ../partials/nav.ejs %>
    <div class="container">

        <div class="col-sm-6 col-sm-offset-3">
            <div class="well">
            <h1><span class="fa fa-sign-in"></span> Login</h1>

            <!-- show any messages that come back with authentication -->
            <% if (message == "Email Sent!" || message.indexOf("Your Email is") > -1) { %>
            <div class="alert alert-success"><%= message %></div>
            <% } %>

            <% if (message.length > 0 && message != "Email Sent!" && message.indexOf("Your Email is") < 0) { %>
            <div class="alert alert-danger"><%= message %></div>
            <% } %>


            <!-- LOGIN FORM -->

            <form action="/login" method="post">
                <div class="form-group">
                    <label>Email</label>
                    <input type="text" class="form-control" name="email" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" class="form-control" name="password" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Login</button>
            </form>
                <hr>
                <p>
                    <a href="/recovery">Need help?</a>
                </p>
                <p>
                    <a href="/agentLogin">Login as Agent</a>
                </p>
        </div>
        </div>
    </div>
</div>
<% include ../partials/footer.ejs %>

</body>
</html>
```

#### passwordExpired.ejs

```sh
<!doctype html>
<html>
<head>
    <% include ../partials/header.ejs %>
</head>
<body>
<div class="page-wrapper">
    <% include ../partials/nav.ejs %>
    <div class="container">

        <div class="col-sm-6 col-sm-offset-3">
            <div class="well">
            <h1><span class="fa fa-sign-in"></span> Set Password</h1>
            
            <!-- show any messages that come back with authentication -->
            <% if (message.length > 0) { %>
            <div class="alert alert-danger"><%= message %></div>
            <% } %>
            
            <!-- LOGIN FORM -->
            <form action="/passwordExpired" method="post">
                <div class="form-group">
                    <label>Email</label>
                    <input type="text" class="form-control" name="email" value="<%= emailAddress %>" readonly>
                </div>
                <div class="form-group">
                    <label>New Password</label>
                    <input type="password" class="form-control" name="password" required>
                </div>
                <div class="form-group">
                    <label>Confirm Password</label>
                    <input type="password" class="form-control" name="passwordverify" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Set Password</button>
                <br/>
                <br/>
                <a href="/recovery">Need help?</a>
            </form>
        </div>
    </div>
    </div>
</div>
<% include ../partials/footer.ejs %>
<script src="/js/forcehttps.js"> </script>
</body>
</html>
```

#### quote.ejs

```sh
<!DOCTYPE html>
<html>
<head>
  <% include ../partials/header.ejs %>
</head>

<body>
    
    <div class="page-wrapper">
        <% include ../partials/nav.ejs %>
        <div class="container">
            <div style="padding-top: 99px; text-align: center;">
                <form class="form-horizontal" action="/submitQuote/" method="post">
                    <div class="form-group">
                        <label for="firstName" class="col-sm-2 control-label">First Name:</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" name="firstName" id="firstName" placeholder="First Name">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="lastName" class="col-sm-2 control-label">Last Name:</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" name="lastName" id="lastName" placeholder="Last Name">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="streetAddress" class="col-sm-2 control-label">Street Address:</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" name="streetAddress" id="streetAddress" placeholder="Street Address">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="city" class="col-sm-2 control-label">City:</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" name="city" id="city" placeholder="City">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="state" class="col-sm-2 control-label">State:</label>
                        <div class="col-sm-10">
                            <select name="state" id="state" class="form-control">
                                <option value="AL">AL</option>
                                <option value="AK">AK</option>
                                <option value="AZ">AZ</option>
                                <option value="AR">AR</option>
                                <option value="CA">CA</option>
                                <option value="CO">CO</option>
                                <option value="CT">CT</option>
                                <option value="DE">DE</option>
                                <option value="DC">DC</option>
                                <option value="FL">FL</option>
                                <option value="GA">GA</option>
                                <option value="HI">HI</option>
                                <option value="ID">ID</option>
                                <option value="IL">IL</option>
                                <option value="IN">IN</option>
                                <option value="IA">IA</option>
                                <option value="KS">KS</option>
                                <option value="KY">KY</option>
                                <option value="LA">LA</option>
                                <option value="ME">ME</option>
                                <option value="MD">MD</option>
                                <option value="MA">MA</option>
                                <option value="MI">MI</option>
                                <option value="MN">MN</option>
                                <option value="MS">MS</option>
                                <option value="MO">MO</option>
                                <option value="MT">MT</option>
                                <option value="NE">NE</option>
                                <option value="NV">NV</option>
                                <option value="NH">NH</option>
                                <option value="NJ">NJ</option>
                                <option value="NM">NM</option>
                                <option value="NY">NY</option>
                                <option value="NC">NC</option>
                                <option value="ND">ND</option>
                                <option value="OH">OH</option>
                                <option value="OK">OK</option>
                                <option value="OR">OR</option>
                                <option value="PA">PA</option>
                                <option value="RI">RI</option>
                                <option value="SC">SC</option>
                                <option value="SD">SD</option>
                                <option value="TN">TN</option>
                                <option value="TX">TX</option>
                                <option value="UT">UT</option>
                                <option value="VT">VT</option>
                                <option value="VA">VA</option>
                                <option value="WA">WA</option>
                                <option value="WV">WV</option>
                                <option value="WI">WI</option>
                                <option value="WY">WY</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="zipCode" class="col-sm-2 control-label">Zip Code:</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" name="zipCode" id="zipCode" placeholder="Zip Code">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="phoneNumber" class="col-sm-2 control-label">Phone Number:</label>
                        <div class="col-sm-10">
                            <input type="tel" class="form-control" name="phoneNumber" id="phoneNumber" placeholder="Phone Number">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="emailAddress" class="col-sm-2 control-label">E-mail Address:</label>
                        <div class="col-sm-10">
                            <input type="email" class="form-control" name="emailAddress" id="emailAddress" placeholder="E-mail Address">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="comments" class="col-sm-2 control-label">Comments:</label>
                        <div class="col-sm-10">
                            <textarea type="text" class="form-control" name="comments" id="comments" placeholder="Enter comments here!" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="col-sm-offset-2 col-sm-10">
                            <button type="submit" value="submit" class="btn btn-success">Submit</button>
                            <button type="reset" class="btn btn-danger">Reset</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <% include ../partials/footer.ejs %>

    <!-- Placed at the end of the document so the pages load faster -->
    <script src="/common-files/js/jquery-1.10.2.min.js"></script>
    <script src="/flat-ui/js/bootstrap.min.js"></script>
    <script src="/common-files/js/modernizr.custom.js"></script>
    <script src="/common-files/js/jquery.scrollTo-1.4.3.1-min.js"></script>
    <script src="/common-files/js/jquery.parallax.min.js"></script>
    <script src="/common-files/js/startup-kit.js"></script>
    <script src="/common-files/js/jquery.backgroundvideo.min.js"></script>
    <script src="/js/script.js"></script>


</body>
</html>
```

#### recovery.ejs

```sh
<!doctype html>
<html>
    <head>
        <% include ../partials/header.ejs %>
        <script src='https://www.google.com/recaptcha/api.js'></script>
    </head>
    <body>
        <div class="page-wrapper">
            <% include ../partials/nav.ejs %>
            <div class="container">
                <div class="well">
                <div class="row">
                    <div class=".col-xs-6 .col-sm-4">
                        <form class="form-horizontal" action="/recovery" method="post">
                            <h1>Having trouble signing in?</h1>
                            <div class="radio-option">
                                <label>
                                    <input type="radio" name="optionsRadios" id="optionsRadios1" value="option1" onclick="recoveryOptionSelected();" data-toggle="collapse" data-target="#collapse1" aria-expanded="false" aria-controls="collapse1">
                                    I don't know my password
                                    <div class="collapse" id="collapse1" style="display: none;">
                                        <div class="well">
                                            To reset your password, enter the email address you use to sign in to ACA.
                                            <input type="email" class="form-control" name="email" id="email" placeholder="E-mail Address">
                                        </div>
                                    </div>
                                </label>
                            </div>
                            <div class="radio-option">
                                <label>
                                    <input type="radio" name="optionsRadios" id="optionsRadios2" value="option2" onclick="recoveryOptionSelected();"data-toggle="collapse" data-target="#collapse2" aria-expanded="false" aria-controls="collapse2">
                                    I don't know my username
                                    <div class="collapse" id="collapse2" style="display: none;">
                                        <div class="well">
                                            Enter your SSN and we will redirect you to the login with your email.
                                            <input type="text" pattern="\d{3}-\d{2}-\d{4}" class="form-control" name="ss" id="ss" placeholder="###-##-####">
                                            <div class="g-recaptcha" data-sitekey="6LdUuRATAAAAAMkGjzs6Fz2HyCRuLcorHDjs_nvT"></div>
                                        </div>
                                    </div>
                                </label>
                            </div>
                            <div class="radio-option">
                                <label>
                                    <input type="radio" name="optionsRadios" id="optionsRadios3" value="option3" onclick="recoveryOptionSelected();" data-toggle="collapse" data-target="#collapse3" aria-expanded="false" aria-controls="collapse3">
                                    I'm having other problems signing in
                                    <div class="collapse" id="collapse3" style="display: none">
                                        <div class="well">
                                            Enter the username you use to sign in to ACA.
                                            <input type="email" class="form-control" name="email2" id="email2" placeholder="E-mail Address">
                                        </div>
                                    </div>
                                </label>
                            </div>
                            <button type="submit" value="submit" class="btn btn-primary">Continue</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
        <% include ../partials/footer.ejs %>
        <script>
            function recoveryOptionSelected() {
                var optionOneSelected = document.getElementById("optionsRadios1").checked;
                var optionTwoSelected = document.getElementById("optionsRadios2").checked;
                var optionThreeSelected = document.getElementById("optionsRadios3").checked;
                if (optionOneSelected == true) {
                    $('#collapse2').collapse('hide');
                    $('#collapse3').collapse('hide');
                    document.getElementById("collapse2").style.display = "none";
                    document.getElementById("collapse3").style.display = "none";
                    document.getElementById("collapse1").style.display = "block";

                } else if (optionTwoSelected == true) {
                    $('#collapse1').collapse('hide');
                    $('#collapse3').collapse('hide');
                    document.getElementById("collapse1").style.display = "none";
                    document.getElementById("collapse3").style.display = "none";
                    document.getElementById("collapse2").style.display = "block";

                } else if (optionThreeSelected == true) {
                    $('#collapse1').collapse('hide');
                    $('#collapse2').collapse('hide');
                    document.getElementById("collapse1").style.display = "none";
                    document.getElementById("collapse2").style.display = "none";
                    document.getElementById("collapse3").style.display = "block";

                }
            }
        </script>
    </body>
</html>
```

#### search.ejs

```sh
<!-- views/profile.ejs -->
<!doctype html>
<html>
<head>
    <% include ../partials/header.ejs %></head>
<style>
    iframe {
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        height: 400px;
        width: 100%;
    }
</style>
<body>
<div class="page-wrapper">
    <% include ../partials/nav.ejs %>
    <div class="container">

        <div class="page-header text-center">
            <h1><span class="glyphicon glyphicon-home" aria-hidden="true"></span> Agent Dashboard</h1>
        </div>
        <div class="row">
            <!-- LOCAL INFORMATION -->
            <div class="col-sm-6">
                <div class="well">
                    <h3><span class="fa fa-user"></span> Agent Info</h3>
                    <p>
                        <strong>Agent ID</strong>: <%= user._id %><br>
                        <strong>Name</strong>: <%= user.local.firstName %> <%= user.local.lastName %><br>
                        <strong>E-mail</strong>: <%= user.local.email %>
                    </p>
                </div>
            </div>
            <div class="col-sm-6">
                <div class="well">
                    <h3><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span> Agent Cases</h3>
                    <p>
                        <% user.employer.forEach(function(employer) { %>
                        <a href="/<%= user._id %>/<%= employer._id %>"><%= employer.empname %></a>   <br>
                        <% }); %>
                    </p>
                    <p>
                        <a href="/profile/case" class="btn btn-default"> Add New Case</a>
                    </p>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-6">
                <div class="well">
                    <h3><span class="glyphicon glyphicon-calendar" aria-hidden="true"></span> Calendar</h3>
                    <p>
                        <iframe src="https://calendar.google.com/calendar/embed?src=acainsuresme%40gmail.com&ctz=America/Chicago" style="border: 0" frameborder="0" scrolling="yes"></iframe>
                    </p>
                </div>
            </div>
            <div class="col-sm-6">
                <div class="well">
                    <h3><span class="glyphicon glyphicon-search" aria-hidden="true"></span>Employee Search</h3>
                    <p>
                    <form class="form-inline" action="/search" method="post">
                        <div class="form-group">
                            <input type="search" name="search" class="form-control" id="search">
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn btn-default">Search</button>
                        </div>
                    </form>
                    </p>

                    <h5>Results:</h5>
                    <% search.forEach(function(employee) { %>
                    <% var check = false; %>
                    <% user.employer.forEach(function(employer) { %>
                    <% if (check == false) { %>
                    <% if(employee.employerid == employer._id) { %>
                    <% check = true %>
                    <div class="row">
                        <div class="col-md-6">
                        <b>Email:</b> <%= employee.email %><br>
                        <b>DOB:</b>   <%= employee.birthdate %><br>
                        <b>Phone#:</b>  <%= employee.phonenumber %><br>
                        </div>
                        <div class="col-md-6">
                        <b>First Name:</b> <%= employee.firstname%><br>
                        <b>Last Name:</b> <%= employee.lastname%><br>
                        <b>Employer:</b> <%= employer.empname %> <br><br><br><br>
                        </div>
                    </div>
                    <% } %>
                    <% } %>
                    <% }); %>
                    <% }); %>

                </div>
            </div>
        </div>
    </div>
</div>
<% include ../partials/footer.ejs %>
</body>
</html>
```

#### signup.ejs

```sh
<!-- views/signup.ejs -->
<!doctype html>
<html>
<head>
    <% include ../partials/header.ejs %>
    <script src="/js/forcehttps.js"> </script>
</head>
<body>
    <div class="page-wrapper">
        <% include ../partials/nav.ejs %>
        <div class="container">
            <div class="col-sm-6 col-sm-offset-3">
                <div class="well">
                <h1><span class="fa fa-sign-in"></span> Signup</h1>

                <!-- show any messages that come back with authentication -->
                <% if (message.length > 0) { %>
                <div class="alert alert-danger"><%= message %></div>
                <% } %>

                <!-- LOGIN FORM -->
                <form action="/signup" method="post">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" class="form-control" name="email" required>
                    </div>
                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" class="form-control" name="firstname" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" class="form-control" name="lastname" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" class="form-control" input pattern=".{8,}" name="password" required title="Minimum 8 characters required">
                    </div>
                    <div class="form-group">
                        <label>Verify Password</label>
                        <input type="password" class="form-control" name="passwordverify" required>
                    </div>
                    <div class="form-group">
                        <label>Agent Code</label>
                        <input type="password" class="form-control" name="agentcode" required>
                    </div>

                    <button type="submit" class="btn btn-primary">Signup</button>
                </form>

                <hr>

                <p>Already have an account? <a href="/agentlogin">Login</a></p>
                <p>Or go <a href="/">home</a>.</p>

            </div>
        </div>
    </div>
    </div>
    <% include ../partials/footer.ejs %>
</body>
</html>
```

#### signup2.ejs

```sh
<!-- views/signup.ejs -->
<!doctype html>
<html>
<head>
    <% include ../partials/header.ejs %>
    <script src="/js/forcehttps.js"> </script>
</head>
<body>

<div class="page-wrapper">
    <% include ../partials/nav.ejs %>
    <div class="container">
        <div class="col-sm-6 col-sm-offset-3">
            <div class="well">
            <h1><span class="fa fa-sign-in"></span> Signup</h1>

            <!-- show any messages that come back with authentication -->
            <% if (message.length > 0) { %>
            <div class="alert alert-danger"><%= message %></div>
            <% } %>

            <!-- LOGIN FORM -->
            <form action="/signup2" method="post">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" class="form-control" name="email" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" class="form-control" input pattern=".{8,}"  name="password" required title="Minimum 8 characters required">
                </div>
                <div class="form-group">
                    <label>Verify Password</label>
                    <input type="password" class="form-control" name="passwordverify" required>
                </div>
                <button type="submit" class="btn btn-primary">Signup</button>
            </form>

            <hr>
            <p>Or go <a href="/">home</a>.</p>
            </div>
        </div>
    </div>
</div>
<% include ../partials/footer.ejs %>
</body>
</html>
```

#### smallbusiness.ejs

```sh
<!DOCTYPE html>
<html>
    <head>
        <% include ../partials/header.ejs %>
    </head>
    <body>

    <div class="page-wrapper">
        <% include ../partials/nav.ejs %>
        <section>
            <div class="container">
                <div class="row">
                    <div class="col-sm-5">
                        <h1>The Small Business Insurance Market has changed.</h1>
                        <p>The new PPACA laws allow us to offer new innovative ways for small business to support their employees and control cost for themselves. We offer several turn-key solutions for you unique situation.</p>
                    </div>
                    <div class="col-sm-5">
                        <img src="../../img/1427838952.jpg" alt="" style="padding-top:60px;">
                    </div>
                </div>
            </div>
        </section>
        <section style="padding-top:60px;">
            <div class="container">
                <div class="row">
                    <div class="col-sm-2">
                        <img src="../../img/1427839095.png" alt="" style="padding-top:60px;">
                    </div>
                    <div class="col-sm-8">
                        <h3>Defined Contribution (Tax Free) Health Insurance</h3>
                        <p>For small businesses that would like to start new coverage or stop purchasing health insurance but still contribute towards employees health coverage as a benefit of their employment the concept of a Section 105 Defined Contribution plan offers many benefits to both your business and your employees. As a result of the Affordable Care Act’s law that, as of January 1st, 2014, requires insurers to offer coverage without health questions and to cover pre-existing conditions, individual and family coverage is more freely available to your employees and the broader availability of coverage, combined with a proper Section 105 Defined Benefit Plan, can help your business and its bottom line as well as our employees and their budgets. In many cases it’s a ‘win–win’ for your business and employees.</p>
                    </div>
                </div>
            </div>
        </section>
        <section style="padding-top:30px; padding-bottom:30px; margin-left:90px;">
            <div class="container">
                <div class="row">
                    <div class="col-sm-10">
                        <img src="../../img/1443063.png" alt="" style="padding-top:60px;">
                    </div>
                </div>
            </div>
        </section>
    </div>
    <div><div id="968244701478285836" align="center" style="width: 100%; overflow-y: hidden; margin-bottom: 30px;" class="wcustomhtml"><script id="setmore_script" type="text/javascript" src="https://my.setmore.com/js/iframe/setmore_iframe.js"></script><a id="Setmore_button_iframe" style="float:none" href="https://my.setmore.com/shortBookingPage/52b3edf9-5324-4ef0-bcae-4e25f31281ff"><img border="none" src="https://my.setmore.com/images/bookappt/SetMore-book-button.png" alt="Book an appointment with ACA Insurance Group using SetMore" /></a>
        </div>


        <% include ../partials/footer.ejs %>

    <!-- Placed at the end of the document so the pages load faster -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>

    </body>
</html>
```

#### success.ejs

```sh
<!DOCTYPE html>
<html>
<head>
  <% include ../partials/header.ejs %>
</head>

<body>
    
    <div class="page-wrapper">
        <% include ../partials/nav.ejs %>
        <section class="content-8 v-center">
            <div>
                <div class="container">
                    <div class="row">
                        <div class="col-sm-6 col-sm-offset-3">
                            <h1>Message Sent!</h1>
                            <h2>We will be in touch shortly. :)</h2>
                            <br/>
                            <br/>
                            <a class="btn btn-large btn-clear" href="/">Let's Go Back Home</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
    <% include ../partials/footer.ejs %>
    
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="/common-files/js/jquery-1.10.2.min.js"></script>
    <script src="/flat-ui/js/bootstrap.min.js"></script>
    <script src="/common-files/js/modernizr.custom.js"></script>
    <script src="/common-files/js/jquery.scrollTo-1.4.3.1-min.js"></script>
    <script src="/common-files/js/jquery.parallax.min.js"></script>
    <script src="/common-files/js/startup-kit.js"></script>
    <script src="/common-files/js/jquery.backgroundvideo.min.js"></script>
    <script src="/js/script.js"></script>
    <script type="text/javascript">
        function showContent8(){
            fadedEls($('.content-8'), 300);
            $(window).resize().scroll();
        }
        showContent8();
    </script>


</body>
</html>
```

### Models

#### admin.js

```sh
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
```

#### employee.js

```sh
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var employeeSchema = mongoose.Schema({
        agentid: String,
        employerid: String,
        employername: String,
        employerphone: String,
        email: String,
        password: String,
        passwordIsExpired: String,
        firstname: String,
        lastname: String,
        maritalstatus: String,
        spousefirstname: String,
        spouselastname: String,
        phonenumber: String,
        altphonenumber: String,
        address: String,
        city: String,
        state: String,
        zip: String,
        birthdate: String,
        coveragenumber: String,
        ss: String,
        signature: String,
        gender: String,
        d1firstname: String,
        d1lastname: String,
        d1birthdate: String,
        d1ss: String,
        d1gender: String,
        d1coverage: String,
        d2firstname: String,
        d2lastname: String,
        d2birthdate: String,
        d2ss: String,
        d2gender: String,
        d2coverage: String,
        d3firstname: String,
        d3lastname: String,
        d3birthdate: String,
        d3ss: String,
        d3gender: String,
        d3coverage: String,
        d4firstname: String,
        d4lastname: String,
        d4birthdate: String,
        d4ss: String,
        d4gender: String,
        d4coverage: String,
        income: String,
        physician: String,
        physicianspecialty: String,
        ailment1: String,
        ailment2: String,
        ailment3: String,
        prescription1: String,
        prescription2: String,
        prescription3: String,
        dosage1: String,
        dosage2: String,
        dosage3: String
});

employeeSchema.index(
    { "$**": "text" },
    { name: "textScore" }
);

// methods ======================
// generating a hash
employeeSchema.methods.generateHash = function(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
employeeSchema.methods.validPassword = function(password) {
        return bcrypt.compareSync(password, this.password);
};

// create the model for employees and expose it to our app
module.exports = mongoose.model('Employee', employeeSchema);
```

#### user.js

```sh
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email: String,
        password: String,
        firstName: String,
        lastName: String,
        role: String
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
```

## Credits

  - [Austin Paul](https://github.com/Arpdz2)
  - [Brenden McKamey](http://brendenmckamey.com/)

## License

Copyright (c) 2015 Austin Paul [https://github.com/Arpdz2](https://github.com/Arpdz2) & Brenden McKamey [http://brendenmckamey.com/](http://brendenmckamey.com/)