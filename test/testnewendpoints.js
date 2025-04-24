let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let User = require('../Users');
let Movie = require('../Movies');
let Review = require('../Reviews');

chai.should();
chai.use(chaiHttp);

let login_details = {
    name: 'test3',
    username: 'email3@email.com',
    password: '123@abc'
}

let movie_details = {
    title: 'Test Movie',
    year: 2024,
    genre: 'Action',
    actors: ['Actor 1', 'Actor 2'],
    imageUrl: 'https://example.com/movie.jpg'
}

let review_details = {
    movieId: '',
    review: 'Great movie!',
    rating: 5
}

let token = '';
let movieId = '';
let reviewId = '';

describe('Test New Endpoints', () => {
    before((done) => {
        // Clean up test data
        User.deleteOne({ name: 'test3' }, function(err) {
            if (err) throw err;
        });
        Movie.deleteOne({ title: 'Test Movie' }, function(err) {
            if (err) throw err;
        });
        Review.deleteOne({ review: 'Great movie!' }, function(err) {
            if (err) throw err;
        });
        done();
    });

    after((done) => {
        // Clean up test data
        User.deleteOne({ name: 'test3' }, function(err) {
            if (err) throw err;
        });
        Movie.deleteOne({ title: 'Test Movie' }, function(err) {
            if (err) throw err;
        });
        Review.deleteOne({ review: 'Great movie!' }, function(err) {
            if (err) throw err;
        });
        done();
    });

    describe('Authentication', () => {
        it('should register and login', (done) => {
            chai.request(server)
                .post('/signup')
                .send(login_details)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.success.should.be.eql(true);
                    chai.request(server)
                        .post('/signin')
                        .send(login_details)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.have.property('token');
                            token = res.body.token;
                            done();
                        });
                });
        });
    });

    describe('Movie Operations', () => {
        it('should create a movie', (done) => {
            chai.request(server)
                .post('/movies')
                .set('Authorization', token)
                .send(movie_details)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.success.should.be.eql(true);
                    done();
                });
        });

        it('should get the created movie', (done) => {
            chai.request(server)
                .get('/movies')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.success.should.be.eql(true);
                    res.body.movies.should.be.an('array');
                    movieId = res.body.movies[0]._id;
                    done();
                });
        });

        it('should update the movie', (done) => {
            chai.request(server)
                .put(`/movies/${movieId}`)
                .set('Authorization', token)
                .send({
                    title: 'Updated Movie',
                    year: 2025,
                    genre: 'Comedy',
                    actors: ['Actor 1', 'Actor 2', 'Actor 3']
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.success.should.be.eql(true);
                    res.body.movie.title.should.be.eql('Updated Movie');
                    done();
                });
        });
    });

    describe('Review Operations', () => {
        it('should create a review', (done) => {
            chai.request(server)
                .post('/reviews')
                .set('Authorization', token)
                .send({
                    movieId: movieId,
                    review: 'Great movie!',
                    rating: 5
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.success.should.be.eql(true);
                    done();
                });
        });

        it('should get the review', (done) => {
            chai.request(server)
                .get(`/movies/${movieId}?reviews=true`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.success.should.be.eql(true);
                    res.body.movie.reviews.should.be.an('array');
                    reviewId = res.body.movie.reviews[0]._id;
                    done();
                });
        });

        it('should update the review', (done) => {
            chai.request(server)
                .put(`/reviews/${reviewId}`)
                .set('Authorization', token)
                .send({
                    review: 'Updated review text',
                    rating: 4
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.success.should.be.eql(true);
                    done();
                });
        });

        it('should delete the review', (done) => {
            chai.request(server)
                .delete(`/reviews/${reviewId}`)
                .set('Authorization', token)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.success.should.be.eql(true);
                    done();
                });
        });

        it('should delete the movie', (done) => {
            chai.request(server)
                .delete(`/movies/${movieId}`)
                .set('Authorization', token)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.success.should.be.eql(true);
                    done();
                });
        });
    });
}); 