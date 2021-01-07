require('dotenv').config();
const isUrl = require("is-valid-http-url");
const {nanoid} = require('nanoid');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URI,{ useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open', () => console.log('DB connected'));

const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

const urlSchema = new mongoose.Schema({
  original_url: {type: String, required: true},
  short_url: String
});

let Link = mongoose.model('Link', urlSchema);
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

app.post("/api/shorturl/new", (req,res) => {
  let inputUrl = req.body.url;
  if (isUrl(inputUrl)) {
    Link.find({
      original_url: inputUrl
    }, (err, data) => {
      if (err) {
        console.log(err)
      } else {
        if (data.length > 0) {
          res.json({
            original_url: data['0'].original_url,
            short_url: data['0'].short_url
          });
        } else {
          let newUrl = new Link({
            original_url: inputUrl,
            short_url: nanoid(7)
          })
          .save((err, data) => {
            if (err) {
              console.log(err)
            }
            res.json({
              original_url: data['original_url'],
              short_url: data['short_url']
            });
          })
        }
      }
    })
  } else {
    res.json({
      error: 'invalid url'
    })
  }
})

app.get('/api/shorturl/:id', (req, res) => {
  Link.find({short_url: req.params.id}, (err, data) => {
    if (err) {
      console.log(err)
    } else {
      if (data.length > 0) {
        res.redirect(data['0'].original_url)
      } else {
        res.json({
          error: "No short URL found for the given input"
        });
      }
    }
  })
})

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
