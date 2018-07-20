// api/currency-converter.js

const Axios = require("axios"); // Axios library for promisified fetch
BASE_URL = "https://free.currencyconverterapi.com/api/v6/";

module.exports = {
  /**
   * Get the rate exchange
   * @param {*} source
   * @param {*} destination
   */
  getRate(source, destination) {
    query = `${source}_${destination}`;
    return Axios.get(`${BASE_URL}convert?q=${query}&compact=ultra`);
  }
};
