const stripe = require("stripe");
const config = stripe(process.env.STRIPE_SECRET);

module.exports = config;
