/**
 * gRPC Server Setup
 * 
 * This module sets up and starts the gRPC server for the Product Service.
 * The gRPC server allows other services (like Order Service) to fetch
 * product information via gRPC instead of HTTP, providing better performance
 * for inter-service communication.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { GRPC_HOST, GRPC_PORT } from '../config/env.js';
import { handleGetProduct } from './handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../proto/product.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const productProto = grpc.loadPackageDefinition(packageDefinition).product;

/**
 * Starts the gRPC server
 * 
 * The server listens for gRPC requests and handles GetProduct RPC calls.
 * This allows Order Service to fetch product details efficiently.
 * 
 * @returns {grpc.Server} The started gRPC server instance
 */
export function startGrpcServer() {
  const server = new grpc.Server();
  
  server.addService(productProto.ProductService.service, {
    GetProduct: handleGetProduct
  });

  const address = `${GRPC_HOST}:${GRPC_PORT}`;

  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) {
      console.error('Failed to start product gRPC server:', err.message);
      return;
    }
    server.start();
    console.log(`Product gRPC server running on ${address}`);
  });

  return server;
}

