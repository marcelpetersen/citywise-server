'use strict';

var express = require('express');
var router = express.Router();
var knex = require('../db/knex');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken')

router.get('/', function(req, res, next){
  res.send("<a href='/oauth/google'><button>Click Here To Authenticate</button></a>")
})

router.post('/admin/signup', function(req, res, next){
  var adminData = {};
  bcrypt.hash(req.body.password, 10, function(err, hash){
    if (err) {
      res.json({
        message: 'Password parsing error!'
      });
    } else {
      knex('cities').insert({
        name: req.body.name,
        admin_email: req.body.admin_email,
        admin_password: hash,
      })
      .returning('*')
      .then(function(data){
        adminData = data[0]
      })
      .then(function() {
        var token = jwt.sign(adminData, process.env.SECRET);
        res.status(200);
        res.json({
          token: token,
          user: adminData
        });
      })
      .catch(function(err) {
        res.json({
          message: 'Error! ' + err
        });
      });
    }
  })
});

router.post('/admin/login', function(req, res, next){
  console.log('body', req.body);
  var email = req.body.admin_email;
  knex('cities').where('admin_email', '=', req.body.admin_email)
  .then(function(user){
    user = user[0];
    if (user){
      console.log('user:', user);
      bcrypt.compare(req.body.password, user.admin_password, function(err, result){
        if (result){
          delete user.admin_password;
            var token = jwt.sign(user, process.env.SECRET);
            res.status(200).json({
              status: 'success',
              token: token,
              //don't delete this user, we need it!
              user: user
            });
          }
        else {
          res.json({
            error: 'invalid username or password'
          });
        }
      })
    }
    else {
      res.json({
        error: 'looks like you need to sign up for an account'
      })
    }
  })
})



module.exports = router;
