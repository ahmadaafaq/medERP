import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LibraryService } from './library.service';
import { CreateBookDto, IssueBookDto } from './dto/library.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

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
}
