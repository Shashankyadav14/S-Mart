const router = require('express').Router()
const { check, validationResult } = require('express-validator')
const Category = require('../models/category')
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;


let loadData = (data , req)=>{
    req.app.locals.categories = data
}
router.get('/' , isAdmin, (req,res)=>{
    Category.find(function (err , categories) {
        if (err) return console.log(err);
        res.render('admin/category', {category : categories})
        loadData(categories , req)
        
        
    }) 
        
    
})
// Get add-page
router.get('/add-category' , isAdmin , (req,res)=>{
    var title = "" ;
    
res.render('admin/add-category' , {
    title:title,
})

})

//Post add-page
router.post('/add-category' , [
    check('title' , 'title must have a value').notEmpty(),
  ], (req, res) => {
      
      
    const errors = validationResult(req)
    let {title , slug } = req.body
    slug = title.replace('/\s+/g', '-')
    if(!slug) slug = title.replace('/\s+/g', '-')
    if(!errors.isEmpty()) {
       
        res.render('admin/add-category' , {
            errors:errors.errors,
            title:title 
        })}else{
            Category.findOne({slug:slug} , (err , foundCategory) =>{
                if(err){
                    return console.log(err);
                }
               if(foundCategory){
                req.flash('danger' , 'Category slug exists choose another!')
                res.render('admin/add-category' , {
                    title:title,
                }) 
               }else{
                   const newCategory = new Category({title:title , slug:slug })
                   newCategory.save(err=>{
                       if(err){
                           return console.log(err);
                       }
                       req.flash('success' , 'Category added!')
                       res.render('admin/add-category' , {
                        title:null,
                        slug:null,
                        content:null
                    }) 
                       console.log(req.flash());
                       
                })
               }
           })
        }
    })
       
    //get edit page
    router.get('/edit-category/:id' ,isAdmin, (req,res)=>{
        Category.findById(req.params.id , function(err , category) {
            if (err) 
            return console.log(err)
            res.render('admin/edit-category' , {
                title:category.title,
                id: category._id
            })
        })
        
 
    
    })
//post edit page
router.post('/edit-category' , [
    check('title' , 'title must have a value').notEmpty(),
  ], (req, res) => {
      
      
    const errors = validationResult(req)
    let {title , slug , id} = req.body
    slug = title.replace('/\s+/g', '-')
    if(!slug) slug = title.replace('/\s+/g', '-')
    if(!errors.isEmpty()) {
       
        res.render('admin/edit-category' , {
            errors:errors.errors,
            title:title,
            id: id
        })}else{
            Category.findOne({slug:slug , _id:{'$ne':id}} , (err , foundcat) =>{
                if(err){
                    return console.log(err);
                }
               if(foundcat){
                req.flash('danger' , 'category slug exists choose another!')
                res.render('admin/edit-category' , {
                    title:title,
                    slug:null,
                    id:id
                }) 
               }else{
                Category.findOne(id , function(err , cat) {
                       if (err) return console.log(err);
                       console.log(cat);
                       cat.title = title ;
                       cat.slug = slug ;
                       cat.save(function(err) {
                           if (err)
                           return console.log(err);
                           req.flash('success' , 'category edited')
                           res.redirect('/admin/categories')
                           
                       })
                       
                   })
               
               }
           })
        }
    })
        router.get('/delete-category/:id' ,isAdmin,(req,res)=>{
            Category.findByIdAndRemove(req.params.id , function(err) {
              if (err) return console.log(err);
              req.flash('success' , 'Category Deleted')
              res.redirect('/admin/categories')
              
              
              
          })
                
            
        })
        

module.exports = router