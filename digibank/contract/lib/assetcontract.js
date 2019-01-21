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
    */
    async manufactureAsset(ctx, manufacturer, assetNumber) {

        // create an instance of the asset
        let asset = Asset.createInstance(manufacturer, assetNumber);

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
     */
    async createLease(ctx, leaseNumber, lessee, lessor, assetNumber, assetManufacturer, dateOfLease, endOfLease, price, depositPaid) {
        
        // Retrieve the current asset using key fields provided
        let assetKey = Asset.makeKey([assetManufacturer, assetNumber]);
        
        console.log(assetKey);

        let asset = await ctx.assetList.getAsset(assetKey);

        // Create a new instance of the asset lease
        let assetLease = AssetLease.createInstance(leaseNumber, lessee, lessor, assetKey, dateOfLease, endOfLease, price, depositPaid);

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

        console.log(asset.getOwner());
        console.log(currentOwner);
        console.log(assetKey);

        // Validate current owner
        if (asset.getOwner() !== currentOwner) {
            throw new Error('Asset ' + manufacturer + assetNumber + ' is not owned by ' + currentOwner);
        }

        // Check asset doesn't need repair
        if (!asset.needsRepair()) {

            // Set new owner in the Asset
            asset.setOwner(newOwner);

            console.log(asset.toString());


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
        throw new Error('Asset ' + manufacturer + assetNumber + ' is not owned by ' + currentOwner);
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

    //  Must return a serialized asset and lease to caller of smart contract
    return [asset.toBuffer(), assetLease.toBuffer()];
}


    /**
     * Update Asset Location
     *
     * @param {Context} ctx the transaction context
     * @param {String} manufacturer manufacturer of the asset
     * @param {String} assetNumber asset number for this asset
     * @param {String} location new location of the asset
    */
    async updateAssetLocation(ctx, manufacturer, assetNumber, location) {

        // Retrieve the current asset using key fields provided
        let assetKey = Asset.makeKey([manufacturer, assetNumber]);
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

        // TODO set conditional to see if asset needs repairing
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
        return [asset.toBuffer(), assetLease.toBuffer()];
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

        //  Must return a serialized asset and lease to caller of smart contract
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

        // Based on a percentage of damage, one of the following cases will determine 
        // how much of the deposit the lessee will get back.
        switch(damage) {

            // less than 20% damage = 80% of deposit returned
            case (damage<20):
                assetLease.setDepositReturned(assetLease.get(depositPaid*.8));
                break;

            // Greater than or equal to 20% damage & 
            // less than 40% damage = 60% of deposit returned
            case (damage>=20 && damage<40):
                assetLease.setDepositReturned(assetLease.get(depositPaid*.6));
                break;

            // Greater than or equal to 40% damage & 
            // less than 60% damage = 40% of deposit returned
            case (damage>=40 && damage<60):
                assetLease.setDepositReturned(assetLease.get(depositPaid*.4));
                break;

            // Greater than or equal to 60% damage & 
            // less than 80% damage = 20% of deposit returned            
            case (damage>=60 && damage<80):
                assetLease.setDepositReturned(assetLease.get(depositPaid*.2));
                break;

            // Greater than or equal to 80% damage = 0% of deposit returned            
            case (damage>=80):
                assetLease.setDepositReturned(0.0);
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

    // Update the asset
    let deletedAsset = await ctx.assetList.deleteAsset(assetKey);

    //  Must return a serialized asset to caller of smart contract
    return deletedAsset.toBuffer();
    }

}

module.exports = AssetContract;
