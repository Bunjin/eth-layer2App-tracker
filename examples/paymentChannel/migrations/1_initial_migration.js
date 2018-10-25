var Migrations = artifacts.require("./Migrations.sol");
var PaymentChannel = artifacts.require("./PaymentChannel.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(PaymentChannel);
};
