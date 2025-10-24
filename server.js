const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Birthday:uOzTwWeOuL67rH7V@sohail.zwgnfoj.mongodb.net/Sohail?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Movie Schema
const movieSchema = new mongoose.Schema({
  movieName: {
    type: String,
    required: true,
    trim: true
  },
  summary: {
    type: String,
    required: true
  },
  whatYouWillLike: {
    type: String,
    default: ''
  },
  soilScore: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  targetAudience: {
    type: String,
    enum: ['For Soil', 'For Prachi'],
    required: true
  },
  myLetterboxdReview: {
    type: String,
    default: ''
  },
  watched: {
    type: String,
    enum: ['watched', 'not watched'],
    default: 'not watched'
  },
  posterUrl: {
    type: String,
    default: ''
  },
  myReview: {
    type: String,
    default: ''
  },
  watchLink: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
movieSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Movie = mongoose.model('Movie', movieSchema);

// Review Schema
const reviewSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  likes: {
    type: String,
    default: ''
  },
  preferredTheme: {
    type: String,
    default: ''
  },
  bugsFound: {
    type: String,
    default: ''
  },
  improvements: {
    type: String,
    default: ''
  },
  cutenessRating: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  chorPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  overallExperience: {
    type: String,
    default: ''
  },
  wouldRecommend: {
    type: String,
    enum: ['yes', 'maybe', 'no', ''],
    default: ''
  },
  favoriteFeature: {
    type: String,
    enum: ['animations', 'design', 'interactivity', 'content', ''],
    default: ''
  },
  musicTaste: {
    type: String,
    enum: ['bollywood', 'english', 'kpop', 'mixed', ''],
    default: ''
  },
  memoryRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  designRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  surpriseReaction: {
    type: String,
    default: ''
  },
  reviewer: {
    type: String,
    default: 'Prachi'
  },
  theme: {
    type: String,
    default: 'default'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const Review = mongoose.model('Review', reviewSchema);

// ==================== MOVIE ROUTES ====================

// GET all movies with filtering and search
app.get('/api/movies', async (req, res) => {
  try {
    const { 
      search, 
      filter, 
      targetAudience, 
      watched,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { movieName: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { whatYouWillLike: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by target audience
    if (targetAudience && ['For Soil', 'For Prachi'].includes(targetAudience)) {
      query.targetAudience = targetAudience;
    }

    // Filter by watched status
    if (watched && ['watched', 'not watched'].includes(watched)) {
      query.watched = watched;
    }

    // Additional filter options
    if (filter === 'for-soil') {
      query.targetAudience = 'For Soil';
    } else if (filter === 'for-prachi') {
      query.targetAudience = 'For Prachi';
    } else if (filter === 'watched') {
      query.watched = 'watched';
    } else if (filter === 'not-watched') {
      query.watched = 'not watched';
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const movies = await Movie.find(query).sort(sortOptions);
    
    res.json({
      success: true,
      data: movies,
      count: movies.length
    });

  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching movies',
      error: error.message
    });
  }
});

// GET movie by ID
app.get('/api/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.json({
      success: true,
      data: movie
    });

  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching movie',
      error: error.message
    });
  }
});

// POST create new movie
app.post('/api/movies', async (req, res) => {
  try {
    const {
      movieName,
      summary,
      whatYouWillLike,
      soilScore,
      targetAudience,
      myLetterboxdReview,
      watched,
      posterUrl,
      myReview,
      watchLink
    } = req.body;

    // Validation
    if (!movieName || !summary || soilScore === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Movie name, summary, and soil score are required'
      });
    }

    if (soilScore < 0 || soilScore > 5) {
      return res.status(400).json({
        success: false,
        message: 'Soil score must be between 0 and 5'
      });
    }

    // Validate poster URL if provided
    if (posterUrl && posterUrl.trim() !== '' && !isValidUrl(posterUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid poster URL format'
      });
    }

    // Validate watch link URL if provided
    if (watchLink && watchLink.trim() !== '' && !isValidUrl(watchLink)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid watch link URL format'
      });
    }

    const newMovie = new Movie({
      movieName: movieName.trim(),
      summary: summary.trim(),
      whatYouWillLike: whatYouWillLike?.trim() || '',
      soilScore: parseInt(soilScore),
      targetAudience: targetAudience || 'For Soil',
      myLetterboxdReview: myLetterboxdReview?.trim() || '',
      watched: watched || 'not watched',
      posterUrl: posterUrl?.trim() || '',
      myReview: myReview?.trim() || '',
      watchLink: watchLink?.trim() || ''
    });

    const savedMovie = await newMovie.save();

    res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      data: savedMovie
    });

  } catch (error) {
    console.error('Error creating movie:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating movie',
      error: error.message
    });
  }
});

// PUT update movie
app.put('/api/movies/:id', async (req, res) => {
  try {
    const {
      movieName,
      summary,
      whatYouWillLike,
      soilScore,
      targetAudience,
      myLetterboxdReview,
      watched,
      posterUrl,
      myReview,
      watchLink
    } = req.body;

    // Validation
    if (soilScore !== undefined && (soilScore < 0 || soilScore > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Soil score must be between 0 and 5'
      });
    }

    // Validate poster URL if provided
    if (posterUrl && posterUrl.trim() !== '' && !isValidUrl(posterUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid poster URL format'
      });
    }

    // Validate watch link URL if provided
    if (watchLink && watchLink.trim() !== '' && !isValidUrl(watchLink)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid watch link URL format'
      });
    }

    const updateData = {
      ...(movieName && { movieName: movieName.trim() }),
      ...(summary && { summary: summary.trim() }),
      ...(whatYouWillLike !== undefined && { whatYouWillLike: whatYouWillLike.trim() }),
      ...(soilScore !== undefined && { soilScore: parseInt(soilScore) }),
      ...(targetAudience && { targetAudience }),
      ...(myLetterboxdReview !== undefined && { myLetterboxdReview: myLetterboxdReview.trim() }),
      ...(watched && { watched }),
      ...(posterUrl !== undefined && { posterUrl: posterUrl.trim() }),
      ...(myReview !== undefined && { myReview: myReview.trim() }),
      ...(watchLink !== undefined && { watchLink: watchLink.trim() }),
      updatedAt: Date.now()
    };

    const updatedMovie = await Movie.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedMovie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.json({
      success: true,
      message: 'Movie updated successfully',
      data: updatedMovie
    });

  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating movie',
      error: error.message
    });
  }
});

// PATCH toggle watched status
app.patch('/api/movies/:id/toggle-watched', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    movie.watched = movie.watched === 'watched' ? 'not watched' : 'watched';
    movie.updatedAt = Date.now();

    const updatedMovie = await movie.save();

    res.json({
      success: true,
      message: `Movie marked as ${updatedMovie.watched}`,
      data: updatedMovie
    });

  } catch (error) {
    console.error('Error toggling watched status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating watched status',
      error: error.message
    });
  }
});

// DELETE movie
app.delete('/api/movies/:id', async (req, res) => {
  try {
    const deletedMovie = await Movie.findByIdAndDelete(req.params.id);

    if (!deletedMovie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.json({
      success: true,
      message: 'Movie deleted successfully',
      data: deletedMovie
    });

  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting movie',
      error: error.message
    });
  }
});

// GET statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalMovies = await Movie.countDocuments();
    const forSoilCount = await Movie.countDocuments({ targetAudience: 'For Soil' });
    const forPrachiCount = await Movie.countDocuments({ targetAudience: 'For Prachi' });
    const watchedCount = await Movie.countDocuments({ watched: 'watched' });
    const notWatchedCount = await Movie.countDocuments({ watched: 'not watched' });

    // Average soil score
    const avgScoreResult = await Movie.aggregate([
      {
        $group: {
          _id: null,
          avgSoilScore: { $avg: '$soilScore' }
        }
      }
    ]);

    const avgSoilScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgSoilScore * 10) / 10 : 0;

    // Score distribution
    const scoreDistribution = await Movie.aggregate([
      {
        $group: {
          _id: '$soilScore',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalMovies,
        byAudience: {
          forSoil: forSoilCount,
          forPrachi: forPrachiCount
        },
        byWatchedStatus: {
          watched: watchedCount,
          notWatched: notWatchedCount
        },
        averageSoilScore: avgSoilScore,
        scoreDistribution
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Bulk operations
app.post('/api/movies/bulk', async (req, res) => {
  try {
    const { operation, movieIds, data } = req.body;

    if (!operation || !movieIds || !Array.isArray(movieIds)) {
      return res.status(400).json({
        success: false,
        message: 'Operation and movieIds array are required'
      });
    }

    let result;

    switch (operation) {
      case 'delete':
        result = await Movie.deleteMany({ _id: { $in: movieIds } });
        break;
      
      case 'update-watched':
        if (!data || !data.watched) {
          return res.status(400).json({
            success: false,
            message: 'Watched status is required for update operation'
          });
        }
        result = await Movie.updateMany(
          { _id: { $in: movieIds } },
          { $set: { watched: data.watched, updatedAt: Date.now() } }
        );
        break;
      
      case 'update-audience':
        if (!data || !data.targetAudience) {
          return res.status(400).json({
            success: false,
            message: 'Target audience is required for update operation'
          });
        }
        result = await Movie.updateMany(
          { _id: { $in: movieIds } },
          { $set: { targetAudience: data.targetAudience, updatedAt: Date.now() } }
        );
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid operation'
        });
    }

    res.json({
      success: true,
      message: `Bulk operation '${operation}' completed successfully`,
      data: result
    });

  } catch (error) {
    console.error('Error in bulk operation:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk operation',
      error: error.message
    });
  }
});

// ==================== REVIEW ROUTES ====================

// GET all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const { sortBy = 'submittedAt', sortOrder = 'desc' } = req.query;
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const reviews = await Review.find().sort(sortOptions);
    
    res.json({
      success: true,
      data: reviews,
      count: reviews.length
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// GET review by ID
app.get('/api/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review
    });

  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review',
      error: error.message
    });
  }
});

// POST create new review
app.post('/api/reviews', async (req, res) => {
  try {
    const {
      date,
      likes,
      preferredTheme,
      bugsFound,
      improvements,
      cutenessRating,
      chorPercentage,
      overallExperience,
      wouldRecommend,
      favoriteFeature,
      musicTaste,
      memoryRating,
      designRating,
      surpriseReaction,
      reviewer,
      theme
    } = req.body;

    // Validation
    if (!date || cutenessRating === undefined || chorPercentage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Date, cuteness rating, and chor percentage are required'
      });
    }

    const newReview = new Review({
      date,
      likes: likes || '',
      preferredTheme: preferredTheme || '',
      bugsFound: bugsFound || '',
      improvements: improvements || '',
      cutenessRating: parseInt(cutenessRating),
      chorPercentage: parseInt(chorPercentage),
      overallExperience: overallExperience || '',
      wouldRecommend: wouldRecommend || '',
      favoriteFeature: favoriteFeature || '',
      musicTaste: musicTaste || '',
      memoryRating: parseInt(memoryRating),
      designRating: parseInt(designRating),
      surpriseReaction: surpriseReaction || '',
      reviewer: reviewer || 'Prachi',
      theme: theme || 'default',
      submittedAt: new Date()
    });

    const savedReview = await newReview.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: savedReview
    });

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
});

// DELETE review
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const deletedReview = await Review.findByIdAndDelete(req.params.id);

    if (!deletedReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully',
      data: deletedReview
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
});

// DELETE all reviews
app.delete('/api/reviews', async (req, res) => {
  try {
    const result = await Review.deleteMany({});
    
    res.json({
      success: true,
      message: 'All reviews deleted successfully',
      data: result
    });

  } catch (error) {
    console.error('Error deleting all reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting all reviews',
      error: error.message
    });
  }
});

// GET reviews statistics
app.get('/api/reviews-stats', async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments();
    
    // Average ratings
    const avgRatings = await Review.aggregate([
      {
        $group: {
          _id: null,
          avgCuteness: { $avg: '$cutenessRating' },
          avgChor: { $avg: '$chorPercentage' },
          avgMemory: { $avg: '$memoryRating' },
          avgDesign: { $avg: '$designRating' }
        }
      }
    ]);

    // Recommendation distribution
    const recommendationStats = await Review.aggregate([
      {
        $group: {
          _id: '$wouldRecommend',
          count: { $sum: 1 }
        }
      }
    ]);

    // Theme preference distribution
    const themeStats = await Review.aggregate([
      {
        $group: {
          _id: '$preferredTheme',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalReviews,
        averageRatings: avgRatings.length > 0 ? {
          cuteness: Math.round(avgRatings[0].avgCuteness * 10) / 10,
          chor: Math.round(avgRatings[0].avgChor * 10) / 10,
          memory: Math.round(avgRatings[0].avgMemory * 10) / 10,
          design: Math.round(avgRatings[0].avgDesign * 10) / 10
        } : {},
        recommendationStats,
        themeStats
      }
    });

  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review statistics',
      error: error.message
    });
  }
});

// Add this route to your server.js - DELETE single review by ID
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format (basic check for MongoDB-like ID)
    if (!id || id.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format'
      });
    }

    const result = await Review.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while deleting review',
      error: error.message
    });
  }
});

// ==================== UTILITY ROUTES ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running healthy!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      movies: '/api/movies',
      reviews: '/api/reviews',
      stats: '/api/stats',
      reviewStats: '/api/reviews-stats'
    }
  });
});

// Serve frontend (if you have one)
app.get('/', (req, res) => {
  res.json({
    message: '🎬 Prachi Movie Watchlist & Review API. SERVER RUNNING HEALTHY',
    version: '1.0.0',
    endpoints: {
      movies: '/api/movies',
      reviews: '/api/reviews',
      stats: '/api/stats',
      reviewStats: '/api/reviews-stats',
      health: '/api/health'
    }
  });
});

// Utility function to validate URLs
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    requestedUrl: req.originalUrl,
    availableEndpoints: {
      movies: '/api/movies',
      reviews: '/api/reviews',
      stats: '/api/stats',
      health: '/api/health'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎥 Movies API: http://localhost:${PORT}/api/movies`);
  console.log(`📝 Reviews API: http://localhost:${PORT}/api/reviews`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
