import { Controller, Get, Param, Query } from '@nestjs/common';
import { Donation } from './models/donation.model';
import { DonationsService } from './donations.service';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Get()
  getDonations(
    @Query('donor') donor: string,
    @Query('tokenAddress') asset: string,
    @Query('registry') registry: string,
  ): Donation[] {
    return this.donationsService.getDonations({ donor, asset, registry });
  }

  @Get(':id')
  getDonationsWithFundId(
    @Param('id') pool: string,
    @Query('donor') donor: string,
    @Query('tokenAddress') asset: string,
    @Query('registry') registry: string,
  ): Donation[] {
    return this.donationsService.getDonations({
      donor,
      pool,
      asset,
      registry,
    });
  }
}
