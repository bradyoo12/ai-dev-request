const fs = require('fs');
const data = JSON.parse(fs.readFileSync('E:/Github/bradyoo12/ai-dev-request-worker-17/project_items.json', 'utf8'));
const inProgress = data.items.filter(i =>
  i.content.type === 'Issue' &&
  i.status === 'In progress' &&
  (!i.labels || !i.labels.includes('on hold'))
);
console.log('In Progress tickets (no hold):', inProgress.length);
inProgress.forEach(t => console.log('  #' + t.content.number + ' - ' + t.title));
