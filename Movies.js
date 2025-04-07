var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.DB);

// Movie schema
var MovieSchema = new Schema({
    title: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true },
    actors: { type: [String], required: true },
    imageUrl: { type: String }
});

// return the model
module.exports = mongoose.model('Movie', MovieSchema);