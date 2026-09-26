const fs = require('fs');
const path = require('path');

function inspectCategories(relPath) {
  const content = fs.readFileSync(path.resolve(__dirname, '..', relPath), 'utf8');
  console.log('\n================ ' + relPath + ' ================');
  
  // Search for category definitions
  const lines = content.split('\n');
  let capturing = false;
  let captured = [];
  lines.forEach((l, i) => {
    if (l.includes('const categories') || l.includes('const SUB_CATEGORIES') || l.includes('const tabs') || l.includes('const subCategories')) {
      capturing = true;
    }
    if (capturing) {
      captured.push(l);
      if (l.includes('];')) {
        capturing = false;
        console.log(captured.join('\n'));
        captured = [];
      }
    }
  });

  // Also check assessment tabs
  const tabButtons = [];
  lines.forEach((l, i) => {
    if (l.includes('setActiveTab(')) {
      tabButtons.push(`Line ${i+1}: ${l.trim()}`);
    }
  });
  if (tabButtons.length > 0 && captured.length === 0) {
    console.log('Tab button switches:');
    tabButtons.slice(0, 15).forEach(b => console.log('  ' + b));
  }
}

inspectCategories('frontend/app/dashboard/admin/college-master/page.tsx');
inspectCategories('frontend/app/dashboard/admin/admin-master/page.tsx');
inspectCategories('frontend/app/dashboard/admin/assessment/page.tsx');
inspectCategories('frontend/app/dashboard/admin/assessment-marks/page.tsx');
