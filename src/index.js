/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');

const upload = multer({ dest: path.join(__dirname, 'uploads') });

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env.example' });

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
if (mongoose.connection.readyState !== 1) {
  mongoose.Promise = global.Promise;
  mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);
  mongoose.connection.on('error', (err) => {
    console.error(err);
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
  });
}

/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    autoReconnect: true,
    clear_interval: 3600
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  if (req.path === '/api/api/upload') {
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
      req.path !== '/api/login' &&
      req.path !== '/api/signup' &&
      !req.path.match(/^\/auth/) &&
      !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  } else if (req.user &&
      req.path === '/api/account') {
    req.session.returnTo = req.path;
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/api/', homeController.index);
app.get('/api/login', userController.getLogin);
app.post('/api/login', userController.postLogin);
app.get('/api/logout', userController.logout);
app.get('/api/forgot', userController.getForgot);
app.post('/api/forgot', userController.postForgot);
app.get('/api/reset/:token', userController.getReset);
app.post('/api/reset/:token', userController.postReset);
app.get('/api/signup', userController.getSignup);
app.post('/api/signup', userController.postSignup);
app.get('/api/contact', contactController.getContact);
app.post('/api/contact', contactController.postContact);
app.get('/api/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/api/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/api/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/api/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/api/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

/**
 * API examples routes.
 */
app.get('/api/api', apiController.getApi);
app.get('/api/api/lastfm', apiController.getLastfm);
app.get('/api/api/nyt', apiController.getNewYorkTimes);
app.get('/api/api/aviary', apiController.getAviary);
app.get('/api/api/steam', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getSteam);
app.get('/api/api/stripe', apiController.getStripe);
app.post('/api/api/stripe', apiController.postStripe);
app.get('/api/api/scraping', apiController.getScraping);
app.get('/api/api/twilio', apiController.getTwilio);
app.post('/api/api/twilio', apiController.postTwilio);
app.get('/api/api/clockwork', apiController.getClockwork);
app.post('/api/api/clockwork', apiController.postClockwork);
app.get('/api/api/foursquare', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFoursquare);
app.get('/api/api/tumblr', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTumblr);
app.get('/api/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
app.get('/api/api/github', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGithub);
app.get('/api/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTwitter);
app.post('/api/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postTwitter);
app.get('/api/api/linkedin', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getLinkedin);
app.get('/api/api/instagram', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getInstagram);
app.get('/api/api/paypal', apiController.getPayPal);
app.get('/api/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/api/paypal/cancel', apiController.getPayPalCancel);
app.get('/api/api/lob', apiController.getLob);
app.get('/api/api/upload', apiController.getFileUpload);
app.post('/api/api/upload', upload.single('myFile'), apiController.postFileUpload);
app.get('/api/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getPinterest);
app.post('/api/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postPinterest);
app.get('/api/api/google-maps', apiController.getGoogleMaps);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/api/auth/instagram', passport.authenticate('instagram'));
app.get('/api/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/api/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/api/');
});
app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
app.get('/api/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/api/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/api/');
});
app.get('/api/auth/github', passport.authenticate('github'));
app.get('/api/auth/github/callback', passport.authenticate('github', { failureRedirect: '/api/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/api/');
});
app.get('/api/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/api/auth/google/callback', passport.authenticate('google', { failureRedirect: '/api/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/api/');
});
app.get('/api/auth/twitter', passport.authenticate('twitter'));
app.get('/api/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/api/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/api/');
});
app.get('/api/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
app.get('/api/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/api/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/api/');
});

/**
 * OAuth authorization routes. (API examples)
 */
app.get('/api/auth/foursquare', passport.authorize('foursquare'));
app.get('/api/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api/api' }), (req, res) => {
  res.redirect('/api/api/foursquare');
});
app.get('/api/auth/tumblr', passport.authorize('tumblr'));
app.get('/api/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api/api' }), (req, res) => {
  res.redirect('/api/api/tumblr');
});
app.get('/api/auth/steam', passport.authorize('openid', { state: 'SOME STATE' }));
app.get('/api/auth/steam/callback', passport.authorize('openid', { failureRedirect: '/api/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/api/');
});
app.get('/api/auth/pinterest', passport.authorize('pinterest', { scope: 'read_public write_public' }));
app.get('/api/auth/pinterest/callback', passport.authorize('pinterest', { failureRedirect: '/api/login' }), (req, res) => {
  res.redirect('/api/api/pinterest');
});

app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});