var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator')
// Get Users model
var User = require('../models/user');


function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/users/login');
    }
  }
  

router.get('/register', function (req, res) {

   res.render('register', {
       title: 'Register'
   });

});
router.post('/register', [
   check('name', 'Name is required!').notEmpty(),
   check('email', 'Email is required!').isEmail(),
   check('username', 'Username is required!').notEmpty(),
   check('password', 'Password is required!').notEmpty(),
], (req, res) => { 
    const errors = validationResult(req)

    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;

    if (!errors.isEmpty()) {

        res.render('register', {
            errors: errors.errors,
            user: null,
            title: 'Register'
        });
    } else {
        User.findOne({username: username}, function (err, user) {
            if (err)
                console.log(err);

            if (user) {
                req.flash('danger', 'Username exists, choose another!');
                res.redirect('/users/register');
            } else {

                var user = new User({
                    name: name,
                    email: email,
                    username: username,
                    password: password,
                    admin: 0
                });

                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(user.password, salt, function (err, hash) {
                        if (err)
                            console.log(err);

                        user.password = hash;

                        user.save(function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.flash('success', 'You are now registered!');
                                res.redirect('/users/login')
                            }
                        });
                    });
                });
            }
        });
    }


})

router.get('/login', function (req, res) {

    if (res.locals.user) res.redirect('/');
    
    res.render('login', {
        title: 'Log in'
    });

});

/*
 * POST login
 */
router.post('/login', function (req, res, next) {

    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
    
});
 
router.get('/logout' , function(req , res) {
    req.logOut() ;
    req.flash('success' , 'You are logged out')
    res.redirect('/users/login')
})
module.exports = router;


