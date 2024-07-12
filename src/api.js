const API_KEY = process.env.NEXT_PUBLIC_API_KEY; // Replace with your actual API key
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export const fetchTrendingMovies = async () => {
    const response = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
    const data = await response.json();
    return data.results;
};

export const fetchMovieVideos = async (movieId) => {
    const response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`);
    const data = await response.json();
    return data.results;
};

export const fetchGenres = async () => {
    const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    const data = await response.json();
    return data.genres;
};