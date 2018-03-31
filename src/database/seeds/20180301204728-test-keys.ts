/* tslint:disable:object-literal-sort-keys */
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("environmentNamespaces", [{
      key: "bundleAKey",
      namespace: "sampleBundle",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }])
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("bundleKeys", null, {});
  }
};
