import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { Fund } from './models/fund.model';
import { FundService } from './fund.service';

@Controller('funds')
export class FundController {
  constructor(private readonly fundService: FundService) {}

  @Get()
  getFunds(@Query('registry') registry: string): Fund[] {
    return this.fundService.getFunds({ registry });
  }

  @Post()
  addFund(@Body() newFund: Fund): Fund[] {
    return this.fundService.addFund(newFund);
  }
}
