import { Injectable } from '@nestjs/common';
import { Fund } from './models/fund.model';
import { FsService } from '../common/fs.service';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ethers } from 'ethers';
import * as RegistryABI from '../abis/Registry.json';
import { Cron } from '@nestjs/schedule';
import * as R from 'ramda';
import { FundFilter } from './models/fund-filter.model';

@Injectable()
export class FundService {
  constructor(
    private readonly fsService: FsService,
    private readonly httpService: HttpService,
  ) {}

  private filePath = 'src/data/funds.json';
  private readonly providerUrl = process.env.SOS_TEST_RPC_URL || '';
  private readonly baseUri = process.env.SOS_TEST_EXPLORER_URL || '';
  private readonly contractAddress = process.env.REGISTRY_CONTRACT_ADDRESS;
  private readonly provider = new ethers.JsonRpcProvider(this.providerUrl);
  private readonly contract = new ethers.Contract(
    this.contractAddress,
    RegistryABI.abi,
    this.provider,
  );
  private readonly genesisBlock = 8136007;
  private fromBlock = this.genesisBlock;
  private toBlock = 'latest';
  private lastLogBlockNumber = 0;

  getFunds(filter?: FundFilter): Fund[] {
    try {
      const funds: Fund[] = this.fsService.readData(this.filePath);
      if (filter == undefined) return funds;

      const filterKeys = Object.keys(filter);
      const filteredFunds = funds.filter((fund) => {
        return filterKeys.every((key) => {
          return filter[key] !== undefined
            ? fund[key].toLowerCase() === filter[key].toLowerCase()
            : true;
        });
      });
      return filteredFunds;
    } catch (error) {
      return [];
    }
  }

  addFund(newFund: Fund | Fund[]): Fund[] {
    let funds = this.getFunds();
    const customComparator = (fund1, fund2) =>
      fund1.registry === fund2.registry && fund1.id === fund2.id;
    const newValues = Array.isArray(newFund) ? newFund : [newFund];
    funds = R.unionWith(customComparator, funds, newValues);
    funds = R.sortBy(R.compose(Number, R.prop('id')))(funds);
    this.fsService.writeData(this.filePath, funds);
    return this.getFunds();
  }

  @Cron('15,45 * * * * *')
  async syncFunds(): Promise<any> {
    //console.log('--- SYNC FUNDS JOB ---');
    const topic0 = ethers.id('PoolRegistered(bytes32,address,string,string)');
    console.log('F from:', this.fromBlock);
    console.log('F to  : latest');
    let url = `${this.baseUri}/api?module=logs&action=getLogs&fromBlock=${this.fromBlock}&toBlock=${this.toBlock}&address=${this.contractAddress}&topic0=${topic0}`;
    const resp = this.httpService.get(url);
    const ret = await lastValueFrom(resp);
    const logArray = ret.data.result;

    const iface = new ethers.Interface(RegistryABI.abi);

    const funds = logArray.map((logData: any) => {
      //filter null topic items. Bc they will cause parse error.
      const filteredTopics = logData.topics.filter((topic) => topic !== null);
      const parsedLog = iface.parseLog({ ...logData, topics: filteredTopics });

      const fund = {
        blocknumber: parseInt(logData.blockNumber),
        timestamp: parseInt(logData.timeStamp),
        txHash: logData.transactionHash,
        registry: process.env.REGISTRY_CONTRACT_ADDRESS,
      };
      parsedLog.args.forEach((arg, index) => {
        const input = parsedLog.fragment.inputs[index];
        fund[input.name] = input.type == 'uint256' ? arg.toString() : arg; //if it is BigInt, convert to string
      });

      return fund;
    });

    console.log('F', funds);
    this.addFund(funds);

    const tempLastLogBlockNumber =
      logArray.length > 0
        ? parseInt(logArray[logArray.length - 1].blockNumber)
        : this.lastLogBlockNumber;
    if (this.lastLogBlockNumber !== tempLastLogBlockNumber) {
      this.fromBlock = tempLastLogBlockNumber + 1;
      this.lastLogBlockNumber = tempLastLogBlockNumber;
      console.log('F lastLogBlockNumber :', tempLastLogBlockNumber);
    }

    return funds;
  }

  async fetchFunds(): Promise<AxiosResponse<any>> {
    const baseUri = process.env.SOS_TEST_EXPLORER_URL || '';
    const topic0 =
      '0x59e2c74eec80fd2f4206c919ae2d792790f37756550629fbf38dda88b0c6a913'; //FundCreated
    const contractAddress = '0x3d332C55b98DE2eBC404F180BdF045970Ed76a7D';
    let url = `${baseUri}/api?module=logs&action=getLogs&fromBlock=${this.genesisBlock}&toBlock=latest&address=${contractAddress}&topic0=${topic0}`;
    const resp = this.httpService.get(url);
    const ret = await lastValueFrom(resp);
    const logArray = ret.data.result;

    const iface = new ethers.Interface(RegistryABI.abi);

    const funds = logArray.map((logData: any) => {
      //filter null topic items. Bc they will cause parse error.
      const filteredTopics = logData.topics.filter((topic) => topic !== null);
      const parsedLog = iface.parseLog({ ...logData, topics: filteredTopics });

      const fund = {};
      parsedLog.args.forEach((arg, index) => {
        const input = parsedLog.fragment.inputs[index];
        fund[input.name] = input.type == 'uint256' ? arg.toString() : arg; //if it is BigInt, convert to string
      });

      return fund;
    });

    console.log(funds);
    this.fsService.writeData(this.filePath, funds);
    return funds;
  }

  async listenForFundCreatedEvent(): Promise<void> {
    try {
      this.contract.on(
        'FundCreated',
        (
          id: ethers.BigNumberish,
          at: string,
          name: string,
          focus: string,
          description: string,
          requestable: boolean,
        ) => {
          console.log(
            `Fund created - ID: ${id.toString()}, Address: ${at}, Name: ${name}, Focus: ${focus}, Description: ${description}, Requestable: ${requestable}`,
          );
          this.addFund({
            id: id.toString(),
            at,
            name,
            focus,
            description,
            requestable,
          });
        },
      );
    } catch (error) {
      console.log(error);
    }
  }
}
