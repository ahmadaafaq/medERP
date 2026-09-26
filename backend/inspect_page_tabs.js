const fs = require('fs');

const path = require('path');

function inspectTabs(relPath) {
  const filePath = path.resolve(__dirname, '..', relPath);
  console.log('\n================ ' + relPath + ' ================');
  const content = fs.readFileSync(filePath, 'utf8');

  // Look for tab definitions
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('activeTab ===') || line.includes('activeTab===') || line.includes('tab ===') || line.includes('setActiveTab(')) {
      if (line.trim().length < 120) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
      }
    }
  });
}

inspectTabs('frontend/app/dashboard/admin/college-master/page.tsx');
inspectTabs('frontend/app/dashboard/admin/admin-master/page.tsx');
inspectTabs('frontend/app/dashboard/admin/assessment/page.tsx');
inspectTabs('frontend/app/dashboard/admin/assessment-marks/page.tsx');
