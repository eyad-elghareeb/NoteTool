const fs = require('fs');
const path = require('path');

const mappings = [
  { hex: '#0d1117', tw: 'sb-bg', var: '--color-sb-bg' },
  { hex: '#161b22', tw: 'sb-surface', var: '--color-sb-surface' },
  { hex: '#1c2330', tw: 'sb-surface2', var: '--color-sb-surface2' },
  { hex: '#222a36', tw: 'sb-surface3', var: '--color-sb-surface3' },
  { hex: '#30363d', tw: 'sb-border', var: '--color-sb-border' },
  { hex: '#f0a500', tw: 'sb-accent', var: '--color-sb-accent' },
  { hex: '#e6edf3', tw: 'sb-text', var: '--color-sb-text' },
  { hex: '#8b949e', tw: 'sb-muted', var: '--color-sb-muted' },
  { hex: '#da3633', tw: 'sb-wrong', var: '--color-sb-wrong' },
  { hex: '#2ea043', tw: 'sb-correct', var: '--color-sb-correct' },
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '../src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  mappings.forEach(m => {
    // Replace in Tailwind classes: [hex] -> sb-name
    // e.g. bg-[#0d1117] -> bg-sb-bg
    const twRegex = new RegExp('\\b(bg|text|border|ring|stroke|fill)-\\[(' + m.hex + ')\\]', 'gi');
    if (twRegex.test(content)) {
      content = content.replace(twRegex, '$1-' + m.tw);
      changed = true;
    }

    // Replace in arbitrary tailwind or inline styles or other strings
    // e.g. background: "#0d1117" -> background: "var(--color-sb-bg)"
    // Avoid replacing if it's already a var
    const hexRegex = new RegExp('(?<!var\\()(' + m.hex + ')', 'gi');
    if (hexRegex.test(content)) {
      content = content.replace(hexRegex, 'var(' + m.var + ')');
      changed = true;
    }
  });

  if (changed) {
    console.log(`Updated ${file}`);
    fs.writeFileSync(file, content, 'utf8');
  }
});
