/**
 * gRPC Server Setup
 * 
 * This module sets up and starts the gRPC server for the Order Service.
 * The gRPC server allows other services (like Product Service) to communicate
 * with the Order Service via gRPC instead of HTTP, providing better performance
 * for inter-service communication.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { GRPC_HOST, GRPC_PORT } from '../config/env.js';
import { handleDeleteOrdersByProduct } from './handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../proto/order.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const orderProto = grpc.loadPackageDefinition(packageDefinition).order;

/**
 * Starts the gRPC server
 * 
 * The server listens for gRPC requests and handles DeleteOrdersByProduct RPC calls.
 * This allows Product Service to delete orders efficiently.
 * 
 * @returns {grpc.Server} The started gRPC server instance
 */
export function startGrpcServer() {
  const server = new grpc.Server();
  
  server.addService(orderProto.OrderService.service, {
    DeleteOrdersByProduct: handleDeleteOrdersByProduct
  });

  const address = `${GRPC_HOST}:${GRPC_PORT}`;

  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) {
      console.error('Failed to start order gRPC server:', err.message);
      return;
    }
    server.start();
    console.log(`Order gRPC server running on ${address}`);
  });

  return server;
}

