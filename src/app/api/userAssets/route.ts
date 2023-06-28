import type { NextApiRequest, NextApiResponse } from 'next'
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import { NextResponse } from 'next/server';
// import { getUtxos } from './utxos';


// async function getUtxos(address: string){

//     if (typeof window === 'undefined') {
//         const dns = require('dns');
//         dns.setServers(['1.1.1.1', '8.8.8.8']); 
//     }
//     let sum= 0
//     const API = new BlockFrostAPI({
//         projectId : "previewE4fbR7220pwxt57EUS5zUybTBU6vlnPT",
//      });
//      let addressData = await API.addressesUtxos(address)

//      return addressData.filter((tx) => {
//         return tx.amount.some((amt) => amt.unit === "lovelace");
//       }).map((tx) => {
//         const lovelaceAmt = tx.amount.find((amt) => amt.unit === "lovelace");
//         return {
//           tx_hash: tx.tx_hash+"#"+tx.tx_index,
//         };
//       });
// }


export async function GET(request: Request) {
        console.log("y")
        // const res = await getUtxos("addr_test1qpw57k84mzwmpqyx6n9smye79mxt8rqpfpvx7p6chz95sm7a3aw5tgv4fc9weuwme2u29aerv5hk0m2lkpkgasn7gtxqwen0r7")
        // return NextResponse.json(await getUtxos("addr_test1qpw57k84mzwmpqyx6n9smye79mxt8rqpfpvx7p6chz95sm7a3aw5tgv4fc9weuwme2u29aerv5hk0m2lkpkgasn7gtxqwen0r7"))
        let sum = 0
        // const api = new BlockFrostAPI({
        //     projectId: "previewE4fbR7220pwxt57EUS5zUybTBU6vlnPT",
        // });

        // let addressData = await API.addressesUtxos("addr_test1qpw57k84mzwmpqyx6n9smye79mxt8rqpfpvx7p6chz95sm7a3aw5tgv4fc9weuwme2u29aerv5hk0m2lkpkgasn7gtxqwen0r7")
        const addressData:any[]=[]
        // const res = addressData.filter((tx) => {
        //     return tx.amount.some((amt) => amt.unit === "lovelace");
        // }).map((tx) => {
        //     const lovelaceAmt = tx.amount.find((amt) => amt.unit === "lovelace");
        //     return {
        //         tx_hash: tx.tx_hash + "#" + tx.tx_index,
        //     };
        // });
        let res=addressData
        console.log(res)
        console.log(JSON.stringify(res))
        return new Response(JSON.stringify(res))
    // }
    // catch (error) {
    //         return new Response(JSON.stringify(error))
    //     }
    
}

// export async function GET (request: Request){
//     const num =1
//     return new Response('yoyo') 
// }
