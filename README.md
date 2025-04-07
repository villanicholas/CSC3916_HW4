# CSC3916_HW4 - Movie API with Reviews

## Description
This is a RESTful API for managing movies and their reviews. The API supports CRUD operations for movies and allows authenticated users to post reviews. It also includes Google Analytics integration for tracking review activities.

## Features
- User authentication using JWT
- Movie management (CRUD operations)
- Movie reviews with ratings
- Review aggregation with movies
- Google Analytics integration for tracking review activities

## Installation
1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env` file with the following variables:
```
DB=<your_mongodb_connection_string>
SECRET_KEY=<your_jwt_secret>
GA_KEY=<your_google_analytics_tracking_id>
```

## API Endpoints

### Authentication
- POST `/signup` - Create a new user account
- POST `/signin` - Sign in and receive JWT token

### Movies
- GET `/movies` - Get all movies
- GET `/movies?reviews=true` - Get all movies with their reviews
- GET `/movies/:id` - Get a specific movie
- GET `/movies/:id?reviews=true` - Get a specific movie with its reviews
- POST `/movies` - Create a new movie (requires authentication)

### Reviews
- POST `/reviews` - Create a new review (requires authentication)
  - Required fields:
    - movieId: ID of the movie being reviewed
    - review: Text review
    - rating: Number between 0 and 5

## Movie Schema
```javascript
{
    title: String (required),
    year: Number (required),
    genre: String (required),
    actors: [String] (required),
    imageUrl: String
}
```

## Review Schema
```javascript
{
    movieId: ObjectId (required, references Movie),
    username: String (required),
    review: String (required),
    rating: Number (required, 0-5),
    createdAt: Date,
    updatedAt: Date
}
```

## Analytics
The API integrates with Google Analytics to track movie review activities:
- Custom Dimension: Movie Name
- Custom Metric: Review Count
- Event tracking for each review submission

## Testing
Run the test suite:
```bash
npm test
```

## Deployment
The API can be deployed to Heroku or any other platform that supports Node.js applications.

## Environment Variables
- `DB`: MongoDB connection string
- `SECRET_KEY`: JWT secret key
- `GA_KEY`: Google Analytics tracking ID
- `PORT`: Server port (defaults to 8080)

## Postman Collection
Import the [Postman Collection](link-to-your-postman-collection) to test the API endpoints.

## License
MIT
