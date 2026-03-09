import { Injectable, OnModuleInit } from '@nestjs/common';
import { Donation } from './models/donation.model';
import { FsService } from '../common/fs.service';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ethers } from 'ethers';
import * as RegisteryABI from '../abis/Registry.json';
import * as ERC20ABI from '../abis/ERC20.json';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as R from 'ramda';
import { DonationFilter } from './models/donation-filter.model';

@Injectable()
export class DonationsService implements OnModuleInit {
  constructor(
    private readonly fsService: FsService,
    private readonly httpService: HttpService,
  ) {}

  private filePath = 'src/data/donations.json';
  private readonly providerUrl = 'https://rpc.eth.testedge2.haqq.network';
  private readonly baseUri = 'https://explorer.testedge2.haqq.network';
  private readonly contractAddress = process.env.REGISTRY_CONTRACT_ADDRESS;
  private readonly provider = new ethers.JsonRpcProvider(this.providerUrl);
  private readonly contract = new ethers.Contract(
    this.contractAddress,
    RegisteryABI.abi,
    this.provider,
  );
  private readonly genesisBlock = 8136007;
  private fromBlock = this.genesisBlock;
  private toBlock = 'latest';
  private lastLogBlockNumber = 0;

  onModuleInit() {
    //this.listenDonations();
  }

  getDonations(filter?: DonationFilter): Donation[] {
    try {
      const donations: Donation[] = this.fsService.readData(this.filePath);
      if (filter == undefined) return donations;

      const filterKeys = Object.keys(filter);
      const filteredDonations = donations.filter((donation) => {
        return filterKeys.every((key) => {
          return filter[key] !== undefined
            ? donation[key].toLowerCase() === filter[key].toLowerCase()
            : true;
        });
      });
      return filteredDonations;
    } catch (error) {
      return [];
    }
  }

  addDonations(newDonations: Donation | Donation[]): Donation[] {
    let donations = this.getDonations();
    const customComparator = (d1: any, d2: any) =>
      d1.registry === d2.registry &&
      d1.timestamp === d2.timestamp &&
      d1.donor === d2.donor;
    const newValues = Array.isArray(newDonations)
      ? newDonations
      : [newDonations];
    donations = R.unionWith(customComparator, donations, newValues);
    //donations = R.sortBy(R.compose(Number, R.prop('donationId')))(donations);
    this.fsService.writeData(this.filePath, donations);
    return this.getDonations();
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async syncDonations(): Promise<any> {
    //console.log('--- SYNC DONATIONS JOB ---');
    const topic0 = ethers.id(
      'DonationRegistered(bytes32,address,address,uint256)',
    );
    console.log('D from:', this.fromBlock);
    console.log('D to  : latest');
    let url = `${this.baseUri}/api?module=logs&action=getLogs&fromBlock=${this.fromBlock}&toBlock=${this.toBlock}&address=${this.contractAddress}&topic0=${topic0}`;
    const resp = this.httpService.get(url);
    const ret = await lastValueFrom(resp);
    const logArray = ret.data.result;

    const iface = new ethers.Interface(RegisteryABI.abi);

    const donations = logArray.map((logData: any) => {
      //filter null topic items. Bc they will cause parse error.
      const filteredTopics = logData.topics.filter((topic) => topic !== null);
      const parsedLog = iface.parseLog({ ...logData, topics: filteredTopics });

      const donation = {
        blocknumber: parseInt(logData.blockNumber),
        timestamp: parseInt(logData.timeStamp),
        txHash: logData.transactionHash,
        registry: process.env.REGISTRY_CONTRACT_ADDRESS,
      };
      parsedLog.args.forEach((arg, index) => {
        const input = parsedLog.fragment.inputs[index];
        donation[input.name] = input.type == 'uint256' ? arg.toString() : arg; //if it is BigInt, convert to string
      });

      return donation;
    });

    console.log('D', donations);
    this.addDonations(donations);

    const tempLastLogBlockNumber =
      logArray.length > 0
        ? parseInt(logArray[logArray.length - 1].blockNumber)
        : this.lastLogBlockNumber;
    if (this.lastLogBlockNumber !== tempLastLogBlockNumber) {
      this.fromBlock = tempLastLogBlockNumber + 1;
      this.lastLogBlockNumber = tempLastLogBlockNumber;
      console.log('D lastLogBlockNumber :', tempLastLogBlockNumber);
    }

    return donations;
  }

  listenDonations() {
    try {
      const providerUrl = 'https://rpc.eth.testedge2.haqq.network';
      const provider = new ethers.JsonRpcProvider(providerUrl);
      /* const wsprovider = new ethers.WebSocketProvider(
        'wss://rpc.eth.testedge2.haqq.network',
      ); */
      /* const contract = new ethers.Contract(
        '0x1ae3A4b8e667c10AAE77b094d1F86BA17D8354AF',
        ERC20ABI,
        wsprovider,
      );
      contract.on(
        'Transfer',
        (from: string, to: string, value: ethers.BigNumberish) => {
          console.log(from);
          console.log(to);
          console.log(value);
        },
      ); */

      /* const registryContract = new ethers.Contract(
        this.contractAddress,
        RegisteryABI.abi,
        provider,
      );

      registryContract.on(
        'DonationRegistered',
        (
          pool: string,
          donor: string,
          asset: string,
          amount: ethers.BigNumberish,
        ) => {
          console.log('contract.on');
          console.log(pool);
          console.log(donor);
          console.log(asset);
          console.log(amount);
        },
      ); */
    } catch (error) {
      console.log(error);
    }
  }
}
