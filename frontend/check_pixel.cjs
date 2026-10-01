const sharp = require('sharp');
sharp('public/logo_pwa.png')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    console.log('Top-left pixel:', data[0], data[1], data[2], data[3]);
  });