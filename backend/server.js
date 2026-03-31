//Took out items related to Lab 9
//Added more error handling and logging to server.js for better debugging
// import required ES modules
//changed how API routes were written, so that they are all under /api/puppies instead of /puppies
import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// enable dotenv to load environment variables from .env file
dotenv.config();

// define configuration constants
const DB_SCHEMA = process.env.DB_SCHEMA || 'app';
const useSsl = process.env.PGSSLMODE === 'require';

// define Asgardeo org name from env or default
const ASGARDEO_ORG = process.env.ASGARDEO_ORG || 'katherinegallardo';

// create JWKS endpoint URL to verify JWT tokens from Asgardeo
const JWKS = createRemoteJWKSet(
  new URL(`https://api.asgardeo.io/t/${ASGARDEO_ORG}/oauth2/jwks`)
);

// create Express app
const app = express();

// add middleware
app.use(cors());
app.use(express.json());

// create Sequelize instance to connect to PostgreSQL database
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      define: {
        schema: DB_SCHEMA,
      },
    })
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      dialectOptions: useSsl
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : undefined,
      define: {
        schema: DB_SCHEMA,
      },
    });

// Sequelize model name Puppy
const Puppy = sequelize.define(
  'Puppy',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    breed: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    schema: DB_SCHEMA,
    tableName: 'puppies',
    timestamps: false,
  }
);

// create get route that responds with "Hello World!"
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// add health check route to test whether server is running - good for checking 
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// create middleware to verify JWT token for protected routes
const verifyToken = async (req, res, next) => {
  const authHeader = (req.headers.authorization || '').trim();

  // check whether authorization header exists and starts with Bearer
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing authorization',
      detail: 'Send Authorization: Bearer <access_token>',
    });
  }

  // get the token part after Bearer
  const token = authHeader.slice(7).trim();

  // check whether token looks like a JWT with 3 parts - make sure to make good error messages 
  if (token.split('.').length !== 3) {
    return res.status(401).json({
      error: 'Access token is not a JWT',
    });
  }

  try {
    // verify JWT token using Asgardeo JWKS
    const { payload } = await jwtVerify(token, JWKS);

    // store logged-in user's subject in req.userId
    req.userId = payload.sub;

    console.log('Verified user:', req.userId);
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({
      error: 'Invalid or expired token',
      detail: err.message,
    });
  }
};

// GET all puppies for the authenticated user
//added order 
app.get('/api/puppies', verifyToken, async (req, res) => {
  try {
    const puppies = await Puppy.findAll({
      where: { user_id: req.userId },
      order: [['id', 'ASC']],
    });

    console.log('Authenticated user:', req.userId);
    console.log('Puppies found:', puppies.length);

    res.json(puppies);
  } catch (err) {
    console.error('Error fetching puppies:', err);
    res.status(500).json({ error: 'Failed to fetch puppies', detail: err.message });
  }
});

// GET one puppy by id only if it belongs to the authenticated user
app.get('/api/puppies/:id', verifyToken, async (req, res) => {
  try {
    const puppy = await Puppy.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId,
      },
    });

    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found' });
    }

    res.json(puppy);
  } catch (err) {
    console.error('Error fetching puppy:', err);
    res.status(500).json({ error: 'Failed to fetch puppy', detail: err.message });
  }
});

// CREATE a new puppy for the authenticated user
app.post('/api/puppies', verifyToken, async (req, res) => {
  try {
    const { name, breed, age } = req.body;

    if (!name || !breed || age === undefined || age === null || age === '') {
      return res.status(400).json({ error: 'Name, breed, and age are required' });
    }

    const newPuppy = await Puppy.create({
      name,
      breed,
      age,
      user_id: req.userId,
    });

    res.status(201).json(newPuppy);
  } catch (err) {
    console.error('Error creating puppy:', err);
    res.status(500).json({ error: 'Failed to create puppy', detail: err.message });
  }
});

// UPDATE a puppy only if it belongs to the authenticated user
app.put('/api/puppies/:id', verifyToken, async (req, res) => {
  try {
    const { name, breed, age } = req.body;

    if (!name || !breed || age === undefined || age === null || age === '') {
      return res.status(400).json({ error: 'Name, breed, and age are required' });
    }

    const puppy = await Puppy.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId,
      },
    });

    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found' });
    }

    await puppy.update({ name, breed, age });
    res.json(puppy);
  } catch (err) {
    console.error('Error updating puppy:', err);
    res.status(500).json({ error: 'Failed to update puppy', detail: err.message });
  }
});

// DELETE a puppy only if it belongs to the authenticated user
app.delete('/api/puppies/:id', verifyToken, async (req, res) => {
  try {
    const puppy = await Puppy.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId,
      },
    });

    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found' });
    }

    await puppy.destroy();
    res.json({ message: 'Puppy deleted' });
  } catch (err) {
    console.error('Error deleting puppy:', err);
    res.status(500).json({ error: 'Failed to delete puppy', detail: err.message });
  }
});

// set server port
const PORT = process.env.PORT || 5001;

// use async startServer function to start up and authenticate server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    await Puppy.sync();
    console.log(`Puppy model ready in schema "${DB_SCHEMA}".`);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

// call startServer function to initialize server
startServer();

// add error handling middleware for unexpected server errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});