import * as fs from 'fs';
import * as path from 'path';

interface MenuItemManifest {
  role: 'SUPERADMIN' | 'ADMIN' | 'CLERK' | 'FACULTY' | 'WARDEN' | 'STUDENT';
  menu_key: string;
  menu_label: string;
  route_path: string;
  parent_menu_key: string | null;
  sort_order: number;
  applicable_firm_mode: 'MED' | 'NONMED' | 'BOTH';
}

const ROLES: Array<{ folder: string; role: MenuItemManifest['role'] }> = [
  { folder: 'student', role: 'STUDENT' },
  { folder: 'faculty', role: 'FACULTY' },
  { folder: 'admin', role: 'ADMIN' },
  { folder: 'clerk', role: 'CLERK' },
  { folder: 'warden', role: 'WARDEN' },
  { folder: 'superadmin', role: 'SUPERADMIN' },
];

function titleize(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bKpis\b/i, 'KPIs')
    .replace(/\bMis\b/i, 'MIS')
    .replace(/\bOtp\b/i, 'OTP')
    .replace(/\bErp\b/i, 'ERP');
}

function determineFirmMode(folderName: string, role: string): 'MED' | 'NONMED' | 'BOTH' {
  const lower = folderName.toLowerCase();
  if (lower.includes('clinical') || lower.includes('logbook') || lower.includes('patient') || lower.includes('opd') || lower.includes('hospital')) {
    return 'MED';
  }
  if (lower.includes('placement-drive') || lower.includes('workshop') || lower.includes('cad-lab')) {
    return 'NONMED';
  }
  return 'BOTH';
}

function scanRoleDirectory(
  baseDir: string,
  roleDirName: string,
  roleEnum: MenuItemManifest['role'],
): MenuItemManifest[] {
  const results: MenuItemManifest[] = [];
  const fullRolePath = path.join(baseDir, roleDirName);

  if (!fs.existsSync(fullRolePath)) {
    return results;
  }

  // Check if root of role has page.tsx
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

  function walk(currentPath: string, parentKey: string | null) {
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
        // Recursively check subdirectories
        walk(subPath, dotKey);
      } else {
        // May be a grouping folder without its own page
        walk(subPath, parentKey);
      }
    }
  }

  walk(fullRolePath, null);
  return results;
}

export function generateManifest(): MenuItemManifest[] {
  const rootDir = path.resolve(__dirname, '..');
  const frontendDashboardDir = path.join(rootDir, 'frontend', 'app', 'dashboard');

  const allItems: MenuItemManifest[] = [];

  for (const item of ROLES) {
    const roleItems = scanRoleDirectory(frontendDashboardDir, item.folder, item.role);
    allItems.push(...roleItems);
  }

  const outputPath = path.join(rootDir, 'menu-manifest.json');
  fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2), 'utf-8');
  console.log(`Successfully generated ${allItems.length} menu items into ${outputPath}`);

  return allItems;
}

// Execute when run as script
if (require.main === module) {
  generateManifest();
}
