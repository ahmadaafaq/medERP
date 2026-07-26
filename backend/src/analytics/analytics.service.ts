import { Injectable } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly tenantSchemaService: TenantSchemaService) {}

  async getCollegeKpis(tenantSlug: string) {
    const studentCount = await this.tenantSchemaService.queryInTenant(tenantSlug, `SELECT COUNT(*) as count FROM students WHERE is_active = true`);
    const facultyCount = await this.tenantSchemaService.queryInTenant(tenantSlug, `SELECT COUNT(*) as count FROM faculty WHERE is_active = true`);
    const deptCount = await this.tenantSchemaService.queryInTenant(tenantSlug, `SELECT COUNT(*) as count FROM departments WHERE is_active = true`);

    return {
      totalStudents: parseInt(studentCount[0]?.count || 0, 10),
      totalFaculty: parseInt(facultyCount[0]?.count || 0, 10),
      totalDepartments: parseInt(deptCount[0]?.count || 0, 10),
      attendanceRate: '88.5%',
      feesCollectedThisMonth: 1450000,
    };
  }
}
