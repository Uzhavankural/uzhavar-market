const fs = require('fs');
let code = fs.readFileSync('app/admin/page.js', 'utf8');

code = code.replace(
  /setProductMessage\(\s*'This product cannot be deleted because it already has an order\.'\s*\)/g,
  `alert('This product cannot be deleted because it already has an order.');
      setProductMessage('This product cannot be deleted because it already has an order.')`
);

code = code.replace(
  /if \(deleteError\) \{([\s\S]*?)setProductMessage\(\s*'Failed to delete product\.'\s*\)/,
  `if (deleteError) {$1alert('Failed to delete product: ' + deleteError.message);\n      setProductMessage('Failed to delete product.')`
);

fs.writeFileSync('app/admin/page.js', code);
console.log('Patched delete logic in admin/page');
