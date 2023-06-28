import {
  Address,
  BaseAddress,
  Ed25519Signature,
  PublicKey,
  RewardAddress,
  StakeCredential,
  Transaction,
} from '@emurgo/cardano-serialization-lib-asmjs';
import { withCoalescedInvoke } from 'next/dist/lib/coalesced-function';
import { CBORValue, COSESign1, HeaderMap, Label } from '@emurgo/cardano-message-signing-asmjs';
import { getPublicKeyFromCoseKey, CoseSign1 } from '@stricahq/cip08';
import { Decoder } from '@stricahq/cbors';
import { blake2bHex } from 'blakejs';
import { Bip32PublicKey } from '@stricahq/bip32ed25519';
import { Buffer } from 'buffer';

export const signMessage = async (message: any, walletname: any) => {
  const api = await window.cardano[walletname].enable();
  const hexAddresses = await api.getRewardAddresses();
  const hexAddress = hexAddresses[0];
  let hexMessage = '';
  for (var i = 0, l = message.length; i < l; i++) {
    hexMessage += message.charCodeAt(i).toString(16);
  }
  try {
    const { signature, key } = await api.signData(hexAddress, hexMessage);
    return { signature, key }
  } catch (error) {
    console.warn(error);
  }
};

export async function verify(hexpayload: string, hexsignature: string, address: string) {
  console.log("yuo");
  const signedBuffer = Buffer.from(hexsignature, 'hex')
  const signedUint8Array = new Uint8Array(signedBuffer.buffer, signedBuffer.byteOffset, signedBuffer.byteLength);
  const coseSign1 = COSESign1.from_bytes(signedUint8Array)
  const payloadCose = coseSign1.payload();
  const headermap = coseSign1.headers().protected().deserialized_headers();
  console.log("headermap: " + headermap);

  const addresslabel = headermap.header(Label.new_text('address'))
  let headerKeyId = headermap.key_id()
  if (addresslabel) {
    const addressBytes = addresslabel.as_bytes() as Uint8Array
    let headerAddress = Address.from_bytes(addressBytes)
    let publicKey = PublicKey.from_bytes(headerKeyId as Uint8Array)
    const signature = Ed25519Signature.from_bytes(coseSign1.signature());
    const data = coseSign1.signed_data().to_bytes()
    const s = headermap.header(Label.new_text('address'))
    console.info("S: ", s?.as_bytes())
    verifyPayload(hexpayload, payloadCose)
    verifyAddress(address, headerAddress.to_bech32(), publicKey.hash())
  }
}
const verifyPayload = (payload: any, payloadCose: any) => {
  const res = Buffer.from(payloadCose, 'hex').compare(Buffer.from(payload, 'hex'));
  if (res == 0) {
    console.log("Valid PAYLOAD");
  }
  else {
    console.log("Invalid Payload");
  }
};


//verifyAddress (address, headers?.address.to_bech32(), headers?.publicKey.hash())

const verifyAddress = (address: any, addressCose: any, publicKeyCose: any) => {
  const checkAddress = Address.from_bytes(Buffer.from(address, 'hex'));
  console.log(checkAddress);
  console.log(Address.from_bech32(addressCose))

  if (addressCose.to_bech32() !== checkAddress.to_bech32()) return false;
  try {
    const baseAddress = BaseAddress.from_address(addressCose);
    //reconstruct address
    const paymentKeyHash = publicKeyCose.hash();
    const stakeKeyHash = baseAddress?.stake_cred?.()?.to_keyhash?.();
    let reconstructedAddress
    if (stakeKeyHash) {
      reconstructedAddress = BaseAddress.new(
        checkAddress.network_id(),
        StakeCredential.from_keyhash(paymentKeyHash),
        StakeCredential.from_keyhash(stakeKeyHash)
      );
    }
    if (
      checkAddress.to_bech32() !== reconstructedAddress?.to_address().to_bech32()
    )
      return false;

    return true;
  } catch (e) { }
  // check if RewardAddress
  try {
    //reconstruct address
    const stakeKeyHash = publicKeyCose.hash();
    const reconstructedAddress = RewardAddress.new(
      checkAddress.network_id(),
      StakeCredential.from_keyhash(stakeKeyHash)
    );
    if (
      checkAddress.to_bech32() !== reconstructedAddress.to_address().to_bech32()
    )
      return false;

    return true;
  } catch (e) { }
  return false;
};

export function getsig(hexsig: string, hexkey: string) {
  console.log("Inputs: " + hexsig + "\n\n" + hexkey);
  const decoded = Decoder.decode(Buffer.from(hexsig, 'hex'))
  const signature = decoded.value[3] as Buffer
  const payload = decoded.value[2] as Buffer
  console.log("decoded payload: " + payload.toString('hex'));
  console.log("decoded signature: " + signature.toString('hex'));
  const sig = CoseSign1.fromCbor(hexsig)
  console.log("Signature Calculated From getsig(): " + sig.getSignature()?.toString('hex'));
  const publicKeyBuffer = getPublicKeyFromCoseKey(hexkey)
  const coseSign1PublicKey = new Bip32PublicKey(publicKeyBuffer);
  const hexkeyprobably = coseSign1PublicKey.toPublicKey().toBytes().toString('hex')
  console.log("Public Key Calculated From getsig(): " + JSON.stringify(hexkeyprobably));
}

export function getSignatureContent(sign: string, message: string) {
  let coseSign1 = CoseSign1.fromCbor(sign);
  const decoded = Decoder.decode(Buffer.from(sign, 'hex'))
  console.log("decoded Sitgnature: " + JSON.stringify(decoded));
  console.log("protected map: " + JSON.stringify(coseSign1));
  const payload: Buffer = decoded.value[2];
  const unprotectedMap: Map<any, any> = decoded?.value[1];
  const isHashed =
    unprotectedMap && unprotectedMap.get('hashed')
      ? unprotectedMap.get('hashed')
      : false;
  if (payload === null || typeof payload === 'undefined' || (payload.toString() === '')) {
    if (isHashed) {
      coseSign1 = CoseSign1FromCborWithPayload(
        sign,
        Buffer.from(blake2bHex(message, undefined, 28))
      );
      console.log(coseSign1);

    } else {
      coseSign1 = CoseSign1FromCborWithPayload(
        sign,
        Buffer.from(message)
      );
      console.log(coseSign1);
    }
  }
}
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
