var PINE = artifacts.require("PINE")

module.exports = function(deployer) {
    await deployer.deploy(PINE)
}