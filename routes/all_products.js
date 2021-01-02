const router = require('express').Router()
const Products = require('../models/product')
const Category = require('../models/category')
const fs = require('fs-extra')
const e = require('express')
var auth = require('../config/auth');
var isUser = auth.isUser;


router.get('/' ,  (req,res)=>{

// router.get('/' , isUser,  (req,res)=>{
    Products.find({}).then(found=>{
       
        res.render('all_products' , {products: found})

    })

})
//get product by category
router.get('/:category', function (req, res) {

// router.get('/:category',isUser, function (req, res) {

    var categorySlug = req.params.category;

    Category.findOne({slug: categorySlug}, function (err, c) {

        
        Products.find({category:categorySlug.toLowerCase()} ,function (err, products) {
            if (err)
                console.log(err);

            res.render('cat_products', {
                title: c.title,
                products: products
            });
        });
    });

});
router.get('/:category/:product' , function(req ,res) {

// router.get('/:category/:product' ,isUser, function(req ,res) {
    var gelleryImage = null ;
    var loggedIn = (req.isAuthenticated()) ? true:false ;
    Products.findOne({slug: req.params.product} , function (err , product) {
        if (err) {console.log(err);
        }else {
            var galleryDir = 'public/product_images/' + product._id + '/gallery'
            fs.readdir(galleryDir , function (err , files) {
                if (err){
                    console.log(err);
                }else {
                    gelleryImage = files ;
                    res.render('product' , {
                        title: product.title ,
                        p: product ,
                        gelleryImage:gelleryImage,
                        loggedIn : loggedIn
                    })
                }
            })
        }
    })

})




module.exports = router