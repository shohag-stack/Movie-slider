import React, { useEffect, useState, useRef } from 'react';
import { fetchTrendingMovies, fetchMovieVideos, fetchGenres } from './api';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import YouTube from 'react-youtube';
import { gsap } from 'gsap';
import 'swiper/css';
import 'swiper/css/navigation';
import './Hero.css';

export default function Hero() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [genres, setGenres] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const swiperRef = useRef(null);
    const playerRefs = useRef([]);

    useEffect(() => {
        const getGenresAndMovies = async () => {
            try {
                const genreList = await fetchGenres();
                const genreMap = genreList.reduce((acc, genre) => {
                    acc[genre.id] = genre.name;
                    return acc;
                }, {});

                setGenres(genreMap);

                const movies = await fetchTrendingMovies();
                console.log(movies)
                const moviesWithVideos = await Promise.all(
                    movies.map(async (movie) => {
                        const videos = await fetchMovieVideos(movie.id);
                        const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');
                        return {
                            ...movie,
                            trailerKey: trailer ? trailer.key : null,
                            genreNames: movie.genre_ids.map(id => genreMap[id] || 'Unknown'),
                        };
                    })
                );
                setMovies(moviesWithVideos);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        getGenresAndMovies();
    }, []);

    const handleSlideChange = (swiper) => {
        
        if (playerRefs.current[activeIndex]) {
            playerRefs.current[activeIndex].mute();
        }
        const newIndex = swiper.activeIndex;
        const oldIndex = swiper.previousIndex;
        setActiveIndex(newIndex);
        if (playerRefs.current[newIndex]) {
            playerRefs.current[newIndex].unMute();
            playerRefs.current[newIndex].playVideo();
        }
    
        // Create a timeline for smoother sequencing
        const tl = gsap.timeline();
    
        // Exit animation for the previous slide
        tl.to(`.swiper-slide[data-swiper-slide-index="${oldIndex}"] .hero-content`, {
            opacity: 0,
            y: -50,
            duration: 0.5
        });
    
        // Enter animation for the new slide
        tl.fromTo(`.swiper-slide[data-swiper-slide-index="${newIndex}"] .hero-content`,
            { opacity: 0, y: 50, scale: 0.8 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' }
        );
    
        // Split and animate the title
        const titleElement = document.querySelector(`.swiper-slide[data-swiper-slide-index="${newIndex}"] .movie-title`);
        const titleText = titleElement.textContent;
        titleElement.innerHTML = titleText.split('').map(char => `<span class="char">${char}</span>`).join('');
        
        tl.from(`.swiper-slide[data-swiper-slide-index="${newIndex}"] .char`, {
            opacity: 0,
            y: 50,
            rotationX: -90,
            stagger: 0.02,
            duration: 0.5,
            ease: 'back.out(1)',
        }, '-=0.4');
    
        // Animate other elements if needed
        tl.fromTo(`.swiper-slide[data-swiper-slide-index="${newIndex}"] .movie-details`,
            { opacity: 0 },
            { opacity: 1, duration: 1 },
            '-=0.2'
        );
    };

    const videoOptions = {
        playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            loop: 1,
            modestbranding: 1,
            showinfo: 0,
            rel: 0,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            playlist: '',
        },
    };

    const onReady = (event, index) => {
        playerRefs.current[index] = event.target;
        if (index === activeIndex) {
            event.target.unMute();
            event.target.playVideo();
        } else {
            event.target.mute();
        }
    };

    const onStateChange = (event, index) => {
        if (event.data === YouTube.PlayerState.ENDED) {
            playerRefs.current[index].playVideo();
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="hero">
            <Swiper
                navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                }}
                modules={[Navigation]}
                spaceBetween={50}
                slidesPerView={1}
                onSlideChange={handleSlideChange}
                onSwiper={(swiper) => (swiperRef.current = swiper)}
                className="mySwiper"
                style={{ width: "100%", height: "100vh" }}
            >
                {movies.map((movie, index) => (
                    <SwiperSlide key={movie.id} data-swiper-slide-index={index}>
                        <div className="hero-slide">
                            {movie.trailerKey && (
                                <div className="hero-video-wrapper">
                                    <YouTube
                                        videoId={movie.trailerKey}
                                        opts={{
                                            ...videoOptions,
                                            playerVars: {
                                                ...videoOptions.playerVars,
                                                playlist: movie.trailerKey,
                                            },
                                        }}
                                        className="hero-video"
                                        onReady={(event) => onReady(event, index)}
                                        onStateChange={(event) => onStateChange(event, index)}
                                    />
                                </div>
                            )}
                            <div className={`hero-content ${activeIndex === index ? 'animate' : ''}`}>
                                <h1 className="movie-title">{movie.title}</h1>
                                <div className="movie-details">
                                    <span className="release-date">{new Date(movie.release_date).getFullYear()}</span>
                                    <span className="genres">{movie.genreNames.join(', ')}</span>
                                    <span className="duration">{movie.original_language}</span>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
            <div className="swiper-navigation">
                <div className="swiper-button-prev"></div>
                <div className="swiper-button-next"></div>
            </div>
        </div>
    );
}