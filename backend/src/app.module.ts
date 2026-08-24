import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { AttendanceModule } from './attendance/attendance.module';
import { HealthModule } from './health/health.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { ExaminationModule } from './examination/examination.module';
import { FeesModule } from './fees/fees.module';
import { LibraryModule } from './library/library.module';
import { LogbookModule } from './logbook/logbook.module';
import { FilesModule } from './files/files.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CollegeMasterModule } from './college-master/college-master.module';
import { StudentMasterModule } from './student-master/student-master.module';
import { AdminMasterModule } from './admin-master/admin-master.module';
import { TimetableModule } from './timetable/timetable.module';
import { LessonModule } from './lesson/lesson.module';
import { RepositoryModule } from './repository/repository.module';
import { PlacementDriveModule } from './placement-drive/placement-drive.module';
import { NoticesModule } from './notices/notices.module';
import { CommunicationModule } from './communication/communication.module';
import { FirmsModule } from './firms/firms.module';
import { InternshipsModule } from './internships/internships.module';
import { IncubationCellModule } from './incubation-cell/incubation-cell.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantIsolationGuard } from './common/guards/tenant-isolation.guard';
import { TenantLicenseGuard } from './common/guards/tenant-license.guard';
import configuration from './config/configuration';
import { validationSchema } from './config/joi.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: validationSchema,
    }),
    DatabaseModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    AttendanceModule,
    HealthModule,
    OnboardingModule,
    ExaminationModule,
    FeesModule,
    LibraryModule,
    LogbookModule,
    FilesModule,
    AnalyticsModule,
    CollegeMasterModule,
    StudentMasterModule,
    AdminMasterModule,
    TimetableModule,
    LessonModule,
    RepositoryModule,
    PlacementDriveModule,
    NoticesModule,
    CommunicationModule,
    FirmsModule,
    InternshipsModule,
    IncubationCellModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantIsolationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantLicenseGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
