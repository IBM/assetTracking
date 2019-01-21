/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('../ledger-api/statelist.js');

const AssetLease = require('./assetLease.js');

class AssetList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.examplenet.leaselist');
        this.use(AssetLease);
    }

    async addLease(assetLease) {
        return this.addState(assetLease);
    }

    async getLease(assetLeaseKey) {
        return this.getState(assetLeaseKey);
    }

    async updateLease(assetLease) {
        return this.updateState(assetLease);
    }
}


module.exports = AssetList;