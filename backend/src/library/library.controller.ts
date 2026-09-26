import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LibraryService } from './library.service';
import {
  CreateBookDto,
  IssueBookDto,
  SaveReadingProgressDto,
  BulkUpsertDigitalBooksDto,
  SyncDigitalBooksDto,
  QueryBooksDto,
} from './dto/library.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post('books')
  async createBook(@Tenant() tenantSlug: string, @Body() dto: CreateBookDto) {
    return this.libraryService.createBook(tenantSlug, dto);
  }

  @Public()
  @Get('books')
  async getBooks(@Tenant() tenantSlug: string, @Query() query: QueryBooksDto) {
    return this.libraryService.getBooks(tenantSlug, query);
  }

  @Public()
  @Post('books/sync')
  async syncDigitalBooks(@Tenant() tenantSlug: string, @Body() dto: SyncDigitalBooksDto) {
    return this.libraryService.syncFromSrms(
      tenantSlug,
      dto.colg || dto.colg_cd || '1',
      dto.searchvalue || '',
    );
  }

  @Public()
  @Post('books/bulk')
  async bulkUpsertBooks(@Tenant() tenantSlug: string, @Body() dto: BulkUpsertDigitalBooksDto) {
    return this.libraryService.bulkUpsertDigitalBooks(tenantSlug, dto.books || [], dto.colg_cd || '1');
  }

  @Post('circulation/issue')
  async issueBook(@Tenant() tenantSlug: string, @Body() dto: IssueBookDto) {
    return this.libraryService.issueBook(tenantSlug, dto);
  }

  @Get('circulation/:rollno')
  async getStudentCirculation(@Tenant() tenantSlug: string, @Param('rollno') rollno: string) {
    return this.libraryService.getStudentCirculation(tenantSlug, rollno);
  }

  @Get('progress')
  async getReadingProgressAll(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
  ) {
    const userId = user?.sub || user?.id || user?.usr_id || user?.emp_id || 'anonymous';
    return this.libraryService.getReadingProgressAll(tenantSlug, userId);
  }

  @Get('progress/:bookId')
  async getReadingProgressForBook(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Param('bookId') bookId: string,
  ) {
    const userId = user?.sub || user?.id || user?.usr_id || user?.emp_id || 'anonymous';
    return this.libraryService.getReadingProgressForBook(tenantSlug, userId, bookId);
  }

  @Post('progress')
  async saveReadingProgress(
    @Tenant() tenantSlug: string,
    @CurrentUser() user: any,
    @Body() dto: SaveReadingProgressDto,
  ) {
    const userId = user?.sub || user?.id || user?.usr_id || user?.emp_id || 'anonymous';
    const userRole = user?.role || 'STUDENT';
    const userName = user?.name || user?.email || '';
    return this.libraryService.saveReadingProgress(tenantSlug, userId, userRole, userName, dto);
  }
}

