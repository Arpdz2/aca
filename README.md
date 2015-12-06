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

### Application Setup

#### index.js

### Database Config

#### db.js

### Routes

#### captcha.js

#### fdfdata.js

#### passport.js

#### sendEmail.js

#### udpdateEmail.js

#### userFunctions.js

#### utility.js

### Views

#### adminDashboard.ejs

#### adminEmployee.ejs

#### adminEmployer.ejs

#### agentDashboard.ejs

#### case.ejs

#### confirm.ejs

#### contact.ejs

#### db.ejs

#### employee.ejs

#### employer.ejs

#### healthplan.ejs

#### index.ejs

#### information.ejs

#### login.ejs

#### login2.ejs

#### passwordExpired.ejs

#### quote.ejs

#### recovery.ejs

#### search.ejs

#### signup.ejs

#### signup2.ejs

#### smallbusiness.ejs

#### success.ejs

### Models

#### admin.js

#### employee.js

#### user.js

## Credits

  - [Austin Paul](https://github.com/Arpdz2)
  - [Brenden McKamey](http://brendenmckamey.com/)

## License

Copyright (c) 2015 Austin Paul <[https://github.com/Arpdz2](https://github.com/Arpdz2) & Brenden McKamey <[http://brendenmckamey.com/](http://brendenmckamey.com/)>