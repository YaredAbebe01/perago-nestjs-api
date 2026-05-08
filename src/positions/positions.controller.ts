import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { PositionsService } from './positions.service';

@Controller('api/positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get()
  findAll(
    @Query('includeChildren') includeChildren?: string,
    @Query('rootOnly') rootOnly?: string,
  ) {
    return this.positionsService.findAll({
      includeChildren: includeChildren === 'true',
      rootOnly: rootOnly === 'true',
    });
  }

  @Get('tree')
  findTree() {
    return this.positionsService.findTree();
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('includeChildren') includeChildren?: string,
  ) {
    return this.positionsService.findOne(id, includeChildren === 'true');
  }

  @Get(':id/children')
  findChildren(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.positionsService.findChildren(id);
  }

  @Post()
  create(@Body() payload: CreatePositionDto) {
    return this.positionsService.create(payload);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() payload: UpdatePositionDto,
  ) {
    return this.positionsService.update(id, payload);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.positionsService.remove(id);
  }
}
