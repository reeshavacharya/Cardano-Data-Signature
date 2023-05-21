import axios from 'axios';
import { CIP30ProviderProxy } from 'kuber-client';
import { useEffect, useState } from 'react';
import deployPostRequest from './deployPostRequest.json';

interface UserAssetsProps {
    connectedWallet: CIP30ProviderProxy | null;
}

const UserAssets = ({ connectedWallet }: UserAssetsProps) => {
    const express = require('express');
    const app = express();

    // Enable CORS
    app.use((_req: any, res: { setHeader: (arg0: string, arg1: string) => void; }, next: () => void) => {
        res.setHeader('Access-Control-Allow-Origin', 'http://your-web-app-domain.com');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });
    function deployMarketplace() {
        const url = 'http://172.31.6.14:8080/deploy';
        axios
            .post(url, deployPostRequest)
            .then((response) => {
                console.log('Response:', response.data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    return (
        <div className="userAssets">
            <button onClick={deployMarketplace}>DEPLOY</button>
        </div>
    );
};

export default UserAssets;
