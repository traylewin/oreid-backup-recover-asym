import * as fs from "fs";
import { ChainFactory, ChainType } from "@open-rights-exchange/chainjs";
import { ModelsCryptoAsymmetric } from "@open-rights-exchange/chainjs/dist/models";
import { toAsymEncryptedDataString } from "@open-rights-exchange/chainjs/dist/crypto/asymmetric";

let inputfileName = "input.json";
let outputfileName = "output.json";
let keysfileName = "keys.json";

function getChain(chain: string) {
  switch (chain) {
    case "eos":
      return new ChainFactory().create(ChainType.EosV2, []);
    case "ethereum":
      return new ChainFactory().create(ChainType.EthereumV1, []);
    case "algorand":
      return new ChainFactory().create(ChainType.AlgorandV1, []);
    default:
      throw new Error("Invalid chain argument passed");
  }
}

async function start() {
  const [, , chainNameArg, inputFileNameArg, keyFileNameArg, outputFileNameArg] = process.argv;
  let encryptedJson: any = [];
  let privateKeys: any = [];
  let count = 0;

  inputfileName = inputFileNameArg || inputfileName
  keysfileName = keyFileNameArg || keysfileName
  outputfileName = outputFileNameArg || outputfileName

  if (!chainNameArg) {
    console.log(
      "Please include a chain type. Example: oreid-backup-recover algorand [inputFilename.json] [keysFilename.json] [outputFilename.json]"
    );
    process.exit();
  }

  if (!fs.existsSync(inputfileName)) {
    console.log(`Cant find input file ${inputfileName}`);
    process.exit();
  }

  if (!fs.existsSync(keysfileName)) {
    console.log(`Cant find private key file ${keysfileName}`);
    process.exit();
  }

  try {
    const rawdata = fs.readFileSync(inputfileName);
    encryptedJson = JSON.parse(rawdata.toString());
    if (!(encryptedJson?.length > 0)) {
      console.log(`Input file must be a JSON array of encrypted objects`);
      process.exit();
    }
    const rawKeys = fs.readFileSync(keysfileName);
    privateKeys = JSON.parse(rawKeys.toString());
    if (!(privateKeys?.length > 0)) {
      console.log(`Keys file must be a JSON array of private keys`);
      process.exit();
    }
  } catch (error) {
    console.log(
      `Problem: Cant find backup info in ${inputfileName} or keys in ${keysfileName}.`
    );
    process.exit();
  }

  try {
    const chain = chainNameArg;
    const chainjs = getChain(chain);
    console.log(`Decrypting for ${(chain as string).toUpperCase()}...`);
    writeToFile("[", "\n", true);

    // Decrypt each encrypted blob
    await asyncForEach(encryptedJson, async (encryptedBlob: ModelsCryptoAsymmetric.AsymmetricEncryptedData | ModelsCryptoAsymmetric.AsymmetricEncryptedData[]) => {
      try {
        let decrypted;
        let decryptedPublicKey;
        let decryptedJson;
        let unwrappedDecrypted: ModelsCryptoAsymmetric.AsymmetricEncryptedData[] | ModelsCryptoAsymmetric.AsymmetricEncryptedData | undefined;
        count = count + 1;

        // blob can be an array of 'wrapped' encryptions that are unwrapped one at a time with each private key
        const encryptionLayers = Array.isArray(encryptedBlob) ? encryptedBlob.length : 1;

        // if we have a single encryption layer inside an array, remove it from the array
        if(Array.isArray(encryptedBlob) && encryptionLayers === 1) {
          encryptedBlob = encryptedBlob[0]
        }

        if (encryptionLayers === 1) {
          encryptedBlob = encryptedBlob as ModelsCryptoAsymmetric.AsymmetricEncryptedData
          decrypted = await chainjs.decryptWithPrivateKey(
            stringifyEncrypted(encryptedBlob),
            privateKeys[0]
          );
          decryptedPublicKey = encryptedBlob.publicKey;
        }

        // encrypted payload is 'wrapped' with multiple keys
        if (encryptionLayers !== 1) {
          encryptedBlob = encryptedBlob as ModelsCryptoAsymmetric.AsymmetricEncryptedData[]
          // more then one encryption layer and enough keys to unwrap them all...
          if (encryptionLayers === privateKeys.length) {
            // unwrap all layers to get to final value
            ;({ decrypted } = await chainjs.decryptWithPrivateKeys(
              stringifyEncrypted(encryptedBlob),
              privateKeys
            ));
            decryptedPublicKey = encryptedBlob[0].publicKey;
          } else {
            // we only have some keys - unwrap only some of the layers
            const { remaining } = await chainjs.decryptWithPrivateKeys(
              stringifyEncrypted(encryptedBlob),
              privateKeys
            );
            unwrappedDecrypted = remaining
          }
        }

        if (unwrappedDecrypted) {
          // decrypted result is part of a wrapped payload,
          decryptedJson = unwrappedDecrypted
        } else {
          // decrypted results is final value - include publicKey for identification
          decryptedJson = {
            publicKey: decryptedPublicKey,
            finalDecrypted: decrypted,
          };
        }
        const seperator = (count === encryptedJson.length) ? "" : ",\n" ;
        writeToFile(JSON.stringify(decryptedJson), seperator);
      } catch (error) {
        console.log(`Problem: Can't decrypt at least one backup: ${JSON.stringify(encryptedBlob)}.`, error);
        process.exit();
      }
    });
    console.log(`Decrypted ${count} payload(s)`);
  } catch (error) {
    console.log(`Problem: Something happened trying to recover backup`);
    console.log(error);
  }
  writeToFile("\n]", "");
}

function writeToFile(value: any, seperator: string, newFile?: true) {
  fs.writeFileSync(`${outputfileName}`, `${value}${seperator}`, {
    encoding: "utf8",
    flag: newFile ? "" : "a",
  });
}

/** Ensure that the value is well-formed for a chainjs AsymmetricEncryptedData object */
function stringifyEncrypted(
  encrytpedObject: ModelsCryptoAsymmetric.AsymmetricEncryptedData | ModelsCryptoAsymmetric.AsymmetricEncryptedData[]
) {
  return toAsymEncryptedDataString(JSON.stringify(encrytpedObject));
}

/** Call the callback once for each item in the array and await for each to finish in turn */
export async function asyncForEach(array: any[], callback: (item: any, index: number, array: any[]) => Promise<any>) {
  for (let index = 0; index < (array || []).length; index += 1) {
    await callback(array[index], index, array)
  }
}

(async function () {
  await start();
})();
