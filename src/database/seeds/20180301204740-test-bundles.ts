/* tslint:disable:object-literal-sort-keys */
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("bundleVersions", [{
      name: "sampleBundleA",
      hash: "sampleBundleHashA1",
      version: "0.1.1",
      latest: false,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      name: "sampleBundleA",
      hash: "sampleBundleHashA2",
      version: "0.1.2",
      latest: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      name: "sampleBundleB",
      hash: "sampleBundleHashB1",
      version: "0.1.1",
      latest: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("bundleVersions", null, {});
  }
};
