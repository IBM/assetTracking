# Asset Tracking with Blockchain and IoT Workshop

In this workshop, we will be creating a local Hyperledger Fabric network using the IBM Blockchain Platform Visual Studio Code Extenstion which makes it easy to start developing smart contracts. The solution that we will be creating is an asset lifecycle solution that keeps track of the asset from creation to deletion. Also, we will be creating and managing asset leases which keep track of the lease terms in a lease agreement such as end date, price, and deposit amount. 

For the IoT integration, we will be leveraging the IBM IoT Platform to handle device scanning at various locations as the asset is being transferred. Instead of having an actual physical device, we will be creating a web app pretending to be a device which will trigger these scans and notify a locally node.js app to invoke the updateAssetLocation transaction.

## Structure of Asset

The asset being stored in the ledger has the following properties:

- manufacturer - creator of the asset
- assetNumber - serial number given to the asset
- assetType - type of asset
- currentOwner - Who currently posesses the asset
- currentState - The current state of the asset
- percentDamage - The amount of damage in percent found during the inspection stage
- location - Where the asset was scanned last

## Structure of the Asset Lease

The asset lease being stored in the ledger has the following properties:

- leaseNumber - Lease agreement number
- lessee - Who is receiving the lease
- lessor - Who is leasing the asset out
- assetKey - The key of the asset being leased
- dateLeased - The date the lease goes into effect
- endOfLease - The end of the lease agreement
- price - The total price of the lease payments
- depositPaid - The deposit paid up front
- dateReturned - The date the asset was returned
- percentDamaged - The condition of the asset on return displayed in percent damaged
- depositReturned - Based on the ammount of damage, the amount of the deposit returned

# Creating the Node-Red simulated device application
To start off, we are going to create the simulated IoT device which will invoke the updateAssetLocation with the location where the device was "scanned". We will be using the IBM IoT Platform to facilitate the communicaton from our virtual device to a local IoT service which will be listening for published device events. 

For the code used to build this virtual device, we will be using a framework called Node-Red which is a low code environment which allows for drag and drop of preconfigured nodes to easily build applications. 

IBM Cloud has a starterkit for IoT applications that comes with a Node-Red application and an instance of the IoT Platform service already bound to it. 

1. Go to your IBM Cloud dashboard
2. Click on **Catalog** at the top right of the page
3. From the catalog, select **Starter Kits** from the category list on the left side to narrow the services shown.
4. Then, find and click on the **Internet of Things Platform Starter** kit.

![iotpStarter](./images/iotpStarter.png)

5. On the next page, give the new application a name. It's important that the name be unique so that there are no hostname conflicts with other applications out there. To make it easy, you can add your initials before the hostname (e.g. My name is Oliver Rodriguez so I might name my application or-asset-tracking).

![servicePage](./images/servicePage.png)

6. Click create. This creation process will take a bit.

7. Once the application is deployed, click on **Visit App URL** at the top of the page to go to the application.

![appUrl](./images/appUrl.png)

8. The first time you open a Node-Red application you have to go through the initial set up wizard. To start, create an admin username and password. You can also select the checkbox to give read access to anybody that visit's your app.

9. When done with the wizard you should be taken to the application. The page that you are brought to is called the **Canvas** which is where you drag and drop your nodes. The left pane that holds all the nodes is called the **pallette**.

10. To make any changes you will need to log in with the admin account created during set up. Click on the sillouette at the top right of the page and click **log in**. Then, enter your username and password to log in.

![logIn](./images/login.png)

 You may notice that this application already comes with some starter code, go ahead and select it all with your curser by clicking and draging and then press your delete key.

10. We will be importing some of our own code for the virtual device. To do this, click on the menu button at the top right, select **Import** and **Clipboard**. 

![import](./images/import.png)

Then paste in the contents of the **flow.json** file from this repo and click **Import**.

![flow](./images/flow.png)

Now that we have our flow imported, we now need to use the IBM IoT Platform to facilitate communication between the virtual device and the local IoT application.


# Connect with the IBM IoT Platform

1. From the dashboard, click on the IBM IoT Platform service. You may need to expand the *Cloud Foundry services* section.
2. On the overview page for the service, click on **Launch**

![launch](./images/launch.png)

3. Once in the IoT Platform, click on the **Devices** button from the left navigation panel.

![devices](./images/devices.png)

## Create a new Device Type

4. Once in the devices page, click on **Add Device** at the top right of the page.
5. Click on the **Device Type** tab at the top left of the page.
6. Once on the new page, click on **Add Device Type** at the top right.
7. Then, ensure **Type** is **Device** and enter **asset** as the **Name**

![newType](./images/newType.png)

8. Click **Next** and click **Done** on the next page.


## Register a new device

9. On the new page, click on **Register Devices**

![registerDevices](./images/registerDevices.png)

10. Next, ensure that **asset** is selected as the **Device Type** and enter **A-001** as the **DeviceID**
11. Click **Next**, and then **Next** again on the device defaults page, and then **Next** again on the token generation page.
12. Click **Done** to complete device registration
13. Once you complete registration, you will be taken to the **Device credentials** page. Copy everything in the **Device credentials** object and save it in a seperate doc.

 It's important to copy the Authentication Token as you will not be able to retrieve it once you leave the page. 

![deviceCreds](./images/deviceCreds.png)


## Register an App
Now we need to register an application with the platform to generate an API key

1. Click on the **Apps** button on the left navigation panel

![apps](./images/apps.png)

2. On the Apps, page, click on **Generate API Key** at the top right of the page.

3. Add a description if you wish, then click on **Next**

4. On the new page, select **Standard Application** as the **Role**

![role](./images/role.png)

5. Click **Generate Key**

6. Once the API Key has been added, copy both the **API Key** and the **Authentication Token** to a seperate doc.

Again, just like with the device credentials, you cannot retrieve the token once you leave the page. Be sure to have it copied somewhere.

Now that we have our device registered and the credentials saved, let's return to our code editor.

# Creating the Logspout Container
Throughout this workshop we may need to see what the output of certain actions against the Hyperledger Fabric network are. To see this output we will be implementing a special container called the logspout container. This container will monitor all log output from all containers in a certain docker network. In this case, we can see what each container in our Hyperledger Fabric network is saying which will help with debuging.

1. Navigate to this repo in your terminal/command prompt
2. Find and run **org1/configuration/cli/monitordocker.sh**
3. Keep this terminal window open

# Packaging chaincode
In order to start using the chaincode we need to package, install, and instantiate it first. 

1. To package the chaincode, first go to the file explorer in Visual Studio Code.
2. Then, right click and select **Add Folder to Workspace**

![addToWorkspace](./images/addToWorkspace.png)

3. In the new dialog window, find the **contract** folder in this repo and click **Add**. You should now see **contract** appear in the file explorer.
4. Then, click on the IBM Blockchain Platform extension on the left side of VSCode.
5. Find the **Smart Contract Packages** section, hover your mouse over it, and click on the **+**.

![smartContractPackages](./images/smartContractPackages.png)

6. A new prompt should appear at the top of VSCode asking to choose a workspace folder to package. Select **contract**

You now have a smart contract package named **asset-tracking** with a version number following it. Everytime you make a change to the smart contract, you must increase the version number in **package.json** and repackage the smart contract.

Now that we have the smart contract packaged we need to install the smart contract onto a peer.

# Installing and Instantiating
Getting the smart contract on to a Hyperledger Fabric network involves two key steps: Install and Instantiate.

Install is simply the process of putting the smart contract onto a peer. Although the peer holds the smart contract, the contract does not execute on the peer. This is where the instantiation process comes in.

Instantiation is performed on a channel by a peer and it is the process of creating a chaincode container to execute logic found in smart contracts. Having the chaincode execute in a separate container ensures security and stability as chaincode execution does not have access to the peer file system and cannot bring the peer down in the event of a crash.

### Installing Chaincode:

1. Click on **local_fabric** under the **Blockchain Connections** pane in VSCode.
2. Select **mychannel** to expand it.
3. Right click on **peer0.org1.example.com** and select **Install Smart Contract**

![install](./images/install.png)

4. A prompt should appear at the top of VSCode asking to select a package to install. Select **asset-tracking** with the latest version number.

![selectPackage](./images/selectPackage.png)

Your smart contract is now installed. Next we need to instantiate it.

### Instantiate Chaincode

1. Find the **Blockchain Connections** pane at the bottom left of VSCode, right click on **mychannel**, and select **Instantiate Smart Contract**

![instantiate](./images/instantiate.png)

2. A prompt should appear at the top of VSCode asking which smart contract to instantiate. Select the one that was just installed.
3. The next prompt should ask for a function to call. Enter **Instantiate** and press enter.
4. Then, a new prompt will ask for arguments to pass. We don't have any to pass in so just press enter.
5. While the smart contract is instantiating you can see how the process is going by checking on the logspout container which should be running in a terminal window.

If there are any errors during instantiation, you can see what went wrong in the logspout container. 

Now we are ready to test out transactions.

# Invoking transactions with the IBM Blockchain Platform VSCode Extension
Another handy function of the IBM Blockchain Platform VSCode extenstion is the ability to invoke transactions without having to write an application to do so.

1. In the **Blockchain Connections** pane, find **asset-tracking** under **mychannel** and click on it to expand it.
2. Then, click on **AssetContract** to expand the list of transactions defined in the smart contract.

You can right click on a transaction and select **submit transaction** to inoke the transaction in the contract. Once you select **submit transaction** you will be asked for arguments to pass in. You may need to check out the AssetContract.js file to see what transactions require which arguments.

Let's test a few transactions out. Submit the following transactions with the respective arguments:

### manufactureAsset
```
manufacturer1,A-003,asset
```

### queryByField
```
assetType,asset
```

### transferAsset
```
manufacturer1,A-003,manufacturer1,vendor1
```

### createLease
```
L-001,contractor1,vendor1,A-003,manufacturer1,lease,Jan2019,Jan2021,1000.00,1000.00
```

### transferAsset
```
manufacturer1,A-003,vendor1,contractor1
```

### returnAsset
```
manufacturer1,A-003,contractor1,vendor1,L-001,Jan2021
```

### inspectAsset
```
manufacturer1,A-003,vendor1,L-001,21
```

### repairAsset
```
manufacturer1,A-003
```

### returnDeposit
```
vendor1,L-001
```

### queryAll 
*No args needed*

### destroyAsset
```
manufacturer1,A-003
```

# Adding Identities to the Wallet
Invoking transactions with the VSCode extension is easy enough but when you want to start building applications there are a few extra steps. Now that we are building applications we need to start worrying about identities. For this lab, we have one identity that we need to create.

1. In your terminal navigate to the **application** folder and find the **addToWallet.js** program.
2. Run the program with the following command

```bash
node addToWallet.js
```

This program will add the identity to our wallet that we will use to invoke transactions using the Node SDK.

# Invoking transactions with the Node SDK
In this section we will be invoking the transactions defined in assetContract using the the **fabric-network** module. This is a new module introduced in Hyperledger Fabric 1.4.

In the **application** folder you will find **invoke.js**. In this file we will be copying and pasting the code to invoke transactions and see what the response is.

1. In your code editor, navigate to this repo and open **org1/application/invoke.js**
2. Look for the **Transaction Invocation block comment section.

![txInvoc](./images/txInvoc.png)

3. In between the end of that comment block and the **End of transaction invocation section**, paste in the code for each transaction mentioned below.

4. Save the file
5. Run **invoke.js** with the following command

```
npm install 

node invoke.js
```

We will be following the same transaction order from the previous section on invoking transactions with the VSCode extension.

Using the 5 steps outlined above, invoke the following transactions

1. Manufacture Asset
2. Transfer Asset
3. Create Lease
4. Transfer Asset
5. Return Asset
6. Inspet Asset
7. Repair Asset
8. Return Deposit


## Manufacture Asset
The manufactureAsset transaction creates a new digital asset to be stored on the ledger. Once the transaction is successful, the new asset is returned.


```javascript

    const manufactureResponse = await contract.submitTransaction('manufactureAsset', 'manufacturer1','A-001', 'asset');
    let asset = Asset.fromBuffer(manufactureResponse);

    console.log(asset);

    console.log(asset.manufacturer + " has manufactured an asset with asset number "+asset.assetNumber);
    
```

## Transfer Asset
The transferAsset transaction transfers ownership of the asset within the ledger. Returns the transferred asset

```javascript

   const transferResponse = await contract.submitTransaction('transferAsset', "manufacturer1","A-001","manufacturer1","vendor1");
   let asset = Asset.fromBuffer(transferResponse);

   console.log(asset);

   console.log(asset.manufacturer + " has manufactured an asset with asset number "+asset.assetNumber);
    
```

## Create Lease
The createLease transaction creates a lease which defines the lessee, lessor, and other lease terms. Returns the created lease.

```javascript

    const manufactureResponse = await contract.submitTransaction('manufactureAsset', 'manufacturer1','A-006', 'asset');
    let asset = Asset.fromBuffer(manufactureResponse);

    console.log(asset);

    console.log(asset.manufacturer + " has manufactured an asset with asset number "+asset.assetNumber);
    
```

## Return Asset
The returnAsset transaction is invoked when a lessee wants to return the leased asset at the end of the lease. Returns the returned asset and the lease that has ended.

```javascript

    const manufactureResponse = await contract.submitTransaction('manufactureAsset', 'manufacturer1','A-006', 'asset');
    let asset = Asset.fromBuffer(manufactureResponse);

    console.log(asset);

    console.log(asset.manufacturer + " has manufactured an asset with asset number "+asset.assetNumber);
    
```

## Inspect Asset
The inspectAsset transaction is invoked when the asset has been received and inspected by the vendor. This transaction records the percent of damage to the asset on the lease. Returns the inspected asset and lease.

```javascript

    const manufactureResponse = await contract.submitTransaction('manufactureAsset', 'manufacturer1','A-006', 'asset');
    let asset = Asset.fromBuffer(manufactureResponse);

    console.log(asset);

    console.log(asset.manufacturer + " has manufactured an asset with asset number "+asset.assetNumber);
    
```

## Repair Asset
The repairAsset transaction is called after the asset has been repaired. Sets the asset condition to **Refurbished** and the state to **Available**. Returns the repaired asset.

```javascript

    const manufactureResponse = await contract.submitTransaction('manufactureAsset', 'manufacturer1','A-006', 'asset');
    let asset = Asset.fromBuffer(manufactureResponse);

    console.log(asset);

    console.log(asset.manufacturer + " has manufactured an asset with asset number "+asset.assetNumber);
    
```

## Return Deposit
The returnDepost transaction records the amount of the depost to be returned to the lessee. This is calculated by looking at the percent of the asset damaged which was recorded in the lease by the inspectAsset transaction and then multiplying the original deposit paid by a percent which corolates with the amount of damage. (e.g. >20% damage to the asset = 80% of the original deposit returned). Returns the lease.

```javascript

    const manufactureResponse = await contract.submitTransaction('manufactureAsset', 'manufacturer1','A-006', 'asset');
    let asset = Asset.fromBuffer(manufactureResponse);

    console.log(asset);

    console.log(asset.manufacturer + " has manufactured an asset with asset number "+asset.assetNumber);
    
```

# Configuring the local IoT Service 
Remember that IoT set up that we did earlier? Now let's put it to use. In this section we will be starting a local application that listens for IoT events and updates the ledger. In our case these events will be "scans" from our simulated device.

1. In VSCode navigate to this repo and open **application/iot_service/app.js**
2. Look for the **appClientConfig** object around line 8 and enter the information that you saved earlier from the IoT Platform.

![clientConfig](./images/clientConfig.png)

3. Next, run the following commands to start the IoT app.

```
npm install

node app.js
```

4. The app is now running in the terminal window and will output any data received from the IoT Platform.

Now that the app is running, let's test it out.

# Scan Device
In this section we will trigger some device events from our simulated device which in turn will invoke the updateAssetLocation transaction and update the asset's location in the ledger.

1. Open your browser to the Node-Red app that we deployed before. If you closed the tab, go back to the IBM Cloud dashboard and luck under **Cloud foundry applications**

2. You should see a bunch of blue nodes with buttons to the left side of them. These nodes are called *inject* nodes and are used to start flows or inject inforamtion into the payload. In our app, we use them to start the flow to emit a device event to the IoT Platform. 

3. All you need to do is click on the blue button next to the corresponding location that you want to simulate a scan even at.

For example, if you want to simulate the device arriving at the vendor's inspection warehouse at the end of a lease, just click on the inject node next to the orange **Inspection Warehouse scn** node.

4. Check out the output in the terminal where the IoT app is running and you should see both the device event being received and the successful transaction response with the updated asset location.

# Query the World State
To query the world state database there are two files that we can use to help us out: queryByField.js and queryAll.js.

**queryByField.js** does just what it says. It queries the world state and only returns assets that match the values for a field such as "currentOwner", "assetType", or "currentOwner". For example, we can use this file to get all assets that are owned by vendor1.

**queryAll** also does what it says. It returns everything in the world state.


1. Run queryByField.js with this command

```
node queryByField.js
```

By default, it will return all assets with **assetType** that equals **"asset"** which means it will not return leases.

2. Now run queryAll.js with this command

```
node queryAll.js
```


# Recap
In this lab we did a lot. First we created a virtual device with Node-Red and then configured the IBM IoT Platform and received API credentials. Next we created the logspout container to monitor logs from our Hyperledger Fabric network. After that, we packaged, installed, and instantiated a smart contract on our local Hyperledger Fabric network. This allowed us to test out some of our transactions using the VSCode plugin. Once we were done testing out the transactions we decided to import some identities and start invoking transactions with the Node SDK. Then, we started the local IoT app to start listeing for scan events which we then began to send from our Node-Red app. Finally, we queried the world state database using two different query programs.