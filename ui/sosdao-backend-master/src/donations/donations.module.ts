import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { FsService } from '../common/fs.service';

@Module({
  imports: [HttpModule],
  controllers: [DonationsController],
  providers: [DonationsService, FsService],
})
export class DonationsModule {
  constructor(private readonly service: DonationsService) {}
}
