# ORE ID Backup Recovery Utility
Recover keys from asymmetrically encrypted key backup file

# Setup for build

```
npm install --global pkg@5.3.3
nvm install 14.16.1
```

# To build executable packages

**Node 14 or higher Required** by pkg library.<br>
Use ```nvm current``` to see if you are running Node 14, if not you can switch to it using nvm.

```
nvm use node v14.16.1
```

```
npm run build
```

Use pkg version 5.3.3 or higher (earlier version might throw errors)

If you get 'FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory', make sure you are passing in the option max_old_space_size=4096. It should already be set on npm run build command. However if you need to add it manually, you can do the following on the command prompt:

```export NODE_OPTIONS=--max_old_space_size=4096```

<br><br>
# How to recover keys from an encrypted Oreid backup file

### Setup
- Receive a asymmetric key backup file (e.g. oreid_asym_key_backup.json)
- Download a backup decrypt program for your operating system (oreid-backup-recover-macos, oreid-backup-recover-linux, OR oreid-backup-recover-win.exe )
- Populate key file (see below)
<br>
### Supported Chains
- Algorand
- Eos (including any EOSIO chain e.g. TLOS, Wax, ORE, etc.)
- Ethereum
<br><br>
### Asymmetrically encrypt payloads
This utility decrypts data that was encrypted using ECIES asymmetric encryption. The payload it decrypts is presented as a JSON object. This utility uses the asymmetric crypto features of the [chainJs](https://github.com/Open-Rights-Exchange/chain-js) library to decrypt

<br>

### Wrapped payloads (encrypted with multiple keys in sequence)
If a payload is wrapped (encrypted sucessively with multiple keys), this utility can unwrap the payload (using multiple keys in sequence). If all keys are provided in the keyfile.json, a payload will be completely unwrapped. If all the keys are not available to fully unwrap the payload, this utility will unwrap only the outer layer with a single key (as provided in keyfile.json)
<br><br>
### Setup input data
- Place the input file in the same directory as the utility. The input file is an array of JSON objects (asymmetrically encrypted payloads). Each item in the array is a JSON object or, if the payload is wrapped, it is itself an array of JSON objects with each object being one encryption 'wrap'
- Place the private key(s) needed to decrypt into keyfile.json (a JSON Array of strings). For an encryption payload that is wrapped by multiple keys, keys should appear in the file in the order that they were used to encrypt. The utility will decrypt in reverse order of the key list - the last key in the array is used to unwrap with first.
<br><br>

### To run on Mac
- Run ```./oreid-backup-recover-macos {chainName} inputfile.json keyfile.json```
<br>

### To run on Linux
- Run ```./oreid-backup-recover-linux {chainName} inputfile.json keyfile.json```
<br>

### To run on Windows
- Run ```oreid-backup-recover-win.exe {chainName} inputfile.json keyfile.json```

<br>


### Example command usafe

```./oreid-backup-recover-macos algorand input.json keys.json output.json```

Note: input, key, and output filenames are optional (uses defaults if not provided)

<br>

### Example data

The Examples directory includes example input, key, and output file contents for various scenarios. Please refer to the readme in that directory.

<br>

