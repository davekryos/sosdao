import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FundController } from './fund.controller';
import { FundService } from './fund.service';
import { FsService } from '../common/fs.service';

@Module({
  imports: [HttpModule],
  controllers: [FundController],
  providers: [FundService, FsService],
})
export class FundModule {
  constructor(private readonly service: FundService) {
    //this.service.listenForFundCreatedEvent();
  }
}
