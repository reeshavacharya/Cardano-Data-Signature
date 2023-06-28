import type { NextApiRequest, NextApiResponse } from 'next'
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

type Data ={
    utxos: any
}

// export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {    
//     try {
//         let json = await getUtxos("addr_test1wp34y3rwkf5wgfc32wcwguvlr3wzr9fhj5hw6sk0mul9k5q4pr369")
//         let utxos =JSON.parse( JSON.stringify(json))
//         res.status(200).json({utxos});
//     } catch (error) {
//         console.error(error);
//     }
// }  

// export async function getUtxos(address: string){

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

