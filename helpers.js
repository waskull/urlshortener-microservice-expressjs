
const dns = require('dns');
const URL = require("url").URL;

const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

function checkURL(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, (err, address, family) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = { isValidUrl, checkURL };