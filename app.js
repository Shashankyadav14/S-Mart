const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const config = require('./config/db')
const session = require('cookie-session');
var passport = require('passport');
mongoose.connect(config.dbKey, {useNewUrlParser: true , useUnifiedTopology: true} );
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  
  console.log('Connected to mongodb');
  
});
const app = express()

app.use(express.static('public'))
app.use( require('express-fileupload')())

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.set('view engine' , 'ejs')
//get Page Model
var Page = require('./models/Page');
var Category = require('./models/category')
//get all pages to pass to header.ejs
Page.find({}).sort({sorting:1}).exec(function (err,pages) {
  if(err) {
    console.log(err);
  } else {
    app.locals.pages = pages ;
  }
  
})

//get all categories 
Category.find((err , categoryData)=>{
  app.locals.categories = categoryData
})
// setup sessions 

app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    // cookie: { secure: true }
  }))

  // setup messages
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});
// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());
app.get('*', function(req,res,next) {
  res.locals.cart = req.session.cart;
  console.log(req.session.cart);
  res.locals.user = req.user || null;
  console.log(res.locals.user);
  next();
});

  //Routes
app.use('/products' , require('./routes/all_products'))
app.use('/cart' , require('./routes/cart'))
app.use('/users' , require('./routes/users'))
app.use('/admin/categories' , require('./routes/admin-category'))
app.use('/admin/pages' , require('./routes/admin-pages'))
app.use('/' , require('./routes/pages'))
app.use('/admin/products' , require('./routes/admin-products.js'))

app.listen(process.env.PORT || 5000,(req,res)=>{ 
console.log(`Listening on port ${process.env.PORT || 5000}`)
})
