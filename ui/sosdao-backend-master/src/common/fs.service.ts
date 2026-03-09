import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class FsService {
  constructor() {}

  readData(filePath: string): any {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  }

  writeData(filePath: string, data: any): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}
