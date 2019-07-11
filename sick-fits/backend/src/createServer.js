const { GraphQLServer } = require("graphql-yoga");
const Mutation = require("./resolvers/Mutation");
const Query = require("./resolvers/Query");
const db = require("./db");

console.log(__dirname + "/schema.graphql");
// Create the GraphQL Yoga Server

function createServer() {
  return new GraphQLServer({
    typeDefs: __dirname + "/schema.graphql", //"src/schema.graphql",
    resolvers: {
      Mutation, //es syntax the same as Mutation:Mutation
      Query //es syntax the same as Query:Query
    },
    resolverValidationOptions: {
      requireResolversForResolveType: false
    },
    context: req => ({ ...req, db })
  });
}

module.exports = createServer;
