const fs = require('fs');
const path = require('path');

const ROLES = [
  { folder: 'student', role: 'STUDENT' },
  { folder: 'faculty', role: 'FACULTY' },
  { folder: 'admin', role: 'ADMIN' },
  { folder: 'clerk', role: 'CLERK' },
  { folder: 'warden', role: 'WARDEN' },
  { folder: 'superadmin', role: 'SUPERADMIN' },
];

function titleize(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bKpis\b/i, 'KPIs')
    .replace(/\bMis\b/i, 'MIS')
    .replace(/\bOtp\b/i, 'OTP')
    .replace(/\bErp\b/i, 'ERP');
}

function determineFirmMode(folderName, role) {
  const lower = folderName.toLowerCase();
  if (lower.includes('clinical') || lower.includes('logbook') || lower.includes('patient') || lower.includes('opd') || lower.includes('hospital')) {
    return 'MED';
  }
  if (lower.includes('placement-drive') || lower.includes('workshop') || lower.includes('cad-lab')) {
    return 'NONMED';
  }
  return 'BOTH';
}

function scanRoleDirectory(baseDir, roleDirName, roleEnum) {
  const results = [];
  const fullRolePath = path.join(baseDir, roleDirName);

  if (!fs.existsSync(fullRolePath)) {
    return results;
  }

  if (fs.existsSync(path.join(fullRolePath, 'page.tsx'))) {
    results.push({
      role: roleEnum,
      menu_key: `${roleDirName}.dashboard`,
      menu_label: `${titleize(roleDirName)} Dashboard`,
      route_path: `/dashboard/${roleDirName}`,
      parent_menu_key: null,
      sort_order: 0,
      applicable_firm_mode: 'BOTH',
    });
  }

  let sortCounter = 10;

  function walk(currentPath, parentKey) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;

      const subPath = path.join(currentPath, entry.name);
      const relativeToRole = path.relative(fullRolePath, subPath).replace(/\\/g, '/');
      const dotKey = `${roleDirName}.${relativeToRole.replace(/\//g, '.')}`;
      const pageFile = path.join(subPath, 'page.tsx');

      if (fs.existsSync(pageFile)) {
        const parts = relativeToRole.split('/');
        const currentFolderName = parts[parts.length - 1];
        const routePath = `/dashboard/${roleDirName}/${relativeToRole}`;
        const applicableMode = determineFirmMode(currentFolderName, roleDirName);

        results.push({
          role: roleEnum,
          menu_key: dotKey,
          menu_label: titleize(currentFolderName),
          route_path: routePath,
          parent_menu_key: parentKey,
          sort_order: sortCounter,
          applicable_firm_mode: applicableMode,
        });

        sortCounter += 10;
        walk(subPath, dotKey);
      } else {
        walk(subPath, parentKey);
      }
    }
  }

  walk(fullRolePath, null);
  return results;
}

function generateManifest() {
  const rootDir = path.resolve(__dirname, '..');
  const frontendDashboardDir = path.join(rootDir, 'frontend', 'app', 'dashboard');

  const allItems = [];

  for (const item of ROLES) {
    const roleItems = scanRoleDirectory(frontendDashboardDir, item.folder, item.role);
    allItems.push(...roleItems);
  }

  const outputPath = path.join(rootDir, 'menu-manifest.json');
  fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2), 'utf-8');
  console.log(`Successfully generated ${allItems.length} menu items into ${outputPath}`);

  return allItems;
}

generateManifest();
