const mongosse = require('mongoose')

const CategorySchema = new mongosse.Schema({
    title:{
        type:String,
        required:true
    },
    slug:{
        type:String
    },
})

module.exports = mongosse.model('Category' , CategorySchema);