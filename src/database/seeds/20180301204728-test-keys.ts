/* tslint:disable:object-literal-sort-keys */
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("bundleKeys", [{
      key: "bundleAKey",
      name: "sampleBundle",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }])
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("bundleKeys", null, {});
  }
};
