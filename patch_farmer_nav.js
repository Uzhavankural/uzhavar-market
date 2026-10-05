const fs = require('fs');
let code = fs.readFileSync('components/FarmerBottomNav.js', 'utf8');

code = code.replace(
  /{ name: 'Home', href: '\/farmer', icon: '🏠' }/,
  `{ name: 'Home', href: '/', icon: '🏠' }`
);

fs.writeFileSync('components/FarmerBottomNav.js', code);
console.log('Patched FarmerBottomNav');
