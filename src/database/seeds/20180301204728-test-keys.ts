/* tslint:disable:object-literal-sort-keys */
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("bundleKeys", [{
      key: "bundleAKey",
      name: "sampleBundleA",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      key: "bundleBKey",
      name: "sampleBundleB",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }])
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("bundleKeys", null, {});
  }
};
