/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// ExampleNet specifc classes
const Asset = require('./asset.js');
const AssetList = require('./assetList.js');
const AssetLease = require('./assetLease.js');
const LeaseList = require('./leaseList.js');

/**
 * A custom context provides easy access to list of all commercial papers
 */
class AssetContext extends Context {

    constructor() {
        super();
        // All assets are held in a list of assets
        this.assetList = new AssetList(this);

        // All leases are held in a list of leases
        this.leaseList = new LeaseList(this);
    }

}

/**
 * Define AssetContract smart contract by extending Fabric Contract class
 *
 */
class AssetContract extends Contract {

    /**
     * Define a custom context for the asset contract
    */
    createContext() {
        return new AssetContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        console.log('Instantiate the contract');
    }


    /**
     * Manufacture asset
     *
     * @param {Context} ctx the transaction context
     * @param {String} manufacturer asset manufacturer
     * @param {String} assetNumber asset number for this manufacturer
     * @param {String} assetType the type of asset
    */
    async manufactureAsset(ctx, manufacturer, assetNumber, assetType) {

        // create an instance of the asset
        let asset = Asset.createInstance(manufacturer, assetNumber, assetType);

        // Setting the asset's owner
        asset.setOwner(manufacturer);

        // Setting the asset's condition
        asset.setNew();

        // Setting the asset's status
        asset.setAvailable();

        // Add the asset to the list of all similar commercial assets in the ledger world state
        await ctx.assetList.addAsset(asset);

        // Must return a serialized asset to caller of smart contract
        return asset.toBuffer();
    }

    /**
     * Create Lease
     * 
     * @param {Context} ctx the transaction context
     * @param {String} leaseNumber the lease number of the lease
     * @param {String} lessee the Organization who receives the asset from the lease
     * @param {String} lessor the Organization who leases the asset to the lessee
     * @param {String} assetNumber asset number for the asset
     * @param {String} assetManufacturer manufacturer of the asset
     * @param {String} dateOfLease date the lease was created
     * @param {String} endOfLease date the lease will end
     * @param {Double} price price paid to lease asset
     * @param {Double} depositPaid deposit paid for lease
     * @param {String} assetType Type of asset
     */
    async createLease(ctx, leaseNumber, lessee, lessor, assetNumber, assetManufacturer, assetType, dateOfLease, endOfLease, price, depositPaid) {
        
        // Retrieve the current asset using key fields provided
        let assetKey = Asset.makeKey([assetManufacturer, assetNumber]);
        let asset = await ctx.assetList.getAsset(assetKey);

        // Create a new instance of the asset lease
        let assetLease = AssetLease.createInstance(leaseNumber, lessee, lessor, assetKey, assetType, dateOfLease, endOfLease, price, depositPaid);

        // set asset state as leased
        asset.setLeased();

        // Add the asset to the list of all similar commercial assets in the ledger world state
        await ctx.leaseList.addLease(assetLease);

        // Must return a serialized lease to caller of smart contract
        return assetLease.toBuffer();
    }

    /**
     * Transfer Asset 
     *
     * @param {Context} ctx the transaction context
     * @param {String} manufacturer manufacturer of the Asset
     * @param {String} assetNumber asset number for this asset     
     * @param {String} currentOwner current owner of the asset
     * @param {String} newOwner new owner of asset
    */
    async transferAsset(ctx, manufacturer, assetNumber, currentOwner, newOwner) {

        // Retrieve the current asset using key fields provided
        let assetKey = Asset.makeKey([manufacturer, assetNumber]);

        console.log(assetKey);

        let asset = await ctx.assetList.getAsset(assetKey);

        // Validate current owner
        if (asset.getOwner() !== currentOwner) {
            throw new Error('Asset ' + manufacturer + assetNumber + ' is not owned by ' + currentOwner);
        }

        // Check asset doesn't need repair
        if (!asset.needsRepair()) {

            // Set new owner in the Asset
            asset.setOwner(newOwner);

            // Update the asset
            await ctx.assetList.updateAsset(asset);

            // Must return a serialized asset to caller of smart contract
            return asset.toBuffer();

        } else {
            throw new Error('Asset ' + manufacturer + assetNumber + ' needs repair and cannot be delivered.');
        }




    }

    /**
     * Return Asset
     *
     * @param {Context} ctx the transaction context
     * @param {String} manufacturer manufacturer of the Asset
     * @param {String} assetNumber asset number for this asset
     * @param {String} currentOwner current owner of the asset
     * @param {String} lessor the person who leases the asset to the lessee
     * @param {String} leaseNumber lease number for the lease
     * @param {String} dateReturned date the asset was returned
    */
   async returnAsset(ctx, manufacturer, assetNumber, currentOwner, lessor, leaseNumber, dateReturned) {

    // Retrieve the current asset using key fields provided
    let assetKey = Asset.makeKey([manufacturer, assetNumber]);
    let asset = await ctx.assetList.getAsset(assetKey);

    // Retrieve the current lease using key fields provided
    let leaseKey = AssetLease.makeKey([lessor, leaseNumber]);
    let assetLease = await ctx.leaseList.getLease(leaseKey);

    // Validate current owner
    if (asset.getOwner() !== currentOwner) {
        throw new Error('Asset ' + manufacturer +":"+ assetNumber + ' is not owned by ' + currentOwner);
    }

    // Set owner back to lessor
    asset.setOwner(lessor);

    // Set date returned
    assetLease.setDateReturned(dateReturned);

    // Set assetState to In transit
    asset.setInspecting();
    
    // Update the asset
    await ctx.assetList.updateAsset(asset);

    // Update asset lease
    await ctx.leaseList.updateLease(assetLease);

    //  Must return a serialized lease to caller of smart contract
    return { "asset": asset, "assetLease": assetLease};
}

    /**
     * Update Asset Location
     *
     * @param {Context} ctx the transaction context
     * @param {String} manufacturer manufacturer of the asset
     * @param {String} assetNumber asset number for this asset
     * @param {String} location new location of the asset
    */
    async updateAssetLocation(ctx, assetKey, location) {

        // Retrieve the current asset using key fields provided
        let asset = await ctx.assetList.getAsset(assetKey);

        // Set new location of the asset
        asset.setLocation(location);

        // Update the asset
        await ctx.assetList.updateAsset(asset);

        //  Must return a serialized asset to caller of smart contract
        return asset.toBuffer();
    }

    /**
     * Inspect asset
     *
     * @param {Context} ctx the transaction context
     * @param {String} manufacturer manufacturer of the asset
     * @param {String} assetNumber asset number for this asset
     * @param {String} lessor the person who leases the asset to the lessee
     * @param {String} leaseNumber lease number for the lease
     * @param {Integer} percentDamaged amount of damage to asset when returned
    */
    async inspectAsset(ctx, manufacturer, assetNumber, lessor, leaseNumber, percentDamaged) {

        // Retrieve the current asset using key fields provided
        let assetKey = Asset.makeKey([manufacturer, assetNumber]);
        let asset = await ctx.assetList.getAsset(assetKey);

        // Retrieve the current lease using key fields provided
        let leaseKey = AssetLease.makeKey([lessor, leaseNumber]);
        let assetLease = await ctx.leaseList.getLease(leaseKey);

        // Set the percent damaged on the lease
        assetLease.setPercentDamaged(percentDamaged);

        if (assetLease.getPercentDamaged() > 0) {
            // Set the asset state to Repairing
            asset.setRepairing();

            // Set the asset condition to Needs Repair
            asset.setNeedsRepair();
        } else {
            asset.setAvailable();
            asset.setRefurbished();
        }

        // Update the lease
        await ctx.leaseList.updateLease(assetLease);

        // Update the asset
        await ctx.assetList.updateAsset(asset);

        //  Must return a serialized asset and lease to caller of smart contract
        return { "asset": asset, "assetLease": assetLease};
    }

    /**
     * Repair Asset
     *
     * @param {Context} ctx the transaction context
     * @param {String} manufacturer manufacturer of the asset
     * @param {String} assetNumber asset number for this asset
    */
    async repairAsset(ctx, manufacturer, assetNumber) {

        // Retrieve the current asset using key fields provided
        let assetKey = Asset.makeKey([manufacturer, assetNumber]);
        let asset = await ctx.assetList.getAsset(assetKey);

        // Set asset state to Available
        asset.setAvailable();

        // Set asset condition to Refurbished
        asset.setRefurbished();

        // Update asset
        await ctx.assetList.updateAsset(asset);

        //  Must return a serialized asset to caller of smart contract
        return asset.toBuffer();
    }

    /**
     * Return Deposit
     *
     * @param {Context} ctx the transaction context
     * @param {String} lessor lessor of the asset
     * @param {String} leaseNumber lease number for this lease
    */
    async returnDeposit(ctx, lessor, leaseNumber) {

        // Retrieve the current lease using key fields provided
        let leaseKey = AssetLease.makeKey([lessor, leaseNumber]);
        let assetLease = await ctx.leaseList.getLease(leaseKey);

        // Get the percent damage listed in the lease
        let damage = assetLease.getPercentDamaged();
        let depositPaid = await assetLease.getDepositPaid();
        console.log(depositPaid);
        console.log(damage);

        // Based on a percentage of damage, one of the following cases will determine 
        // how much of the deposit the lessee will get back.
        switch(true) {

            // less than 20% damage = 80% of deposit returned
            case damage<20:
                assetLease.setDepositReturned(depositPaid*.8);
                console.log(assetLease.getDepositReturned());
                break;

            // Greater than or equal to 20% damage & 
            // less than 40% damage = 60% of deposit returned
            case damage>=20 && damage<40:
                assetLease.setDepositReturned(depositPaid*.6);
                console.log(assetLease.getDepositReturned());
                break;

            // Greater than or equal to 40% damage & 
            // less than 60% damage = 40% of deposit returned
            case damage>=40 && damage<60:
                assetLease.setDepositReturned(depositPaid*.4);
                console.log(assetLease.getDepositReturned());
                break;

            // Greater than or equal to 60% damage & 
            // less than 80% damage = 20% of deposit returned            
            case damage>=60 && damage<80:
                assetLease.setDepositReturned(depositPaid*.2);
                console.log(assetLease.getDepositReturned());
                break;

            // Greater than or equal to 80% damage = 0% of deposit returned            
            case damage>=80:
                assetLease.setDepositReturned(0.0);
                console.log(assetLease.getDepositReturned());
                break;
        }

        // update lease
        await ctx.leaseList.updateLease(assetLease);

        // return lease to caller
        return assetLease.toBuffer();
    }

    /**
     * Destroy an Asset
     *
     * @param {Context} ctx the transaction context
     * @param {String} manufacturer manufacturer of the asset
     * @param {String} assetNumber asset number for this asset
    */
   async destroyAsset(ctx, manufacturer, assetNumber) {

        // Retrieve the current asset using key fields provided
        let assetKey = Asset.makeKey([manufacturer, assetNumber]);

        // Delete the Asset
        await ctx.assetList.deleteAsset(assetKey)
            .then(() => {
                console.log("Asset with assetKey: "+assetKey+" has been deleted.");
                return assetKey;
            });
    }

    // Query All assets in the ledger
    async queryAll(ctx) {

        // Query the state database with query string. An empty selector returns all documents.
        const iterator = await ctx.stub.getQueryResult('{ "selector": {} }');

        const allResults = [];

        // Loop through iterator and parse all results
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    /**
     * Query by field with value
     *
     * @param {Context} ctx the transaction context
     * @param {String} field field of the asset to be filtered by
     * @param {String} value value of the field being filtered
    */
    async queryByField(ctx, field, value) {

        // Query the state database with query string.
        // In the query string we pass in the field to filter by and the value of that field
        const iterator = await ctx.stub.getQueryResult('{ "selector": { "'+field+'": "'+value+'"} }');

        const allResults = [];

        // Loop through iterator and parse all results
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    // This transaction does initial demo set up
    async setUpDemo(ctx) {

        let assets = [];
        let leases = [];

        try {

            // Create all assets
            // Asset just manufactured
            assets[0] = Asset.createInstance("manufacturer1", "A-001", "asset");
            assets[0].setAvailable();
            assets[0].setNew();
            assets[0].setOwner("manufacturer1");

            // New asset in transit to vendor from manufacturer
            assets[1] = Asset.createInstance("manufacturer1", "A-002", "asset");
            assets[1].setLocation("Warehouse5");
            assets[1].setLeased();
            assets[1].setOwner("consumer1"); 
            assets[1].setNew();

            // Deployed asset leased to consumer1
            assets[2] = Asset.createInstance("manufacturer1", "A-003", "asset");
            assets[2].setLocation("6th street");
            assets[2].setLeased();
            assets[2].setOwner("consumer1"); 
            assets[2].setRefurbished();

            // Asset that has been returned and is currently being inspected
            assets[3] = Asset.createInstance("manufacturer1", "A-004", "asset");
            assets[3].setLocation("Inspection Warehouse2");
            assets[3].setInspecting();
            assets[3].setOwner("vendor1"); 
            assets[3].setNeedsRepair();

            // Create all leases for demo
            // Lease for asset A-002, in transit from vendor1 to consumer1
            leases[0] = AssetLease.createInstance("L-001", "consumer1", "vendor1", '"manufacturer1":"A-002"', "lease", "Jan2019", "Jan2021", 1000.00, 1000.00);

            // Lease for asset A-003, currently deployed
            leases[1] = AssetLease.createInstance("L-002", "consumer1", "vendor1", '"manufacturer1":"A-003"', "lease", "Jan2019", "Jan2021", 1000.00, 1000.00);

            // Lease for asset A-004, currently being returned to lessor
            leases[2] = AssetLease.createInstance("L-003", "consumer1", "vendor1", '"manufacturer1":"A-004"', "lease", "Jan2017", "Jan2019", 1000.00, 1000.00);
            leases[2].setDateReturned("Jan2019");

            // Add everything to the ledger
            await ctx.assetList.addAsset(assets[0]);
            await ctx.assetList.addAsset(assets[1]);
            await ctx.assetList.addAsset(assets[2]);
            await ctx.assetList.addAsset(assets[3]);

            await ctx.leaseList.addLease(leases[0]);
            await ctx.leaseList.addLease(leases[1]);
            await ctx.leaseList.addLease(leases[2]);

            console.log("Demo has been set up");

        } catch(e) {
            console.log(e.stack);
        }

    }

}

module.exports = AssetContract;
