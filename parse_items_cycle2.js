const fs = require('fs');
const data = JSON.parse(fs.readFileSync('E:/Github/bradyoo12/ai-dev-request-worker-17/project_items_cycle2.json', 'utf8'));
const issues = data.items.filter(i => i.content.type === 'Issue');
const ready = issues.filter(i => i.status === 'Ready' && !(i.labels || []).includes('on hold'));

console.log('\n=== CYCLE 2: Available Ready Tickets ===\n');
console.log('Ready tickets (no hold):', ready.length);
ready.slice(0, 10).forEach(t =>
  console.log('  #' + t.content.number + ' - ' + t.title)
);
