var PINE = artifacts.require("PINE")
var ERC20 = artifacts.require("ERC20")

module.exports = function(deployer) {
    deployer.deploy(ERC20);
    deployer.deploy(PINE);
}