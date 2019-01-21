// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const { FileSystemWallet, Gateway } = require('fabric-network');
const Asset = require('../../contract/lib/asset');

var Client = require("ibmiotf");

var appClientConfig = {
  org: 'ykcyvl',
  id: 'iot_service',
  "domain": "internetofthings.ibmcloud.com",
  "auth-key": 'a-ykcyvl-1wdr2useqj',
  "auth-token": 'xTCtKH4uKOr)fCxvwf'
};

const appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

// A wallet stores a collection of identities for use
const wallet = new FileSystemWallet('../../../digibank/identity/user/balaji/wallet');

// Load connection profile; will be used to locate a gateway
const connectionProfile = JSON.parse(fs.readFileSync('../../gateway/connection.json', 'utf8'));

// Set connection options; identity and wallet
let connectionOptions = {
  identity: "Admin@org1.example.com",
  wallet: wallet,
  discovery: { enabled:false, asLocalhost: true }
};

// A gateway defines the peers used to access Fabric networks
const gateway = new Gateway();

async function connect() {

  await gateway.connect(connectionProfile, connectionOptions);
  
  // Access examplenet network
  console.log('Use network channel: mychannel.');

  const network = await gateway.getNetwork('mychannel');

  return await network.getContract('asset-tracking');

      // TODO
      // 1. register device *
      // 2. get creds *

      // 3. finish rest of node.js files
      // 4. clone orgs
      // 5. get creds in order
      // 6. write steps

}

connect().then((contract) => {
  console.log("test");

  appClient.on("connect", function () {

    //Add your code here
    appClient.subscribeToDeviceEvents();
  
    console.log("connected");
    
  });
  
  appClient.on("deviceEvent", function (deviceType, deviceId, eventType, format, payload) {
  
    console.log("message received");
    console.log(JSON.parse(payload.toString('utf8')));

    let data = JSON.parse(payload.toString('utf8'));
  
    contract.submitTransaction('updateAssetLocation', data.d.assetKey, data.d.assetLocation)
      .then((response) => {

        let asset = Asset.fromBuffer(response);
        console.log(asset);
      });
  
  });
  
  //Outputs error events
  appClient.on("error", function(error) {
    console.log("Error: " + error);
  });
  
});

