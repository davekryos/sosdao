import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Observable, lastValueFrom } from 'rxjs';
import * as fs from 'fs';

@Injectable()
export class AppService {
  constructor() {}

  getHello(): string {
    return 'Hello World !';
  }
}
