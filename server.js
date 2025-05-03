/*
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */

require('dotenv').config();

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');
var crypto = require('crypto');
var request = require('request-promise');
var path = require('path');

// Verify environment variables
const requiredEnvVars = ['SECRET_KEY', 'DB'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`${envVar} environment variable is not set`);
        process.exit(1);
    }
}

var app = express();

// Configure CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files BEFORE any other middleware
app.use(express.static(path.join(__dirname, 'public')));

// Handle SPA routing
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Initialize passport
app.use(passport.initialize());

// API Routes
var apiRouter = express.Router();

// API middleware
apiRouter.use((req, res, next) => {
    res.header('Content-Type', 'application/json');
    next();
});

// API endpoints
apiRouter.get('/status', function(req, res) {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Mount API router
app.use('/api', apiRouter);

const GA_TRACKING_ID = process.env.GA_KEY;

// Google Analytics tracking function
async function trackEvent(movieName, genre, path) {
    const options = {
        method: 'POST',
        uri: 'https://www.google-analytics.com/collect',
        qs: {
            v: '1',
            tid: GA_TRACKING_ID,
            cid: crypto.randomBytes(16).toString('hex'),
            t: 'event',
            ec: genre,
            ea: path,
            el: 'API Request for Movie Review',
            ev: '1',
            cd1: movieName,
            cm1: '1'
        }
    };

    try {
        await request(options);
    } catch (error) {
        console.error('Error tracking analytics:', error);
    }
}

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

// Movies endpoints
apiRouter.route('/movies')
    .get(authJwtController.isAuthenticated, function (req, res) {
        if (req.query.reviews === 'true') {
            Movie.aggregate([
                {
                    $lookup: {
                        from: 'reviews',
                        localField: '_id',
                        foreignField: 'movieId',
                        as: 'movieReviews'
                    }
                },
                {
                    $addFields: {
                        avgRating: { $avg: '$movieReviews.rating' }
                    }
                },
                {
                    $sort: { avgRating: -1 }
                }
            ]).exec(function (err, movies) {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error getting movies with reviews.' });
                }
                res.json({ success: true, movies: movies });
            });
        } else {
            Movie.find(function (err, movies) {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error getting movies.' });
                }
                res.json({ success: true, movies: movies });
            });
        }
    })
    .post(authJwtController.isAuthenticated, function (req, res) {
        // Validate required fields
        if (!req.body.title || !req.body.releaseDate || !req.body.genre || !req.body.actors) {
            return res.json({ success: false, message: 'Please provide all required fields.' });
        }

        // Validate actors array
        if (!Array.isArray(req.body.actors) || req.body.actors.length === 0) {
            return res.json({ success: false, message: 'Actors must be a non-empty array.' });
        }

        // Validate each actor has required fields
        for (let actor of req.body.actors) {
            if (!actor.name || !actor.characterName) {
                return res.json({ success: false, message: 'Each actor must have a name and characterName.' });
            }
        }

        var movie = new Movie();
        movie.title = req.body.title;
        movie.releaseDate = req.body.releaseDate;
        movie.genre = req.body.genre;
        movie.actors = req.body.actors;
        movie.imageUrl = req.body.imageUrl;

        movie.save(function (err) {
            if (err) {
                // Handle validation errors
                if (err.name === 'ValidationError') {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Validation error',
                        errors: Object.keys(err.errors).map(key => ({
                            field: key,
                            message: err.errors[key].message
                        }))
                    });
                }
                return res.json({ success: false, message: 'Error saving movie.' });
            }
            res.json({ success: true, message: 'Movie created!', movie: movie });
        });
    });

apiRouter.route('/movies/:id')
    .get(authJwtController.isAuthenticated, function (req, res) {
        if (req.query.reviews === 'true') {
            Movie.aggregate([
                {
                    $match: { _id: mongoose.Types.ObjectId(req.params.id) }
                },
                {
                    $lookup: {
                        from: 'reviews',
                        localField: '_id',
                        foreignField: 'movieId',
                        as: 'movieReviews'
                    }
                },
                {
                    $addFields: {
                        avgRating: { $avg: '$movieReviews.rating' }
                    }
                }
            ]).exec(function (err, movie) {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error getting movie with reviews.' });
                }
                if (!movie || movie.length === 0) {
                    return res.status(404).json({ success: false, message: 'Movie not found.' });
                }
                res.json({ success: true, movie: movie[0] });
            });
        } else {
            Movie.findById(req.params.id, function (err, movie) {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error getting movie.' });
                }
                if (!movie) {
                    return res.status(404).json({ success: false, message: 'Movie not found.' });
                }
                res.json({ success: true, movie: movie });
            });
        }
    })
    .put(authJwtController.isAuthenticated, function (req, res) {
        if (!req.body.title || !req.body.year || !req.body.genre || !req.body.actors) {
            return res.json({ success: false, message: 'Please provide all required fields.' });
        }

        Movie.findByIdAndUpdate(
            req.params.id,
            {
                title: req.body.title,
                year: req.body.year,
                genre: req.body.genre,
                actors: req.body.actors,
                imageUrl: req.body.imageUrl
            },
            { new: true },
            function (err, movie) {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error updating movie.' });
                }
                if (!movie) {
                    return res.status(404).json({ success: false, message: 'Movie not found.' });
                }
                res.json({ success: true, message: 'Movie updated!', movie: movie });
            }
        );
    })
    .delete(authJwtController.isAuthenticated, function (req, res) {
        Movie.findByIdAndDelete(req.params.id, function (err, movie) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error deleting movie.' });
            }
            if (!movie) {
                return res.status(404).json({ success: false, message: 'Movie not found.' });
            }
            // Also delete all reviews associated with this movie
            Review.deleteMany({ movieId: req.params.id }, function (err) {
                if (err) {
                    console.error('Error deleting associated reviews:', err);
                }
                res.json({ success: true, message: 'Movie and associated reviews deleted!' });
            });
        });
    });

// Reviews endpoints
apiRouter.route('/reviews')
    .get(authJwtController.isAuthenticated, function (req, res) {
        Review.find(function (err, reviews) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error getting reviews.' });
            }
            res.json({ success: true, reviews: reviews });
        });
    })
    .post(authJwtController.isAuthenticated, function (req, res) {
        if (!req.body.movieId || !req.body.review || !req.body.rating) {
            return res.json({ success: false, message: 'Please provide all required fields.' });
        }

        Movie.findById(req.body.movieId, function (err, movie) {
            if (err || !movie) {
                return res.status(404).json({ success: false, message: 'Movie not found.' });
            }

            var review = new Review();
            review.movieId = req.body.movieId;
            review.username = req.user.username;
            review.review = req.body.review;
            review.rating = req.body.rating;

            review.save(function (err) {
                if (err) {
                    return res.json({ success: false, message: 'Error saving review.' });
                }

                // Track the review in Google Analytics
                trackEvent(movie.title, movie.genre, '/reviews')
                    .then(() => {
                        res.json({ success: true, message: 'Review created!' });
                    })
                    .catch(() => {
                        // Still return success even if analytics fails
                        res.json({ success: true, message: 'Review created!' });
                    });
            });
        });
    });

apiRouter.route('/reviews/:id')
    .get(authJwtController.isAuthenticated, function (req, res) {
        Review.findById(req.params.id, function (err, review) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error getting review.' });
            }
            if (!review) {
                return res.status(404).json({ success: false, message: 'Review not found.' });
            }
            res.json({ success: true, review: review });
        });
    })
    .put(authJwtController.isAuthenticated, function (req, res) {
        if (!req.body.review || !req.body.rating) {
            return res.json({ success: false, message: 'Please provide all required fields.' });
        }

        Review.findById(req.params.id, function (err, review) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error finding review.' });
            }
            if (!review) {
                return res.status(404).json({ success: false, message: 'Review not found.' });
            }
            if (review.username !== req.user.username) {
                return res.status(403).json({ success: false, message: 'You can only update your own reviews.' });
            }

            review.review = req.body.review;
            review.rating = req.body.rating;

            review.save(function (err) {
                if (err) {
                    return res.json({ success: false, message: 'Error updating review.' });
                }
                res.json({ success: true, message: 'Review updated!' });
            });
        });
    })
    .delete(authJwtController.isAuthenticated, function (req, res) {
        Review.findById(req.params.id, function (err, review) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error finding review.' });
            }
            if (!review) {
                return res.status(404).json({ success: false, message: 'Review not found.' });
            }
            if (review.username !== req.user.username) {
                return res.status(403).json({ success: false, message: 'You can only delete your own reviews.' });
            }

            review.remove(function (err) {
                if (err) {
                    return res.json({ success: false, message: 'Error deleting review.' });
                }
                res.json({ success: true, message: 'Review deleted!' });
            });
        });
    });

apiRouter.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

apiRouter.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            return res.status(500).json({ success: false, msg: 'Error during authentication.' });
        }

        if (!user) {
            return res.status(401).json({ success: false, msg: 'User not found.' });
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).json({success: false, msg: 'Authentication failed. Wrong password.'});
            }
        });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something broke!' });
});

// Start server only if we're not in a test environment
if (process.env.NODE_ENV !== 'test') {
    // Print JWT configuration information
    console.log('JWT Configuration:', { 
        hasSecretKey: !!process.env.SECRET_KEY, 
        secretKeyLength: process.env.SECRET_KEY ? process.env.SECRET_KEY.length : 0 
    });

    const port = process.env.PORT || 8080;
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server is running on port ${port}`);
        console.log('Environment:', process.env.NODE_ENV || 'development');
        console.log('Database:', process.env.DB ? 'Connected' : 'Not connected');
        
        // Try to perform a simple database query to ensure connection is working
        User.countDocuments({})
            .then(count => {
                console.log(`Database connection confirmed. Found ${count} users.`);
            })
            .catch(err => {
                console.error('Database connection test failed:', err);
            });
    }).on('error', (err) => {
        console.error('Server failed to start:', err);
        process.exit(1);
    });
}

module.exports = app; // for testing


