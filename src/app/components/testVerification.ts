import { Bip32PublicKey } from '@stricahq/bip32ed25519';
import { getPublicKeyFromCoseKey, CoseSign1 } from '@stricahq/cip08';
import { Decoder } from '@stricahq/cbors';
import {
  BaseAddress,
  EnterpriseAddress,
  RewardAddress,
} from '@stricahq/typhonjs/dist/address';
import { utils } from '@stricahq/typhonjs';
import { blake2bHex } from 'blakejs';
import { Ed25519Signature, PublicKey } from '@emurgo/cardano-serialization-lib-asmjs';

const Network = {
  MAINNET: 1,
  TESTNET: 0,
};
const EDDSA = require("/home/reeshav/cnft_frontend/node_modules/@stricahq/bip32ed25519/dist/ed25519e");
const eddsa = new EDDSA();

const buffer_1 = require("buffer");
const cbors_1 = require("@stricahq/cbors");


// This function is an adjusted version of
// https://github.com/StricaHQ/cip08/blob/39223edfe2c20c37a78e49aaab77761f9534cef1/src/coseSign1.ts#L32
const CoseSign1FromCborWithPayload = (cbor: string, payload: Buffer) => {
  const decoded = Decoder.decode(Buffer.from(cbor, 'hex'));

  if (!(decoded.value instanceof Array)) throw Error('Invalid CBOR');
  if (decoded.value.length !== 4) throw Error('Invalid COSE_SIGN1');

  let protectedMap;
  // Decode and Set ProtectedMap
  const protectedSerialized = decoded.value[0];
  try {
    protectedMap = Decoder.decode(protectedSerialized).value;
    if (!(protectedMap instanceof Map)) {
      throw Error();
    }
  } catch (error) {
    throw Error('Invalid protected');
  }

  // Set UnProtectedMap
  const unProtectedMap = decoded.value[1];
  if (!(unProtectedMap instanceof Map)) throw Error('Invalid unprotected');

  // Set Signature
  const signature = decoded.value[3];

  return new CoseSign1({
    protectedMap,
    unProtectedMap,
    payload,
    signature,
  });
};

const addSpanBytesToObject = (obj: any, span: [number, number]): any => {
  const spanObj = obj;
  spanObj.byteSpan = span;
  spanObj.getByteSpan = function (): [number, number] {
    return this.byteSpan;
  };

  return spanObj;
};

/**
 * This method can be used to verify a cip30 data signature.
 *
 * https://cips.cardano.org/cips/cip30/#datasignature
 * type DataSignature = {
 *   signature: cbor\<COSE_Sign1>,
 *   key: cbor\<COSE_Key>,
 * };
 *
 * Optional:
 *
 * Furthermore a plain text message can be provided to check if both
 * the plain text and the signed message are equal
 *
 * Also a payment (addr1/addr_test1) or stake address (stake1/stake_test1) can be provided
 * to verify that this readable address belongs to the signature
 *
 * @param {string} signature - A COSE_Sign1 cbor string.
 * @param {string} key - A COSE_Key cbor string
 * @param {string} message - An optional plain text message
 * @param {string} address - An optional address starting with (addr1/addr_test1/stake1/stake_test1)
 * @returns {string} boolean - True if the verification was successful otherwise false
 */
const verifyMySignature = (
  signature: string,
  key: string,
  message?: string,
  address?: string
): boolean => {
  const publicKeyBuffer = getPublicKeyFromCoseKey(key);
  // a47072ac2c2c18cade5d8c702824013a6f65389fe6589e1bdf63d5cf71f79457
  // a4010103272006215820a47072ac2c2c18cade5d8c702824013a6f65389fe6589e1bdf63d5cf71f79457
  let coseSign1 = CoseSign1.fromCbor(signature);
  //30807729b3a982eaaf90e1477d52bbda976e83726b490a9799ae05b8cc9c557e81e65a39d8fdd4cad9321266c19a9f43795e13a6693f2de757f60b7709fc1e0f
  if (message) {
    const decoded = Decoder.decode(Buffer.from(signature, 'hex'));
    const payload: Buffer = decoded.value[2];
    const unprotectedMap: Map<any, any> = decoded?.value[1];
    const isHashed =
      unprotectedMap && unprotectedMap.get('hashed')
        ? unprotectedMap.get('hashed')
        : false;
    if (
      payload === null ||
      typeof payload === 'undefined' ||
      (payload.toString() === '' && message !== '')
    ) {
      if (isHashed) {
        coseSign1 = CoseSign1FromCborWithPayload(
          signature,
          Buffer.from(blake2bHex(message, undefined, 28))
        );
      } else {
        coseSign1 = CoseSign1FromCborWithPayload(
          signature,
          Buffer.from(message)
        );
      }
    }

    if (isHashed && !/^[0-9a-fA-F]+$/.test(message)) {
      message = blake2bHex(message, undefined, 28); // 28 * 8 bit = 224 bit ~> blake2b224
    }

    if (isHashed && payload && payload.toString('hex') !== message) {
      return false;
    } else if (!isHashed && payload && payload.toString('utf8') !== message) {
      return false;
    }
  }

  if (address) {
    let providedAddress = address;
    let network = Network.MAINNET;
    const paymentAddress = utils.getAddressFromBech32(address) as BaseAddress;
    const coseSign1PublicKey = new Bip32PublicKey(publicKeyBuffer);

    const credential = {
      hash: coseSign1PublicKey.toPublicKey().hash().toString('hex'),
      type: 0,
    };

    if (address.startsWith('addr')) {
      if (address.startsWith('addr_test1')) {
        network = Network.TESTNET;
      }

      if (paymentAddress.stakeCredential) {
        const paymentAddressBech32 = new BaseAddress(
          network,
          credential,
          paymentAddress.stakeCredential
        ).getBech32();

        if (address !== paymentAddressBech32) {
          // Test whether the key is a stake key to which this payment key belongs
          const extractedRewardAddress = new RewardAddress(
            network,
            paymentAddress.stakeCredential
          ).getBech32();

          const rewardAddress = new RewardAddress(
            network,
            credential
          ).getBech32();

          if (rewardAddress !== extractedRewardAddress) {
            return false;
          }
        }
      } else {
        // An EnterpriseAddress does not have a stake credential
        const enterpriseAddress = new EnterpriseAddress(
          network,
          credential
        ).getBech32();
        if (enterpriseAddress !== providedAddress) {
          return false;
        }
      }
    } else if (address.startsWith('stake')) {
      if (address.startsWith('stake_test1')) {
        network = Network.TESTNET;
      }

      const rewardAddress = new RewardAddress(network, credential).getBech32();

      if (rewardAddress !== providedAddress) {
        return false;
      }
    } else {
      return false;
    }
  }

  return coseSign1.verifySignature({
    publicKeyBuffer: publicKeyBuffer,
  });
};

export function testpk (cbor: string, myKey : string){
  const decoded = cbors_1.Decoder.decode(buffer_1.Buffer.from(cbor, "hex"));
  const externalAad = buffer_1.Buffer.alloc(0)
  const protectedSerialized = decoded.value[0]
  const protectedMap = cbors_1.Decoder.decode(protectedSerialized).value;
  const payload = decoded.value[2]
  const structure = ["Signature1", protectedSerialized, externalAad, payload];    
  const createSigStructure = cbors_1.Encoder.encode(structure)  
  const decodedSignature = decoded.value[3] 
  const publicKeyBuffer = getPublicKeyFromCoseKey(myKey)
  const keyPair = eddsa.keyFromPublic(publicKeyBuffer.toString("hex"));
  const keyPairResult = keyPair.verify(createSigStructure.toString("hex"), decodedSignature.toString('hex')) 
  console.log("payload: ", payload.toString('hex'))
  console.log("publicKey: ", publicKeyBuffer.toString('hex'))
  console.log("message: ", createSigStructure.toString('hex'))
  console.log("signature: ", decodedSignature.toString('hex'))
  return keyPairResult
}

function hexToBuffer(hexString: string): Buffer {
  const byteArray = new Uint8Array(hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
  return Buffer.from(byteArray);
}

export default verifyMySignature;

//nami
// a47072ac2c2c18cade5d8c702824013a6f65389fe6589e1bdf63d5cf71f79457
// 796f
// 30807729b3a982eaaf90e1477d52bbda976e83726b490a9799ae05b8cc9c557e81e65a39d8fdd4cad9321266c19a9f43795e13a6693f2de757f60b7709fc1e0f

//plutus 
// 44b57ee30cdb55829d0a5d4f046baef078f1e97a7f21b62d75f8e96ea139c35f
// 3486f68848a65a0eb5507d
// 77d389e599630d934076329583cd4105a649a9292abc44cd28c40000c8e2f5ac7660a81c85b72af8452d7d25c070861dae91601c7803d656531650dd4e5c4100
