const router = require('express').Router()
const { check, validationResult } = require('express-validator')
const Product = require('../models/product')
var mkdirp = require("mkdirp")
const path = require('path')
var fs = require('fs-extra')
const resizeImg = require('resize-img')
var Category = require('../models/category') ;
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;



router.get('/' ,isAdmin, (req,res)=>{
    var count ;
    Product.countDocuments(function(err , c) {
        count = c ;
    })
    Product.find(function(err , products) {
        res.render('admin/products' , {
           products: products ,
           count: count  
        })
    })

})
// Get add-product
router.get('/add-product' ,isAdmin, (req,res)=>{
    var title = "" ;
    var desc = "";
    var price = "" ;
    Category.find(function(err , categories) {
        res.render('admin/add-product' , {
            title:title,
            categories:categories  ,
            desc:desc,
            price:price 
        })
        
    })
    

})
let lowerCase = (body) => {
    let result = Object.assign(body);
    for (let prop in result) {
        result[prop] = result[prop].toLowerCase()
    }
    return result;
}
//Post add-product
router.post('/add-product', [
    check('title', 'title must have a value').notEmpty(),
    check('desc', 'description must have a value').notEmpty(),
    check('price', 'price must have a value').isDecimal(),
    check('img').custom((v, {req} ) => {
             if ( req.files == undefined || Object.keys(req.files).length === 0) {
            console.log('no file to upload');
            req.imgFile = ""
            return true
        } else {
            req.imgFile = req.files.img.name
        }

        const extension = (path.extname(req.imgFile)).toLowerCase();
        switch (extension) {
            case '.jpg':
                return '.jpg';
            case '.jpeg':
                return '.jpeg';
            case '.png':
                return '.png';
                case '.gif':
                    return '.png';
                    case '.GIF':
                        return '.png';
            default: return false
        }

    }).withMessage('please upload an image!'), 

], (req, res) => {

    const errors = validationResult(req)
    const imageFile = req.imgFile

    let { title, slug, desc, price, category } = lowerCase(req.body)

    if (!slug) slug = title.replace('/\s+/g', '-')
    if (!errors.isEmpty()) {

        Category.find({}, (err, categories) => {
            if (err) return console.log(err);
            res.render('admin/add-product', {
                errors: errors.errors,
                title: title,
                desc: desc,
                categories: categories,
                price: price
            })

        })
    } else {
        Product.findOne({ slug: slug }, (err, foundProduct) => {
            if (err) {
                return console.log(err);
            }
            if (foundProduct) {
                req.flash('danger', 'product title exists choose another!')
                Category.find({}, (err, categories) => {
                    if (err) return console.log(err);
                    res.render('admin/add-product', {
                        errors: errors.errors,
                        title: title,
                        desc: desc,
                        categories: categories,
                        price: price
                    })

                })
            } else {
                const priceFormat = parseFloat(price).toFixed(2);
                const newProduct = new Product({ title: title, slug: slug, desc: desc, price: priceFormat, category: category, img: imageFile || '' })
                newProduct.save(err => {
                    if (err) {
                        return console.log(err);
                    }


                    mkdirp('public/product_images/' + newProduct._id).then(() => {
                        mkdirp('public/product_images/' + newProduct._id + '/gallery')
                        mkdirp('public/product_images/' + newProduct._id + '/gallery/thumbs');
                        if (req.files == undefined || null) return ;
                        
                            let imageProduct = req.files.img;
                            let path = 'public/product_images/' + newProduct._id + "/" + imageFile;

                            imageProduct.mv(path, err => {
                                if (err) return console.log( err);
                            })
                        
                    }).catch((err) => {
                        if (err) return console.log(err);

                    })


                    req.flash('success', 'product added!')
                    res.redirect('/admin/products')

                })
            }
        })
    }
})

   
    //get edit product
    router.get('/edit-product/:id',isAdmin, (req, res) => {
        let errors = null;
        if (req.session.errors)
            errors = req.session.errors
        req.session.errors
    
        const id = req.params.id
        Category.find((err, categories) => {
            if (err) console.log(err);
            Product.findById({ _id: id }, (err, product) => {
                if (err) return console.log(err);
                let gallaryDir = `public/product_images/${id}/gallery`
                let galleryImages = null
                fs.readdir(gallaryDir).then((files) => {
    
                    galleryImages = files
                    res.render('admin/edit-product', {
                        errors: errors,
                        title: product.title,
                        desc: product.desc,
                        categories: categories,
                        selectedCate: product.category,
                        price: parseFloat(product.price).toFixed(2),
                        desc: product.desc,
                        dbImg: product.img,
                        galleryImages: galleryImages,
                        id: id
                    })
                }).catch(err => console.log(err))
            })
        })
    
    })
    
//post edit product
router.post('/edit-product/:id', [
    check('title', 'title must have a value').notEmpty(),
    check('desc', 'description must have a value').notEmpty(),
    check('price', 'price must have a value').isDecimal(),
    check('img', 'please upload an image!').custom((v, { req }) => {
        if (!(req.files && req.files.img && req.files.img.name)) {
            req.imgFileName = ''
            return true
        }

        req.imgFileName = req.files.img.name
        const extension = (path.extname(req.imgFileName)).toLowerCase();
        switch (extension) {
            case '.jpg':
                return '.jpg';
            case '.jpeg':
                return '.jpeg';
            case '.png':
                return '.png';
            default: return false
        }

    }).withMessage(),
], (req, res) => {
    let imageFile = req.imgFileName
    const errors = validationResult(req)
    const { title, desc, price, category, dbImg } = lowerCase(req.body)

    const id = req.params.id
    const slug = title.replace('/\s+/g', '-')
    if (!errors.isEmpty()) {
        Category.find((err, categories) => {
            res.render('admin/products/edit-product', {
                errors: errors.errors,
                title: title,
                desc: desc,
                categories: categories,
                selectedCate: category,
                price: price,
                desc: desc,
                dbImg: dbImg,
                id: id
            })

        })



    } else {

        Product.findOne({ slug: slug, _id: { $ne: id } }, (err, foundProduct) => {

            if (err)
                return console.log(err);
            if (foundProduct) {

                req.flash('danger', 'product slug exists choose another!')
                Categories.find((err, categories) => {
                    res.render('admin/products/edit-product', {
                        title: title,
                        desc: desc,
                        categories: categories,
                        selectedCate: category,
                        price: price,
                        desc: desc,
                        dbImg: dbImg,
                        id: id
                    })

                })
            } else {

                Product.findOne({ _id: id }, (err, product) => {

                    if (err) return console.log(err);
                    product.title = title
                    product.desc = desc
                    product.price = price
                    product.category = category
                    product.price = price

                    product.img = (imageFile || dbImg)

                    product.save(err => {
                        if (err)
                            return console.log(err);
                        if (req.files != undefined || null) {
                            if(dbImg!=''){
                                fs.remove('public/product_images/' + product._id + "/" + dbImg)
                            }
                            mkdirp('public/product_images/' + product._id).then(() => {
                            
                                const imageProduct = req.files.img
                                let path = 'public/product_images/' + product._id + "/" + imageFile
                                imageProduct.mv(path, err => {
                                    if (err) return console.log( err);

                                })
                            }).catch((err) => {
                                if (err) return console.log( err);

                            })
                        }
                        req.flash('success', 'product updated!')

                        Category.find((err, categories) => {
                            res.redirect('/admin/products')

                        })
                    })
                })
            }
        })
    }

})

//gallery
router.post('/product-gallery/:id', (req, res) => {
    const id = req.params.id;
    const productImages = req.files.file;
    
    const galleryPath = `public/product_images/${id}/gallery/${productImages.name}` 
    const thumbsPath = `public/product_images/${id}/gallery/thumbs/${productImages.name}`
    productImages.mv(galleryPath , (err)=>{
        resizeImg(fs.readFileSync(galleryPath) ,{width:100 , height:100}).then((buff)=>{
            fs.writeFileSync(thumbsPath , buff)
        })
        
    })
    res.sendStatus(200)

})
//delete image gallery
router.get('/delete-image/:image' ,isAdmin, (req,res)=>{
    const orginalImage = `public/product_images/${req.query.id}/gallery/${req.params.image}` 
    const thumbPath = `public/product_images/${req.query.id}/gallery/thumbs/${req.params.image}`
    fs.remove(orginalImage , function (err) {
        if(err) {
            console.log(err);

        }else {
            fs.remove(thumbPath , function (err) {
                if (err) {
                    console.log(err);
                }else {
                    req.flash('success', 'Image deleted!')
                    res.redirect('/admin/products/edit-product/' + req.query.id)


                }
            })
        }
    })
        
      
  })
  

//delete product
        router.get('/delete-product/:id' , (req,res)=>{
            var id = req.params.id;
            var path = `public/product_images/${id}` ;
            fs.remove(path , function (err) {
                if (err) {
                    console.log(err);
                }else {
                    Product.findByIdAndRemove(id , function (err) {
                        req.flash('success', 'Product deleted!')
                        res.redirect('/admin/products')
                    })

                }
            })
                
            
        })
        

module.exports = router