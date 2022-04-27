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
    order: string[]; // the layering order of the input images. e.g.: ["Background", "Skin", "Mouth"] (not case sensitive)
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
  "executionDate": "{Date.now()}",
  "assets": {
    "outputPath": "./Output/{name}/image/image {index +1} of {amount} - #{executionDate}.png",
    "inputPath": "./Input/{name}"
  }
}
```

Will evaluate to:

```js
{
  "name": "NFT-Project-XY",
  "amount": 1,
  "executionDate": "1649725612780",
  "assets": {
    "outputPath": "./Output/NFT-Project-XY/image/image 1 of 1 - #1649725612780.png",
    "inputPath": "./Input/NFT-Project-XY"
  }
}
```

#### Assets order

The `order` array in the `assets` object relates to the image directories which should be included.

```js
{
  "assets": {
    "inputPath": "./Input/{name}",
    "order": ["background", "skin", "mouth"]
  }
}
```

Would include all the images of the directories:

- `./Input/{name}/background`
- `./Input/{name}/skin`
- `./Input/{name}/mouth`

**Note:** the directory names in the `order` array are **case insensitive**. It doesn't matter if you write `background` or `Background` as long as there is a folder with this name it will be picked up.

#### Image restrictions

You can add image restrictions to your layers with the `restrictions` option.

```js
{
  "restrictions": {
    // a object with keys which must match one of the foldernames provided in the order option
    "background": [
      // here starts the restrictions of the "background" layer
      {
        "matches": ["*transparent*"], // if the background image name matches this set of globs...
        // ...all of the following restrictions apply to the following layers:
        "choose": {
          "skin": ["hairy*", "soft*"], // the skin layer will act like only images which matches those globs are available
          "mouth": ["open*"] // the mouth layer will act like only images which matches those globs are available
          // not specified layers have no restrictions
        }
      }
    ]
  }
}
```

Use `["*"]` to remove all restrictions explicitly:

```js
{
  "restrictions": {
    "background": [
      {
        "matches": ["*transparent*"],
        "choose": {
          "skin": ["hairy*", "soft*"],
          "mouth": ["open*"] // mouth is restricted
        }
      }
    ],
    "skin": [
      {
        "matches": ["soft*"],
        "choose": {
          "mouth": ["*"] // mouth restriction is removed
        }
      }
    ]
  }
}
```

In the above example even though the `mouth` layer was restricted to `["open*"]`, the restriction was removed if the `skin` images matches the `soft*` glob.
Instead of removing the restriction it can also be changed to something else.

Use `null` to remove the layer from generation:

```js
{
  "restrictions": {
    "background": [
      {
        "matches": ["*transparent*"],
        "choose": {
          "skin": ["hairy*", "soft*"],
          "mouth": null
        }
      }
    ]
  }
}
```

In this example the `mouth` layer is not included in the image generation, so the final images simply won't have a `mouth` layer.

All of the field names which have to correspond to a value in the `order` array, and the glob patterns are **case insensitive**.
