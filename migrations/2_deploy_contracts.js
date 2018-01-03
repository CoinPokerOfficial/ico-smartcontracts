var token = artifacts.require("./CoinPokerToken.sol");
var ico = artifacts.require("./CoinPokerICO.sol");

module.exports = function(deployer) {
    const owner = "0x376c9fde9555e9a491c4cd8597ca67bb1bbf397e";
    const wallet = "0xcb88efbfb68a1e6d8a4b0bcf504b6bb6bd623444";
    const preico = "0xcb88efbfb68a1e6d8a4b0bcf504b6bb6bd623444";
    const tournaments = "0x0cbe666498dd2bb2f85b644b5f882e4136ac9558";
    const cashier = "0x2258128f5c99124aaeb4d65842dcf1796199df16";
    
    deployer.deploy(token, owner, preico, tournaments, cashier).then(function(){
                                                  return deployer.deploy(ico,
                                                                         token.address,
                                                                         wallet,
                                                                         owner
                                                                         )
                                                  });
  
   
};
