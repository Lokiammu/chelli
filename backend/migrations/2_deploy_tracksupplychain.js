const TrackSupplyChain = artifacts.require("TrackSupplyChain");

module.exports = function (deployer) {
  deployer.deploy(TrackSupplyChain);
};
