const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');

// Initialize DB connection
let mongoose = require('mongoose');
const mongoUri = process.env['MONGO_URI']
mongoose.connect(mongoUri);
const { Schema } = mongoose;
// Collections
const exerciseSchema = new Schema({
  description: String,
  duration: Number,
  date: String,
});
const userSchema = new Schema({
  username:  String, // String is shorthand for {type: String}
  count: Number,
  log: [exerciseSchema],
});

const User = mongoose.model('User', userSchema);
//

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false})); // parse post body

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  console.log(req.body.username);
  if(!req.body.username)
    return res.json({error: "username not provided in post request body!"});
  User.findOne({username: req.body.username}).exec((err, username) => {
    console.log(username);
    if(!username){
      let user = new User({username : req.body.username, count : 0, log : []});
      user.save((err, user) => res.json({username : req.body.username, _id : user._id}));
    } else 
      return res.json({error : `${username} already exists!`});
  });
});
app.get('/api/users', (req, res) => {
  User.find({}).select('_id username').exec((err, users) => res.json(users));
});
app.post('/api/users/:_id/exercises', (req, res, next) => {
  if(!req.body.description || !req.body.duration){
    const err = new Error('description or duration param missing');
    err.status = 400;
    next(err);
  }
  let date = new Date(Date.now());
  console.log(req.body.date);
  if(req.body.date)
    date = new Date(req.body.date);
  console.log(date);
  if(!date instanceof Date)
    date = new Date(Date.now());
  console.log(date);
  User.findById(req.params._id).exec((err, user) => {
    if(err)
      next(err);
    user.log.push({description : req.body.description, duration : req.body.duration, date : date.toDateString()});
    user.count = user.count + 1;
    user.save((err, data)=>{
      if(err)
        next(err);
      //delete data["__v"];
      //for(let x of data.log)
       // delete x["__v"];
      
      
      res.json(data);
    })
  })  
});

app.get('/api/users/:_id/logs', (req, res, next) => {
  let slice = {};
  console.log(req.query.limit);
  console.log(typeof req.query.limit);
  console.log(typeof req.query.limit === 'number');
  if(req.query.limit && typeof Number(req.query.limit) === 'number')
    slice = { log: { $slice: [0, Number(req.query.limit)] } };
  console.log(slice);
  let query = User.findById(req.params._id, slice).select('-__v');
  query.exec((err, user) => {
    if(err)
      next(err);
    res.json(user);
  });  
});




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
