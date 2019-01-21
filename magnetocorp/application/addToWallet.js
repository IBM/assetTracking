/*
 *  SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
const path = require('path');

//const fixtures = path.resolve(__dirname, '../../../../basic-network');

// A wallet stores a collection of identities
const wallet = new FileSystemWallet('../identity/user/isabella/wallet');

async function main() {

    // Main try/catch block
    try {

        // Identity to credentials to be stored in the wallet
        const credPath =  '../../local_fabric';
        const cert = fs.readFileSync(path.join(credPath, '/certificate')).toString();
        const key = fs.readFileSync(path.join(credPath, '/privateKey')).toString();

        // Load credentials into wallet
        const identityLabel = 'User1@org1.example.com';
        const identity = X509WalletMixin.createIdentity('Org1MSP', cert, key);

        await wallet.import(identityLabel, identity);

    } catch (error) {
        console.log(`Error adding to wallet. ${error}`);
        console.log(error.stack);
    }
}

main().then(() => {
    console.log('done');
}).catch((e) => {
    console.log(e);
    console.log(e.stack);
    process.exit(-1);
});