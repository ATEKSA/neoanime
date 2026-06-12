const fs = require('fs');
const path = require('path');

function fix(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      fix(p);
    } else if (p.endsWith('.jsx') || p.endsWith('.js')) {
      let c = fs.readFileSync(p, 'utf8');
      let n = c.replace(/fetch\(\/api\//g, 'fetch(`/api/');
      n = n.replace(/fetch\(\/proxy\//g, 'fetch(`/proxy/');
      n = n.replace(/const KODIK_SERVER = \/api\//g, 'const KODIK_SERVER = `/api/');
      n = n.replace(/const URL = \/`;/g, "const URL = '/';");
      n = n.replace(/const URL = \//g, "const URL = '/';");
      if (c !== n) {
        fs.writeFileSync(p, n, 'utf8');
        console.log('Fixed', p);
      }
    }
  }
}
fix('src');
