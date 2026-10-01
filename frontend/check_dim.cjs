const sharp = require('sharp');
sharp('public/logo_pwa.png').metadata().then(metadata => {
  console.log(`width: ${metadata.width}, height: ${metadata.height}`);
}).catch(console.error);