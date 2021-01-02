const Product = require('../models/product');

const router = require('express').Router()

router.get('/add/:product', function (req, res) {

    var slug = req.params.product;

    Product.findOne({slug: slug}, function (err, p) {
        if (err)
            console.log(err);

        if (typeof req.session.cart == "undefined") {
            console.log(req.session.cart);
            req.session.cart = [];
            req.session.cart.push({
                title: slug,
                qty: 1,
                price: parseFloat(p.price).toFixed(2),
                image: '/product_images/' + p._id + '/' + p.img
            });
        } else {
            var cart = req.session.cart;
            var newItem = true;

            for (var i = 0; i < cart.length; i++) {
                if (cart[i].title == slug) {
                    cart[i].qty++;
                    newItem = false;
                    break;
                }
            }

            if (newItem) {
                cart.push({
                    title: slug,
                    qty: 1,
                    price: parseFloat(p.price).toFixed(2),
                    image: '/product_images/' + p._id + '/' + p.img
                });
            }
        }

        console.log(req.session.cart);
        req.flash('success', 'Product added!');
        res.redirect('back');
    });

});

router.get('/checkout' , function (req , res) {
    res.render('checkout' , {
        title : 'Checkout' ,
        cart : req.session.cart
    })

})
router.get('/update/:product' , function(req , res) {
    var slug = req.params.product;
    var cart = req.session.cart ;
    var action = req.query.action ;

    for (var i = 0; i < cart.length; i++) {
        
        if(cart[i].title == slug) {
            switch (action) {
                case "add":
                    cart[i].qty++ ;
                    break;
                case "remove":
                    cart[i].qty--;
                    if(cart[i].qty < 1)
                     cart.splice(i, 1);
                    break;
                case "clear":
                    cart.splice(i , 1);
                    if (cart.length == 0)
                    delete req.session.cart;
                    break;
                    default:
                        console.log('update problem');
                        break ;

            }
            break;
        }
    }

        req.flash('success' , 'Product Update')
        res.redirect('/cart/checkout')
})
router.get('/clear' , function(req , res) {
    delete req.session.cart ;
    req.flash('success' , 'Cart Cleared')
    res.redirect('/cart/checkout')

})
router.get('/buynow', function (req, res) {

    delete req.session.cart;
    
    res.sendStatus(200);

});
module.exports = router