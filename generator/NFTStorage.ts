import {readFile} from 'fs/promises';
import {getType} from 'mime';
import {File, NFTStorage} from 'nft.storage';
import {basename} from 'path';

export class NFTStorageUpload {
  #client: NFTStorage;

  constructor(nftStorageApiKey: string) {
    this.#client = new NFTStorage({token: nftStorageApiKey});
  }

  async uploadFile(filepath: string) {
    const content = await readFile(filepath);
    const type = getType(filepath);

    return await this.#client.storeBlob(new File([content], basename(filepath), {type: type || undefined}));
  }
}
