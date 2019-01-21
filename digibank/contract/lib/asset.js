/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('../ledger-api/state.js');


// TODO Add descriptions
/*
Asset
- manufacturer
- assetNumber
- currentOwner
- currentState
- condition
- location
*/

// status in terms of leasing
// Enumerate asset state values
const assetState = {
    AVAILABLE: 1,
    LEASED: 2,
    INSPECTING: 3,
    REPAIRING: 4
};

// Enumerate asset condition values
const condition = {
    NEW: 1,
    REFURBISHED: 2,
    NEEDS_REPAIR: 3
}

/**
 * Asset class extends State class
 * Class will be used by application and smart contract to define an asset
 */
class Asset extends State {

    constructor(obj) {
        super(Asset.getClass(), [obj.manufacturer, obj.assetNumber]);
        Object.assign(this, obj);
    }

    /**
     * Basic getters and setters
    */
    getOwner() {
        return this.currentOwner;
    }

    setOwner(newOwner) {
        this.currentOwner = newOwner;
    }

    getManufacturer() {
        return this.manufacturer;
    }

    setManufacturer(manufacturer) {
        this.manufacturer = manufacturer;
    }

    getCurrentState() {
        return this.currentState;
    }

    getLocation() {
        return this.location;
    }

    setLocation(location) {
        this.location = location;
    }

    /**
     * Useful methods to encapsulate asset states
     */

    setAvailable() {
        this.currentState = assetState.AVAILABLE;
    }

    setLeased() {
        this.currentState = assetState.LEASED;
    }

    setRepairing() {
        this.currentState = assetState.REPAIRING;
    }

    setInspecting() {
        this.currentState = assetState.INSPECTING;
    }

    isAvailable() {
        return this.currentState === assetState.AVAILABLE;
    }

    isLeased() {
        return this.currentState === assetState.LEASED;
    }

    isRepairing() {
        return this.currentState === assetState.REPAIRING;
    }

    isNew() {
        return this.condition === condition.NEW;
    }

    isRefurbished() {
        return this.condition === condition.REFURBISHED;
    }

    needsRepair() {
        return this.condition === condition.NEEDS_REPAIR;
    }

    setNew() {
        this.condition = condition.NEW;
    }

    setRefurbished() {
        this.condition = condition.REFURBISHED;
    }

    setNeedsRepair() {
        this.condition = condition.NEEDS_REPAIR;
    }

    

    static fromBuffer(buffer) {
        return Asset.deserialize(Buffer.from(JSON.parse(buffer)));
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to commercial paper
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, Asset);
    }

    /**
     * Factory method to create a commercial paper object
     */
    static createInstance(manufacturer, assetNumber) {

        let newAsset = new Asset({ manufacturer, assetNumber});
        return newAsset;
    }

    static getClass() {
        return 'org.examplenet.asset';
    }
}

module.exports = Asset;