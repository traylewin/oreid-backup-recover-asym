# oreid-backup-recover example files

Recover keys from asymetically encrypted backup data

<br>

# About the input (encrypted) data

### Asymmetrically encrypt payloads
This utility decrypts data that was encrypted using ECIES asymmetric encryption. The payload it decrypts is presented as a JSON object (or stringified JSON object) with the following properties:
```
  seq: number // 0-based order of encryption - used when 'wrapping' mulitple encryptions in sequence
  iv: string
  publicKey: string
  ephemPublicKey: string
  ciphertext: string
  mac: string // text notation that may convey optional values used in encryption
  scheme: string 
```
The utility uses the asymmetric crypto features of the [chainJs](https://github.com/Open-Rights-Exchange/chain-js) library to decrypt

<br>

### Wrapped payloads (encrypted with multiple keys in sequence)
If a payload is wrapped (encrypted sucessively with multiple keys), this utility can unwrap the payload (using multiple keys in sequence). If all keys are provided in the keyfile.json, a payload will be completely unwrapped. The payload is decrypted in reverse order of encryption with the last key in the array being used as the first key to unwrap with.

If all the keys are not available to fully unwrap the payload, this utility will unwrap only the outer layer with a single key (as provided in keyfile.json)


<br><br>
# About the output (decrypted) data

### Output file formats

This utility emits two distinct formats of output data

Fully decrypted data:
```
[
{"publicKey":"a9f7bdcbc2d11b8f03bdf6cf3eb7d36b9ad53bfe8bdee2e2b5ce39c92a764a45","finalDecrypted":"example payload to encrypt 1633995765977"},
...
]
```

Partially unwrapped decrypted data

If this utlity is run with an input file containing a sequentially wrapped payload, and is not provided with all the keys needed to unwrap all the sequential encryptions, it will use just one key and unwrap the 'outer' encryption layer. In this case, the output file will contain the partially unwrapped payload. The seq number '0' in this case means that there is one remaining encryption to be 'unwrapped/decrypted'. This output file can be used as an input to another run with the remaining private key (placed in keyfile.json) to finish decrypting the payloads.

```
[
{"publicKey":"a9f7bdcbc2d11b8f03bdf6cf3eb7d36b9ad53bfe8bdee2e2b5ce39c92a764a45","ephemPublicKey":"5c7b5999c9e56cef7f491b77cee677bb68d25f0475e8a3ce24ad5b23513f410e","mac":"4a3f0f644b888e3833258cd58ca4452c","scheme":"asym.chainjs.ed25519.algorand", "ciphertext":"205f358d4b3a5619622d178c4752c1e9a04a4eb5660e99de7f6b99ec51b80f4095eaf0490caeb1b5", "seq":0},
...
]
```


<br><br>
# Examples

### Example 1

Demonstrates an input file with an array of singularly encrypted payloads (not wrapped) and a key file with the private key needed to completely decrypt.

- Run ```./oreid-backup-recover-macos algorand ../examples/input1.json ../examples/keys1.json```
<br><br>

### Example 2

Demonstrates an input file with an array of multiply encrypted payloads (wrapped) and a key file with both private keys needed to completely unwrap and decrypt.

- Run ```./oreid-backup-recover-macos algorand ../examples/input2.json ../examples/keys2.json```
<br><br>

### Example 3

Demonstrates an input file with an array of multiply encrypted payloads (wrapped) and a key file with ONLY ONE of the private keys needed to completely unwrap and decrypt. The output3.json file shows the results of the first unwrapping. This file can be used as an input to run with the remaining private key to finish decryption.

- Run ```./oreid-backup-recover-macos algorand ../examples/input3.json ../examples/keys3.json```
<br>

### Example 4

Demonstrates an input file with a single multiply encrypted payload (wrapped) and a key file with both of the private keys needed to completely unwrap and decrypt. The output4.json file shows the results of the final decryption.

- Run ```./oreid-backup-recover-macos algorand ../examples/input4.json ../examples/keys4.json```
<br>
