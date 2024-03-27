const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO);
const { Schema } = mongoose;

const UserSchema = new Schema({
  username: String,
});
const User = mongoose.model('User', UserSchema);

const ExerciseSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },
  description: String,
  duration: Number,
  date: Date,
});

const Exercise = mongoose.model('Exercise', ExerciseSchema);
console.log(Exercise);

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select('userId username');
  if (!users) {
    res.send('No users found');
  } else {
    res.json(users);
  }
});

app.post('/api/users', async (req, res) => {
  console.log(req.body);
  const userObject = new User({
    username: req.body.username,
  });
  try {
    const user = await userObject.save();
    console.log(user);
    res.json(user);
  } catch (e) {
    console.log(e);
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  console.log(req.body);
  const { description, duration, date } = req.body;
  try {
    const user = await User.findById(id);

    if (!user) {
      console.log('Cannot find user');
    } else {
      const exerciseObject = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date(),
      });
      const exercise = await exerciseObject.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      });
    }
  } catch (e) {
    res.json({ error: e.message });
    console.log('Error: ', e.message);
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params._id;
  const { from, to, limit } = req.query;
  try {
    const user = await User
      .findById(id)
      .select('username');
    if (!user) {
      res.json({ error: 'User not found' });
    } else {
      const exercises = await Exercise
        .find({ user_id: id })
        .select('description duration date')
        .where('date')
        .gte(from ? new Date(from) : new Date('1000-01-01'))
        .lte(to ? new Date(to) : new Date())
        .limit(limit ? parseInt(limit) : 0);
      res.json({
        _id: user._id,
        username: user.username,
        count: exercises.length,
        log: exercises,
        count: exercises.length,
      });
    }
  } catch (e) {
    res.json({ error: e.message });
  }
});

const listener = app.listen(process.env.PORT || 3003, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
