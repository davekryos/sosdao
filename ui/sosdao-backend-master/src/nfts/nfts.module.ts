import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NftsController } from './nfts.controller';
import { NftsService } from './nfts.service';
import { FsService } from '../common/fs.service';

@Module({
  imports: [HttpModule],
  controllers: [NftsController],
  providers: [NftsService, FsService],
})
export class NftsModule {
  constructor(private readonly service: NftsService) {}
}
