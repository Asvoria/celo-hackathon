var HelloWorld = artifacts.require("PINE")

module.exports = function(deployer) {
    await deployer.deploy(pine_v0)
}