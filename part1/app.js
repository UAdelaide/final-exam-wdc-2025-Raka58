var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
  try {
    // Connect to MySQL without specifying a database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '' // Set your MySQL root password
    });

    // Create the database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
    await connection.end();

    // Now connect to the created database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

    // Create Users table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS Users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('owner', 'walker') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Create Dogs table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS Dogs (
        dog_id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL,
        name VARCHAR(50) NOT NULL,
        size ENUM('small', 'medium', 'large') NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES Users(user_id)
      )
    `);
    // Create WalkRequests table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS WalkRequests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        dog_id INT NOT NULL,
        requested_time DATETIME NOT NULL,
        duration_minutes INT NOT NULL,
        location VARCHAR(255) NOT NULL,
        status ENUM('open', 'accepted', 'completed', 'cancelled') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id)
      )
    `);
    // Create WalkApplications table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS WalkApplications (
        application_id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        walker_id INT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
        FOREIGN KEY (walker_id) REFERENCES Users(user_id),
        CONSTRAINT unique_application UNIQUE (request_id, walker_id)
      )
    `);
    // Create WalkRatings table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS WalkRatings (
        rating_id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        walker_id INT NOT NULL,
        owner_id INT NOT NULL,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        comments TEXT,
        rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
        FOREIGN KEY (walker_id) REFERENCES Users(user_id),
        FOREIGN KEY (owner_id) REFERENCES Users(user_id),
        CONSTRAINT unique_rating_per_walk UNIQUE (request_id)
      )
    `);

    // Insert data if Users table is empty
    const [usersRows] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (usersRows[0].count === 0) {
      await db.execute(`
        INSERT INTO Users (username, email, password_hash, role)
        VALUES
        ('alice123', 'alice@example.com', 'hashed123', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
        ('carol123', 'carol@example.com', 'hashed789', 'owner'),
        ('ben21', 'ben@example.com', 'hashed111', 'walker'),
        ('emily22', 'emily@example.com', 'hashed222', 'owner')
      `);
    }
    // Insert data if Dogs table is empty
    const [dogsRows] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
    if (dogsRows[0].count === 0) {
      await db.execute(`
        INSERT INTO Dogs (owner_id, name, size)
        VALUES
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Fred', 'large'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Milly', 'small'),
        ((SELECT user_id FROM Users WHERE username = 'emily22'), 'Opal', 'medium')
      `);
    }
    // Insert data if WalkRequests table is empty
    const [walkRequestsRows] = await db.execute('SELECT COUNT(*) AS count FROM WalkRequests');
    if (walkRequestsRows[0].count === 0) {
      await db.execute(`
        INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
        VALUES
        ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Fred'), '2025-06-11 09:00:00', 70, 'Church Pl', 'completed'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Milly'), '2025-06-12 07:30:00', 35, 'Swan Park', 'cancelled'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Opal'), '2025-06-12 10:00:00', 40, 'Aston St', 'open')
      `);
    }
    // Insert data if WalkApplications table is empty
    const [walkApplicationsRows] = await db.execute('SELECT COUNT(*) AS count FROM walkApplications');
    if (walkApplicationsRows[0].count === 0) {
      await db.execute(`
        INSERT INTO WalkApplications (request_id, walker_id, status)
        VALUES
        ((SELECT request_id FROM WalkRequests wr
        JOIN Dogs d ON wr.dog_id = d.dog_id
        WHERE d.name = 'Fred' AND wr.status = completed
        LIMIT 1),
        (SELECT user_id FROM Users
        WHERE username = 'bobwalker'),
        'accepted')
      `);
    }
    // Insert data if walkRatings table is empty
    const [walkRatingsRows] = await db.execute('SELECT COUNT(*) AS count FROM walkRatings');
    if (walkRatingsRows[0].count === 0) {
      await db.execute(`
        INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating, comments)
        VALUES
        ((SELECT request_id FROM WalkRequests wr
        JOIN Dogs d ON wr.dog_id = d.dog_id
        WHERE d.name = 'Fred' AND wr.status = completed
        LIMIT 1),
        (SELECT user_id FROM Users
        WHERE username = 'alice123')
      `);
    }

    // now make the api router after db is set up
    var apiRouter = require('./routes/api')(db);
    app.use('/api', apiRouter);
  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
