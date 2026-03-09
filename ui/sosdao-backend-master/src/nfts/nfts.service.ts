import { Injectable } from '@nestjs/common';
import { Nft } from './models/nft.model';
import { FsService } from '../common/fs.service';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ethers } from 'ethers';
import * as RegistryABI from '../abis/Registry.json';
import * as MintABI from '../abis/Mint.json';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as R from 'ramda';
import { NftFilter } from './models/nft-filter.model';

@Injectable()
export class NftsService {
  constructor(
    private readonly fsService: FsService,
    private readonly httpService: HttpService,
  ) {}

  private filePath = 'src/data/nfts.json';
  private readonly providerUrl = 'https://rpc.eth.testedge2.haqq.network';
  private readonly baseUri = 'https://explorer.testedge2.haqq.network';
  private readonly provider = new ethers.JsonRpcProvider(this.providerUrl);
  private readonly genesisBlock = 8136007;
  private fromBlock = this.genesisBlock;
  private toBlock = 'latest';
  private lastLogBlockNumber = 0;

  getNfts(filter?: NftFilter): Nft[] {
    try {
      const nfts: Nft[] = this.fsService.readData(this.filePath);
      if (filter == undefined) return nfts;

      const filterKeys = Object.keys(filter);
      const filteredNfts = nfts.filter((nft) => {
        return filterKeys.every((key) => {
          return filter[key] !== undefined
            ? nft[key].toLowerCase() === filter[key].toLowerCase()
            : true;
        });
      });
      return filteredNfts;
    } catch (error) {
      return [];
    }
  }

  addNfts(newNfts: Nft | Nft[]): Nft[] {
    let nfts = this.getNfts();
    const customComparator = (d1, d2) =>
      d1.registry === d2.registry &&
      d1.timestamp === d2.timestamp &&
      d1.tokenId === d2.tokenId;
    const newValues = Array.isArray(newNfts) ? newNfts : [newNfts];
    nfts = R.unionWith(customComparator, nfts, newValues);
    nfts = R.sortBy(R.compose(Number, R.prop('tokenId')))(nfts);
    this.fsService.writeData(this.filePath, nfts);
    return this.getNfts();
  }

  @Cron('22,52 * * * * *')
  async syncNfts(): Promise<any> {
    const registryContract = new ethers.Contract(
      process.env.REGISTRY_CONTRACT_ADDRESS,
      RegistryABI.abi,
      this.provider,
    );
    const contractAddress = await registryContract.get(
      ethers.encodeBytes32String('MINT'),
    );
    const topic0 = ethers.id('Transfer(address,address,uint256)');
    console.log('N from:', this.fromBlock);
    console.log('N to  : latest');
    let url = `${this.baseUri}/api?module=logs&action=getLogs&fromBlock=${this.fromBlock}&toBlock=${this.toBlock}&address=${contractAddress}&topic0=${topic0}`;
    const resp = this.httpService.get(url);
    const ret = await lastValueFrom(resp);
    const logArray = ret.data.result;

    const iface = new ethers.Interface(MintABI.abi);

    const nfts = logArray.map((logData: any) => {
      //filter null topic items. Bc they will cause parse error.
      const filteredTopics = logData.topics.filter((topic) => topic !== null);
      const parsedLog = iface.parseLog({ ...logData, topics: filteredTopics });

      const nft = {
        blocknumber: parseInt(logData.blockNumber),
        timestamp: parseInt(logData.timeStamp),
        txHash: logData.transactionHash,
        registry: process.env.REGISTRY_CONTRACT_ADDRESS,
      };
      parsedLog.args.forEach((arg, index) => {
        const input = parsedLog.fragment.inputs[index];
        nft[input.name] = input.type == 'uint256' ? arg.toString() : arg; //if it is BigInt, convert to string
      });

      return nft;
    });

    console.log('N', nfts);
    this.addNfts(nfts);

    const tempLastLogBlockNumber =
      logArray.length > 0
        ? parseInt(logArray[logArray.length - 1].blockNumber)
        : this.lastLogBlockNumber;
    if (this.lastLogBlockNumber !== tempLastLogBlockNumber) {
      this.fromBlock = tempLastLogBlockNumber + 1;
      this.lastLogBlockNumber = tempLastLogBlockNumber;
      console.log('N lastLogBlockNumber :', tempLastLogBlockNumber);
    }

    return nfts;
  }
}
