require("dotenv").config();

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");

chai.use(chaiAsPromised);
chai.use(sinonChai);

global.expect = chai.expect;
global.proxyquire = require("proxyquire");
global.sinon = require("sinon");
