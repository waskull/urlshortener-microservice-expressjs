require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { isValidUrl, checkURL } = require('./helpers');
const { neon } = require('@neondatabase/serverless');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/index.html');
});

app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url;
  try {
    const hostname = new URL(url).hostname;
    if (!isValidUrl(url) || await !checkURL(hostname)) { console.log("url no valida"); return res.json({ error: 'invalid url' }); }
    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`select * from public.url where url = ${url}`;
    const result = response[0];
    if (result) {
      console.log("Url ya existe");
      res.json({ original_url: result.url, short_url: result.id });
    }
    else {
      const resp = await sql`insert into public.url (url) values (${url}) returning id`;
      res.json({ original_url: url, short_url: resp[0].id });
    }
  }
  catch (e) {
    console.log(e);
    return res.json({ error: 'invalid url' });
  }


});

app.get('/api/shorturl/:url', async (req, res) => {
  const stringURL = req.params.url;
  const id = parseInt(stringURL, 10);
  if (isNaN(id) || String(id) !== stringURL) { return res.json({ error: 'invalid url' }); }
  const shortURL = parseInt(stringURL);
  const sql = neon(`${process.env.DATABASE_URL}`);
  const response = await sql`select * from public.url where id = ${shortURL}`;
  const result = response[0];
  if (!result) return res.json({ error: 'invalid url' });
  res.redirect(result.url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
