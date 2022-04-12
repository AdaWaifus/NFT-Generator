# NFT-Generator

This is a tool for creating, evaluating and uploading nft images.

## Usage

- `npm install`
- `npm start`

## Configuration

This NFT-Generator was build to support multiple projects with multiple collections. This is the reason why there can be multiple config files.

### config.json

The `config.json` is located in the root folder. This config is shared accross all projects:

- `projectsGlob` The glob to identify where the project folders are located.
- `nftStorageApiKey` The api key used to upload the nft images.

### projects/{YourProjectName}/{YourCollectionName}.json

A project can have multiple collections.
This Is the collection specific configuration.

```ts
interface RawConfigFile {
  name: string; // name of your project
  amount: number; // amount of nfts to generate
  assets: {
    outputPath: string; // output path of image files
    inputPath: string; // path of the directory which holds the folder with the input images
    order: string[]; // the layering order of the input images. e.g.: ["Background", "Skin", "Mouth"]
    outputSize?: Size; // output size of the nft image (Default: original size)
    fileExtensions?: string[]; // array of supported input image extensions (Default: ['png', 'jpg', 'jpeg'])
    restrictions?: Record<string, RestrictionItem[]>; // restrictions which apply for each image
  };
  schema?: {
    outputPath: string; // output path of json files
    attributesKey: string; // the field name of the attributes field of the output json
    format: {
      name: string; // the name field of the output json
      [key: string]: unknown; // any other key - value pair allowed here
    };
  };
  rarityCollection?: {
    outputPath: string; // the output path of the rarity collection json file (if not present rarity collection won't run)
  };
}
```

Any field which is in the root scope of the json can be used as variable inside the rest of the config.
You can also add custom fields into the root scope to define your own variables.
Additionally there are two "special" variables called `index` and `totalIndex`.

- `index` is the current iteration index of the current collection
- `totalIndex` is the current iteration index of all collections (is same as `index` if you run only one collection)

You can also write pure javascript to maximize customization.

This config:

```json
{
  "name": "NFT-Project-XY",
  "amount": 1,
  "exectionDate": "{Date.now()}",
  "assets": {
    "outputPath": "./Output/{name}/image/image {index +1} of {amount} - #{exectionDate}.png",
    "inputPath": "./Input/{name}"
  }
}
```

Will evaluate to:

```js
{
  "name": "NFT-Project-XY",
  "amount": 1,
  "exectionDate": "1649725612780",
  "assets": {
    "outputPath": "./Output/NFT-Project-XY/image/image 1 of 1 - #1649725612780.png",
    "inputPath": "./Input/NFT-Project-XY"
  }
}
```

#### Image restrictions

You can add image restrictions to your layers with the `restrictions` option.

```js
{
  "restrictions": {
    // a object with keys which must match one of the foldernames provided in the order option
    "Background": [
      // here starts the restrictions of the "background" layer
      {
        "matches": ["*transparent*"], // if the background image name matches this set of globs...
        // ...all of the following restrictions apply to the following layers:
        "choose": {
          "Skin": ["hairy*", "soft*"], // the Skin layer will act like only images which matches those globs are available
          "Mouth": ["open*"] // the Mouth layer will act like only images which matches those globs are available
          // not specified layers have no restrictions - you can also use '["*"]' to remove all restrictions explicitely on following layers.
        }
      }
    ]
  }
}
```
