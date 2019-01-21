/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('../ledger-api/state.js');

/*
Asset lease
- leaseNumber - Lease agreement number
- lessee - Who is receiving the lease
- lessor - Who is leasing the asset out
- assetKey - The key of the asset being leased
- dateLeased - The date the lease goes into effect
- endOfLease - The end of the lease agreement
- price - The total price of the lease payments
- deposit paid - The deposit paid up front
- dateReturned - The date the asset was returned
- percentDamaged - The condition of the asset on return displayed in percent damaged
- deposit returned - Based on the ammount of damage, the amount of the deposit returned
*/


/**
 * Asset class extends State class
 * Class will be used by application and smart contract to define an assetLease
 */
class AssetLease extends State {

    constructor(obj) {
        super(AssetLease.getClass(), [obj.lessor, obj.leaseNumber]);
        Object.assign(this, obj);
    }

    /**
     * Basic getters and setters
    */
    getLeaseNumber() {
        return this.leaseNumber;
    }

    getLessor() {
        return this.getLessor;
    }

    getAssetKey() {
        return this.assetKey;
    }

    setAssetKey(assetKey) {
        this.assetKey = assetKey;
    }

    getDateLeased() {
        return this.dateLeased;
    }

    getEndOfLease() {
        return this.endOfLease;
    }

    getDateReturned() {
        return this.dateReturned;
    }

    setDateReturned(dateReturned) {
        this.dateReturned = dateReturned;
    }

    getPrice() {
        return this.price;
    }

    setPrice(price) {
        this.price = price;
    }

    getDepositPaid() {
        return this.depositPaid;
    }

    getPercentDamaged() {
        return this.percentDamaged;
    }

    setPercentDamaged(condition) {
        this.percentDamaged = condition;
    }

    getDepositReturned() {
        return this.depositReturned;
    }

    setDepositReturned(deposit) {
        this.depositReturned = deposit;
    }

    getOrderStatus() {
        return this.orderStatus;
    }

    static fromBuffer(buffer) {
        return AssetLease.deserialize(Buffer.from(JSON.parse(buffer)));
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to an asset lease
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, AssetLease);
    }

    /**
     * Factory method to create an asset lease object
     */
    static createInstance(leaseNumber, lessee, lessor, assetKey, assetType, dateLeased, endOfLease, price, depositPaid) {
        let newAssetLease = new AssetLease({ lessor, leaseNumber});
        newAssetLease.lessee = lessee;
        newAssetLease.assetKey = assetKey;
        newAssetLease.assetType = assetType;
        newAssetLease.dateLeased = dateLeased;
        newAssetLease.endOfLease = endOfLease;
        newAssetLease.price = price;
        newAssetLease.depositPaid = depositPaid;
        return newAssetLease;
    }

    static getClass() {
        return 'org.examplenet.assetlease';
    }
}

module.exports = AssetLease;