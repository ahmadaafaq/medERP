import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { NotificationsModule } from './notifications/notifications.module';
import { NoticesModule } from './notices/notices.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
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
    NotificationsModule,
    NoticesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
