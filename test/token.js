let utils = require('./utils.js')

let token = artifacts.require("./CoinPokerToken.sol");
let instance;
let totalSupply = 500000000e18;
let init_time = 1508594400;
let start = 1518440400; // Time after ICO, when tokens may be transferred. Monday, 12 February 2018 13:00:00
let tokensForSaleTotal = 375000000e18; // 75%
let tokensPreICO = 100000000e18; // 20%
let tokensICO = 275000000e18; //55%
let reserved = 125000000e18; // 25%
let tournaments_reserve_max = 75000000e18; // 25%
let team_reserve = 50000000e18; // 25%
let owner = "0x376c9fde9555e9a491c4cd8597ca67bb1bbf397e";

contract('token', accounts => {
         
         before(async() => {
                instance = await token.deployed();
        });
         
         it("test initialization", async() => {
            await instance.setCurrent(init_time);
            let balance = await instance.balances.call(accounts[0]);
            assert.equal(balance, totalSupply, 'totalSupply');
            let bal = await instance.balances.call(accounts[1]);
            assert.equal(bal, 0, 'balance');
            let allowance = await instance.allowed.call(accounts[0], accounts[1]);
            assert.equal(allowance, 0, 'allowed');
            let startTime = await instance.startTime.call();
            assert.equal(startTime, start, 'time');
        });
         
         it("test token allowence: should allow acc1 to spend 10k CHP", async() => {
            let result = await instance.approve(accounts[1], 10000e18);
            let event = result.logs[0].args;
            assert.equal(event._owner, accounts[0]);
            assert.equal(event.spender, accounts[1]);
            assert.equal(event.value, 10000e18);
            let allowed = await instance.allowed.call(accounts[0], accounts[1]);
            assert.equal(allowed, 10000e18);
        });
         
         it("test token allowence: should fail to set allowance to 20k CHP", async() => {
            try {
                let result = await instance.approve(accounts[1], 20000e18);
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
            } catch (error) {
            }
        });
         
         it("test token allowence: should set allowance to 0 CHP", async() => {
            await instance.approve(accounts[1], 0);
            let allowed = await instance.allowed.call(accounts[0], accounts[1]);
            assert.equal(allowed, 0);
        });
         
         it("test token allowence: should set allowance to 20k CHP", async() => {
            await instance.approve(accounts[1], 20000e18);
            let allowed = await instance.allowed.call(accounts[0], accounts[1]);
            assert.equal(allowed.toNumber(), 20000e18);
        });
         
         it("test token transfering: should transfer 20k CHP from the owner to acc1", async() => {
            let result = await instance.transferFrom(accounts[0], accounts[1], 20000e18, {from: accounts[1]});
            let event = result.logs[0].args;
            assert.equal(event.from, accounts[0]);
            assert.equal(event.to, accounts[1]);
            assert.equal(event.value, 20000e18);
            let balance = await instance.balances(accounts[1]);
            assert.equal(balance, 20000e18);
            let bal = await instance.balances(accounts[0]);
            assert.equal(bal, totalSupply - 20000e18);
            let allowance = await instance.allowed(accounts[0], accounts[1]);
            assert.equal(allowance, 0);
        });
         
         it("test token transfering: should fail to transfer more funds to acc1 because of missing allowance", async() => {
            try {
                let result = await instance.transferFrom(accounts[0], accounts[1], 20000e18, {from: accounts[1]});
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
                } catch (error) {
                }
        });
         
         it("test token transfering: should fail to transfer from acc1, because trading not yet enabled", async() => {
            try {
                let result = await instance.transfer(accounts[2], 5000e18, {from: accounts[1]});
            throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
            } catch (error) {
                try {
                    let result = await instance.transferFrom(accounts[1], accounts[2], 5000e18, {from: accounts[1]});
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
                } catch (err) {
                }
            }
        });
         
         it("test token burning: should fail to burn tokens because too early", async() => {
            let result = await instance.burn();
            assert.equal(result.logs.length, 0);//no Burn event
            let supply = await instance.totalSupply.call();
            assert.equal(supply, totalSupply);
        });
         
         it("test token transfering: should transfer from acc1 to acc2", async() => {
            // insreasing time - simulating ico is over
            await instance.setCurrent(start);
            let result = await instance.transfer(accounts[2], 10000e18, {from: accounts[1]});
            var event = result.logs[0].args;
            assert.equal(event.from, accounts[1]);
            assert.equal(event.to, accounts[2]);
            assert.equal(event.value,10000e18);
            let balance = await instance.balances(accounts[2]);
            assert.equal(balance.toNumber(),10000e18);
            let bal = await instance.balances(accounts[1]);
            assert.equal(bal.toNumber(),10000e18);
        });
         
         it("test token transfering: should fail to transfer from acc1 because of insufficient funds", async() => {
            try {
                let result = await instance.transfer(accounts[2], 60000e18, {from: accounts[1]});
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
            } catch (error) {
            }
        });
         
         it("test token burning: should burn all of the owner's tokens but the reserved amount", async() => {
            await instance.setCurrent(start+10);
            let result = await instance.burn();
            let event = result.logs[0].args;
            
            let tokens_sold = 20000e18 + tokensPreICO;
            let tournament_amount = ((tournaments_reserve_max / 1e18) * ((tokens_sold / 1e18) / (tokensForSaleTotal / 1e18) )) * 1e18;
            let tournaments_burned = tournaments_reserve_max - tournament_amount;
            
            //console.log('tokens_sold:' + tokens_sold);
            //console.log('tournament_amount:' + tournament_amount);
            //console.log('tournaments_burned:' + tournaments_burned);
            //console.log('burned in smart contract:' + event.amount.toNumber() );
            
            // check reserves
            // for team
            let team_balance = await instance.balances.call(accounts[0]);
            assert.equal(team_balance.toNumber(), team_reserve, 'incorrect team reserve balance');
            //console.log('team_reserve' + team_reserve);
    
            // for pre-ico
            let pre_ico_balance = await instance.balances.call(accounts[8]);
            assert.equal(pre_ico_balance.toNumber(), tokensPreICO, 'incorrect pre ico balance');
            //console.log('pre_ico_balance' + pre_ico_balance);
    
            // for tournaments
            let tournaments_balance = await instance.balances.call(accounts[7]);
            assert.equal(tournaments_balance.toNumber(), tournament_amount, 'incorrect tournaments reserve');
            //console.log('tournaments_balance' + tournaments_balance);
            
            // burned = all_token_in_ico - (acc1+acc2) tokens + tournaments_burned
            assert.equal(event.amount.toNumber(), (tokensICO / 1e18 - 20000e18 / 1e18 + tournaments_burned / 1e18) * 1e18, 'burned');
            
            // check total supply
            //total_supply_left = team_reserve + tournament_amount + (acc1+acc2) tokens
            let supply = await instance.totalSupply.call();
            assert.equal(supply.toNumber(), (team_reserve / 1e18 + tournament_amount / 1e18 + tokens_sold / 1e18) * 1e18, 'suppply');
        });
         
         it("test token burning: call burn a second time. should do nothing", async() => {
            let result = await instance.burn();
            assert.equal(result.logs.length, 0);//no Burn event
        });
         
         it("test token reservation: should spend a few tokens from reserved", async() => {
            await instance.transfer(accounts[6], 25000000e18);
            let bal = await instance.balances.call(accounts[6]);
            assert.equal(bal.toNumber(),25000000e18);
        });
         
         it("test token reservation: should fail to spend the more then reserved tokens", async() => {
            try {
                let result = await instance.transfer(accounts[6], 30000000e18, {from: owner}); // total 50million,  25million already transfered
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
            } catch (error) {
                let bal = await instance.balances.call(accounts[6]);
                assert.equal(bal.toNumber(), 25000000e18); // should be still 50million, because we tried to transfer more then reserved
            }
        });
});


