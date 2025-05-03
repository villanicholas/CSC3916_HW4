var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define valid genres
const genres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
    'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller'
];

// Actor sub-schema
var ActorSchema = new Schema({
    name: { type: String, required: true },
    characterName: { type: String, required: true }
});

// Movie schema
var MovieSchema = new Schema({
    title: { 
        type: String, 
        required: true, 
        index: true 
    },
    releaseDate: { 
        type: Number, 
        min: [1900, 'Must be greater than 1899'], 
        max: [2100, 'Must be less than 2100'],
        required: true
    },
    genre: { 
        type: String, 
        enum: genres,
        required: true
    },
    actors: [ActorSchema],
    imageUrl: { 
        type: String,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
            },
            message: props => `${props.value} is not a valid image URL!`
        }
    }
});

// Add timestamps
MovieSchema.set('timestamps', true);

// Export the model
module.exports = mongoose.model('Movie', MovieSchema);