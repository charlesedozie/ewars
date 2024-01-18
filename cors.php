import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import { typeDefs, resolvers } from './schema';

import cors from 'cors';


const app = express();
const httpServer = http.createServer(app);
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use(
  '/graphql',
  
  cors<cors.CorsRequest>({ origin: ['https://www.your-app.example', 'https://studio.apollographql.com'] }),
  
  express.json(),
  expressMiddleware(server),
);

await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));
console.log(`?? Server ready at http://localhost:4000/graphql`);