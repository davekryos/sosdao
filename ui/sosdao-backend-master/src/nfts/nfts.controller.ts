import { Controller, Get, Query } from '@nestjs/common';
import { Nft } from './models/nft.model';
import { NftsService } from './nfts.service';

@Controller('nfts')
export class NftsController {
  constructor(private readonly service: NftsService) {}

  @Get()
  getNfts(@Query('to') to: string, @Query('registry') registry: string): Nft[] {
    return this.service.getNfts({ to, registry });
  }
}
