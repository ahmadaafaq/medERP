import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LibraryService } from './library.service';
import { CreateBookDto, IssueBookDto, SaveReadingProgressDto } from './dto/library.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post('books')
  async createBook(@Tenant() tenantSlug: string, @Body() dto: CreateBookDto) {
    return this.libraryService.createBook(tenantSlug, dto);
  }

  @Get('books')
  async getBooks(@Tenant() tenantSlug: string, @Query('q') search?: string) {
    return this.libraryService.getBooks(tenantSlug, search);
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

