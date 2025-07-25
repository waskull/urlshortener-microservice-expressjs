require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
const app = express();
const port = process.env.PORT || 3000;
const U = require("url").URL;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/index.html');
});

app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url;
  try {
    const parsedUrl = new U(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return res.json({ error: 'invalid url' });
    }
    const hostname = parsedUrl.hostname;
    const esLocalhost = hostname === "localhost";
    const esDominioValido = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(hostname);
    const validUrl = esLocalhost || esDominioValido;
    if (!validUrl) return res.json({ error: 'invalid url' });
    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`select * from public.url where url = ${url}`;
    const result = response[0];
    if (result) {
      console.log("Url ya existe");
      return res.json({ original_url: result.url, short_url: result.id });
    }
    else {
      const resp = await sql`insert into public.url (url) values (${url}) returning id`;
      return res.json({ original_url: url, short_url: resp[0].id });
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
