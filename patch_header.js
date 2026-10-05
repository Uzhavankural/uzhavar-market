const fs = require('fs');
let code = fs.readFileSync('app/page.js', 'utf8');

code = code.replace(
  /role === "customer"/,
  `(role === "customer" || role === "farmer")`
);

fs.writeFileSync('app/page.js', code);
console.log('Patched app/page.js Header');
