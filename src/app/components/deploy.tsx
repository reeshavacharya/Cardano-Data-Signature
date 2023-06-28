import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CIP30ProviderProxy, Kuber } from 'kuber-client';
import deployPostRequest from './deployPostRequest.json';
import sellRequest from './sellRequest.json';
import buyRequest from './buyRequest.json';
import multisigDeploy from './multisigDeploy.json';
import {
    Address,
    BaseAddress,
    PublicKey,
    RewardAddress,
    StakeCredential,
    Transaction,
} from '@emurgo/cardano-serialization-lib-asmjs';
import { withCoalescedInvoke } from 'next/dist/lib/coalesced-function';
import { COSESign1, Label } from '@emurgo/cardano-message-signing-asmjs';
import { getSignatureContent, getsig, signMessage, verify } from './verifySignature';
import verifySignature from '@cardano-foundation/cardano-verify-datasignature';
import verifyMySignature, { testpk } from './testVerification';

const cbor = require('cbor')


interface DeployProps {
    connectedWallet: CIP30ProviderProxy;
}

const Deploy: React.FC<DeployProps> = ({ connectedWallet }) => {
    const kuber = new Kuber('https://preview.kuberide.com');
    const [transactionSubmitted, setTransactionSubmitted] = useState(false);
    const [isOperator, checkIsOperator] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const handleInputChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        setInputValue(event.target.value);
    };
    function txHex_Kuber(_tx: string): string {
        return Transaction.from_hex(_tx).to_hex()
    }
    const deployMarketplace = async () => {
        const url = 'http://172.31.6.14:8081/deploy';
        const wallet = await connectedWallet.enable()        
        try {
            const response = await axios.post(url, multisigDeploy)
            console.log("response: ",response);
            const tx_hex = txHex_Kuber(response.data.cborHex);
            const tx_signed = await wallet.signTx(tx_hex, true);
            const submitted = wallet.instance.submitTx(tx_signed);
            console.info("Submitted: \n", submitted);
            setTransactionSubmitted(true);
        } catch (error) {
            console.error('Error:', JSON.stringify(error));
        }
    };
    const sellAsset = async () => {
        const url = 'http://172.31.6.14:8080/sell';
        const wallet = await connectedWallet.enable()
        try {
            const response = await axios.post(url, sellRequest)
            // console.log(response.data.cborHex);
            const tx_hex = txHex_Kuber(response.data.cborHex);
            const tx_signed = await wallet.signTx(tx_hex, true);
            const submitted = wallet.instance.submitTx(tx_signed);
            console.info("Submitted: \n", submitted);
            setTransactionSubmitted(true);
        }
        catch (error) {
            console.error('Error:', JSON.stringify(error));
        }
    }
    const buyAsset = async () => {
        const url = 'http://172.31.6.14:8080/buy';
        const wallet = await connectedWallet.enable()
        try {
            const response = await axios.post(url, buyRequest)
            // console.log(response.data.cborHex);
            const tx_hex = txHex_Kuber(response.data.cborHex);
            const tx_signed = await wallet.signTx(tx_hex, true);
            const submitted = wallet.instance.submitTx(tx_signed);
            console.info("Submitted: \n", submitted);
            setTransactionSubmitted(true);
        }
        catch (error) {
            console.error('Error:', JSON.stringify(error));
        }
    }
    const handleFormSubmit = async (event: { preventDefault: () => void; }) => {
        event.preventDefault();
        signMyData(inputValue);
    };
    function toHexLocal(str: string) {
        var result = '';
        for (var i = 0; i < str.length; i++) {
            result += str.charCodeAt(i).toString(16);
        }
        return result;
    }
    async function signMyData(data: any) {
        try {
            const wallet = (await connectedWallet.enable()).instance
            const usedAddress = await wallet.getUsedAddresses()
            const rewardAddress = await wallet.getRewardAddresses()
            const hexData = toHexLocal(data)
            const signResponse = await wallet.signData(rewardAddress[0], hexData)
            console.log("Signature Response: " + JSON.stringify(signResponse));
            const verifySignature = testpk(signResponse?.signature,  signResponse?.key)
            console.log("is Signature Valid? ", verifySignature);
            setInputValue('')
            setTransactionSubmitted(true)
        }
        catch (error) {
            console.error('Error:', error);
        }
    }

    return (
        <div className="userAssets">
            <button onClick={deployMarketplace}>SUBMIT</button>
            <button onClick={sellAsset}>SELL</button>
            <button onClick={buyAsset}>BUY</button>
            <form onSubmit={handleFormSubmit} className='form-style'>
                <input type="text" value={inputValue} onChange={handleInputChange} className='black-text' />
                <button type='submit'>SIGN DATA</button>
            </form>
            {transactionSubmitted && <p>Data Signed Successfully!!</p>}
            {isOperator && <p>WELCOME OPERATOR</p>}
        </div>
    );
};

export default Deploy;



