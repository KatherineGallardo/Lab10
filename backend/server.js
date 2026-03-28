//create const called bearerToken 
const bearerToken = 'Bearer aaa.eyJzdWIiOiIxMjMifQ.bbb'

//create const called token to set vlaue of bearerToken but without first 7 tokens, use splice() mehtod
const token = bearerToken.slice(7);

// use split method on token to spilt out 3 parts and store first part in array called header
const header = token.split('.')[0];

//store payload, second part of split, in const 
const payload = token.split('.')[1];

//store signature, third part of split, in const 
const signature = token.split('.')[2];

//log header, payload, and signature to console
console.log("TOKEN HAS A VALUE")
console.log('Bearer Token:', bearerToken);
console.log('Header:', header);
console.log('Payload:', payload);
console.log('Signature:', signature);


// import required ES modules 
import express from 'express';
import cors from 'cors';
import {Sequelize, DataTypes} from 'sequelize';
import dotenv from 'dotenv';

//Enable dotenv to load environment variables from .env file
dotenv.config();

//define configuration constants
const DB_SCHEMA = process.env.DB_SCHEMA || 'app';
const useSsl = process.env.PGSSLMODE === 'require';

//create Express app
const app = express();

//add middleware 
app.use(cors());

//enable parsing of JSON 
app.use(express.json());

//create Sequelize instance to connect to PostgreSQL database
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
      define: {
        schema: DB_SCHEMA,
      },
    });

// Sequelize model name Puppies
const Puppy = sequelize.define('Puppy', {
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
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  schema: DB_SCHEMA,
  tableName: 'puppies',
  timestamps: false,
});

//create get route that responds with "Hello World!"
app.get('/', (req, res) => {
    res.send('Hello World!');
});

//set server port 
const PORT = process.env.PORT || 5001;

//use async startServer function to start up and authenticate server otherwise return error and exit process with code of 1 
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

    await Puppy.sync({ alter: true });
    console.log(`Puppies model synced in schema "${DB_SCHEMA}".`);

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
console.error('Error: ', err);
process.exit(1); // Exit with failure code
}
};

//call startServer function to initialize server
startServer();

// CRUD OPERATIONS FOR PUPPIES 

// GET all puppies 
app.get('/puppies', async (req, res) => {
    try {
        const puppies = await Puppy.findAll();
        res.json(puppies);
    } catch (err) {
        console.error('Error fetching puppies: ', err);
        res.status(500).json({ error: 'Failed to fetch puppies' });
    }
});

// GET a single puppy by ID
app.get('/puppies/:id', async (req, res) => {
    try {
        const puppy = await Puppy.findByPk(req.params.id);
        if (puppy) {
            res.json(puppy);
        } 
        //server cannot be reached 
        else {
            res.status(404).json({ error: 'Puppy not found' });
        }
    } catch (err) {
      // catch all 500 errors and log to console and return error message to client
        console.error('Error fetching puppy: ', err);
        res.status(500).json({ error: 'Failed to fetch puppy' });
    }
});

// CREATE a new puppy
app.post('/puppies', async (req, res) => {
    try {
        const { name, breed, age, user_id } = req.body;
        const newPuppy = await Puppy.create({ name, breed, age, user_id });
        res.status(201).json(newPuppy);
    } catch (err) {
        console.error('Error creating puppy: ', err);     
        res.status(500).json({ error: 'Failed to create puppy' });  
  } 
});   

// DELETE a puppy by ID 
app.delete('/puppies/:id', async (req, res) => {
    try {
        const deleted = await Puppy.destroy({ where: { id: req.params.id } });
        if (deleted) {
            res.json({ message: 'Puppy deleted' });
        } else {
            res.status(404).json({ error: 'Puppy not found' });
        }
    } catch (err) {
        console.error('Error deleting puppy: ', err);
        res.status(500).json({ error: 'Failed to delete puppy' });
    }
});

// Update puppy using PUT route
app.put('/puppies/:id', async (req, res) => {
    try {
        const { name, breed, age, user_id } = req.body;
        const [updated] = await Puppy.update({ name, breed, age, user_id }, { where: { id: req.params.id } });
        if (updated) {
            const updatedPuppy = await Puppy.findByPk(req.params.id);
            res.json(updatedPuppy);
        } else {
            res.status(404).json({ error: 'Puppy not found' });
        }
    } catch (err) {
        console.error('Error updating puppy: ', err);
        res.status(500).json({ error: 'Failed to update puppy' });
    }
});