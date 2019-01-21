/*
SPDX-License-Identifier: Apache-2.0
*/

/*
 * This application has 6 basic steps:
 * 1. Select an identity from a wallet
 * 2. Connect to network gateway
 * 3. Access PaperNet network
 * 4. Construct request to issue commercial paper
 * 5. Submit transaction
 * 6. Process response
 */

'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const { FileSystemWallet, X509WalletMixin, Gateway } = require('fabric-network');
const FabricCAClient = require('fabric-ca-client');

// A wallet stores a collection of identities for use
const wallet = new FileSystemWallet('../identity/user/balaji/wallet');

// Load connection profile; will be used to locate a gateway
const connectionProfile = JSON.parse(fs.readFileSync('../gateway/connection.json', 'utf8'));


// Main program function
async function main() {

  // A gateway defines the peers used to access Fabric networks
  const gateway = new Gateway();

  // Main try/catch block
  try {

    // Specify userName for network access
    var enrollmentID = 'bob';
    var identityLabel = 'bob@org1.example.com';

    // Set connection options; identity and wallet
    let connectionOptions = {
      identity: "Admin@org1.example.com",
      wallet: wallet,
      discovery: { enabled:false, asLocalhost: true }
    };

    await gateway.connect(connectionProfile, connectionOptions);


    var enrollmentSecret = "";

    var connOpts = {
      protocol: "http",
      hostname: "localhost",
      port: 17054,
      url: "http://localhost:17054"
    }
    
    const fabricCAClient = new FabricCAClient(connOpts);

    var registerReq = {
      enrollmentID: enrollmentID,
      enrollmentSecret: enrollmentSecret,
      role: "",
      affiliation: "org1",
      maxEnrollments: 0
    };

    console.log(registerReq.enrollmentID);
    console.log(enrollmentID);
    console.log(enrollmentSecret);

    //let registrar = new User(await wallet.export("Admin@org1.example.com"));
    //let registrar = await wallet.export('Admin@org1.example.com');

    var registrar = await gateway.getCurrentIdentity();


    console.log(registrar);

    // Register new user
    return fabricCAClient.register(registerReq, registrar)
      .then((secret) => {

        let enrollmentReq = {
          enrollmentID: enrollmentID,
          enrollmentSecret: secret
        };

        // After registration, enroll user
        return fabricCAClient.enroll(enrollmentReq)

          .then((enrollment) => {

            // Create a new identity
            const identity = X509WalletMixin.createIdentity('Org1MSP', enrollment.cert, enrollment.key);

            // Import new identity into the wallet
            wallet.import(identityLabel, identity)
              .then(() => {
                console.log("Identity imported");
                  console.log("User has been enrolled, registered, and added to the wallet");
              });
          });
      });

    console.log('Transaction complete.');

  } catch (error) {

    console.log(`Error processing transaction. ${error}`);
    console.log(error.stack);

  } finally {

    gateway.disconnect();

  }
}
main().then(() => {


}).catch((e) => {

  console.log('user enrollment program exception.');
  console.log(e);
  console.log(e.stack);
  process.exit(-1);

});