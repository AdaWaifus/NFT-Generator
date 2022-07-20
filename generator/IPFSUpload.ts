import fs from 'fs';
import fg from 'fast-glob';
import {basename, dirname} from 'path';
import {Config} from './Config';
import {NFTStorageUpload} from './NFTStorage';

export class IPFSUpload {
  readonly #config: Config;
  readonly #nftStorageUpload: NFTStorageUpload;

  constructor(config: Config, nftStorageUpload: NFTStorageUpload) {
    this.#config = config;
    this.#nftStorageUpload = nftStorageUpload;
  }

  async upload(): Promise<void> {
    const {schema} = this.#config;
    const schemaDirectory = dirname(schema.outputPath);
    const schemaPaths = fg.sync(`${schemaDirectory}/*`);

    for (let i = 0; i < schemaPaths.length; i++) {
      const schema = schemaPaths[i];
      console.log(`Processing: ${basename(schema)}`);

      try {
        const data = fs.readFileSync(schema, 'utf8');
        const results = /({cid::})(<((?<=\<)[^>$]*)>)/g.exec(data);
        if (results) {
          const [full, , , imagePath] = results;
          if (fs.existsSync(imagePath)) {
            const cid = await this.#nftStorageUpload.uploadFile(imagePath).catch(() => {
              console.log(`Error while uploading ${imagePath}.`);
              return '';
            });
            if (cid) {
              fs.writeFileSync(schema, data.replace(full, cid));
              console.log(`Done:`, {cid});
            }
          } else {
            console.log(`Couldn't find image ${imagePath}.`);
          }
        } else {
          console.log(`Couldn't find image path in ${schema}.`);
        }
      } catch {
        console.log(`Error while reading ${schema}.`);
      }
    }
  }
}
