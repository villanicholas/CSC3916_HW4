const API_URL = window.location.origin + '/api';

// Authentication Component
function AuthForm({ onLogin }) {
    const [isLogin, setIsLogin] = React.useState(true);
    const [formData, setFormData] = React.useState({ name: '', username: '', password: '' });
    const [error, setError] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const endpoint = isLogin ? '/signin' : '/signup';
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (data.success) {
                if (isLogin && data.token) {
                    onLogin(data.token);
                } else {
                    setIsLogin(true); // Switch to login after successful signup
                }
            } else {
                setError(data.message || 'Authentication failed');
            }
        } catch (err) {
            setError('An error occurred during authentication');
            console.error('Auth error:', err);
        }
    };

    return (
        <div className="auth-form">
            <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
                {!isLogin && (
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                )}
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">
                    {isLogin ? 'Login' : 'Sign Up'}
                </button>
                <button
                    type="button"
                    className="btn btn-link"
                    onClick={() => setIsLogin(!isLogin)}
                >
                    {isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}
                </button>
            </form>
        </div>
    );
}

// Movie Card Component
function MovieCard({ movie, onClick }) {
    return (
        <div className="col-md-4 mb-4">
            <div className="card h-100" onClick={() => onClick(movie)}>
                {movie.imageUrl && (
                    <img src={movie.imageUrl} className="card-img-top" alt={movie.title} />
                )}
                <div className="card-body">
                    <h5 className="card-title">{movie.title}</h5>
                    <p className="card-text">
                        <strong>Genre:</strong> {movie.genre}<br />
                        <strong>Release Date:</strong> {movie.releaseDate}<br />
                        <strong>Rating:</strong> {movie.avgRating ? movie.avgRating.toFixed(1) : 'N/A'}
                    </p>
                </div>
            </div>
        </div>
    );
}

// Movie Detail Component
function MovieDetail({ movie, onBack }) {
    return (
        <div className="movie-detail">
            <button className="btn btn-secondary mb-3" onClick={onBack}>Back to Movies</button>
            <div className="card">
                {movie.imageUrl && (
                    <img src={movie.imageUrl} className="card-img-top" alt={movie.title} />
                )}
                <div className="card-body">
                    <h2>{movie.title}</h2>
                    <p><strong>Genre:</strong> {movie.genre}</p>
                    <p><strong>Release Date:</strong> {movie.releaseDate}</p>
                    <p><strong>Average Rating:</strong> {movie.avgRating ? movie.avgRating.toFixed(1) : 'N/A'}</p>
                    
                    <h3>Actors</h3>
                    <ul className="list-group">
                        {movie.actors.map((actor, index) => (
                            <li key={index} className="list-group-item">
                                {actor.name} as {actor.characterName}
                            </li>
                        ))}
                    </ul>

                    <h3 className="mt-4">Reviews</h3>
                    {movie.movieReviews && movie.movieReviews.length > 0 ? (
                        <div className="row">
                            {movie.movieReviews.map((review, index) => (
                                <div key={index} className="col-md-6 mb-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <h5 className="card-title">{review.username}</h5>
                                            <p className="card-text">
                                                <strong>Rating:</strong> {review.rating}<br />
                                                {review.review}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No reviews yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Main App Component
function App() {
    const [token, setToken] = React.useState(localStorage.getItem('token'));
    const [movies, setMovies] = React.useState([]);
    const [selectedMovie, setSelectedMovie] = React.useState(null);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (token) {
            fetchMovies();
        }
    }, [token]);

    const fetchMovies = async () => {
        try {
            const response = await fetch(`${API_URL}/movies?reviews=true`, {
                headers: { 'Authorization': token }
            });
            const data = await response.json();
            if (data.success) {
                setMovies(data.movies);
            } else {
                setError('Failed to fetch movies');
            }
        } catch (err) {
            setError('An error occurred while fetching movies');
        }
    };

    if (!token) {
        return <AuthForm onLogin={(newToken) => {
            setToken(newToken);
            localStorage.setItem('token', newToken);
        }} />;
    }

    if (selectedMovie) {
        return <MovieDetail movie={selectedMovie} onBack={() => setSelectedMovie(null)} />;
    }

    return (
        <div className="container mt-4">
            <h1>Top Rated Movies</h1>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="row">
                {movies.map((movie) => (
                    <MovieCard
                        key={movie._id}
                        movie={movie}
                        onClick={setSelectedMovie}
                    />
                ))}
            </div>
        </div>
    );
}

// Render the app
ReactDOM.render(<App />, document.getElementById('root')); 