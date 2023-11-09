require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const MONGO_URI = process.env['MONGO_URI'];
const mongoose = require('mongoose');
const dns = require('dns');
const urlParser = require('url');
const bodyParser = require('body-parser');

// MongoDB Configuration
mongoose.connect(MONGO_URI)
  .catch(err => console.error(err));
mongoose.connection
  .on('error', err => console.error(err));

const UrlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

const User = mongoose.model('UrlModel', UrlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res) {
  const url = req.body.url;
  dns.lookup(urlParser.parse(url).hostname, (err, address, family) => {
    if (!address) {
      res.json({ error: 'invalid url' })
    } else {
      User.findOne({ original_url: url })
        .then((response) => {
          if (response) {
            res.json({ original_url: response.original_url, short_url: response.short_url });
          } else {
            User.countDocuments({})
              .then((count) => {
                const newUrl = new User({ original_url: url, short_url: count + 1 });
                newUrl.save()
                  .then(() => {
                    res.json({ original_url: newUrl.original_url, short_url: newUrl.short_url });
                  })
                  .catch(err => console.error(err));
              })
              .catch((err) => console.error(err));
          }
        })
        .catch((err) => console.error(err));
    }
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const short_url = req.params.short_url;
  User.findOne({ short_url: short_url })
    .then((response) => {
      if (response) {
        res.redirect(response.original_url);
      } else {
        res.json({ error: 'invalid url' });
      }
    })
    .catch((err) => console.error(err));
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
