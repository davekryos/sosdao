import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FundModule } from './funds/fund.module';
import { DonationsModule } from './donations/donations.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NftsModule } from './nfts/nfts.module';

@Module({
  imports: [ScheduleModule.forRoot(), FundModule, DonationsModule, NftsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
