'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert("environmentVersions", [{
      namespace: "sampleBundle",
      name: "sampleBundle.A",
      version: "0.1.2",
      latest: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      namespace: "sampleBundle",
      name: "sampleBundle.A.B",
      version: "0.1.1",
      latest: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }], {});

    const bundleAId = await queryInterface.rawSelect("environmentVersions", {
      where: {
        name: "sampleBundle.A",
        version : "0.1.2"
      }
    }, ["id"]);

    const bundleABId = await queryInterface.rawSelect("environmentVersions", {
      where: {
        name: "sampleBundle.A.B",
        version : "0.1.1"
      }
    }, ["id"]);

    return queryInterface.bulkInsert("bundleManifests", [{
      environmentVersionId: bundleAId,
      type: "env",
      hash: "bundleAehashenv",
      crc: "bundleAecrc",
      uri: "bundleAeuri",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      environmentVersionId: bundleAId,
      type: "dll",
      hash: "bundleAdhashdll",
      crc: "bundleAdcrc",
      uri: "bundleAduri",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      environmentVersionId: bundleABId,
      type: "env",
      hash: "bundleABehash",
      crc: "bundleABecrc",
      uri: "bundleABeuri",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }, {
      environmentVersionId: bundleABId,
      type: "dll",
      hash: "bundleABdhash",
      crc: "bundleABdcrc",
      uri: "bundleABduri",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }], {});

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("environmentVersions", null, {});
  }
};
