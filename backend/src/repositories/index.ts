/**
 * Repository wiring: MySQL when a database is configured (env.dataSource === "database"), otherwise the mock data.
 */
import { env } from "../config/env.js";
import {
  mockCustomerRepository,
  mockProductRepository,
  mockServiceRequestRepository,
  mockSupportRepository,
  mockWarrantyRegistrationRepository,
  mockWarrantyRepository,
  mockSerialNumberRepository,
} from "./mock/index.js";
import {
  mysqlCustomerRepository,
  mysqlProductRepository,
  mysqlServiceRequestRepository,
  mysqlSupportRepository,
  mysqlWarrantyRegistrationRepository,
  mysqlWarrantyRepository,
  mysqlSerialNumberRepository,
} from "./mysql/index.js";


const useDatabase = env.dataSource === "database";

export const repositories = {
  products: useDatabase ? mysqlProductRepository : mockProductRepository,
  customers: useDatabase ? mysqlCustomerRepository : mockCustomerRepository,
  warranties: useDatabase ? mysqlWarrantyRepository : mockWarrantyRepository,
  support: useDatabase ? mysqlSupportRepository : mockSupportRepository,
  serviceRequests: useDatabase ? mysqlServiceRequestRepository : mockServiceRequestRepository,
  warrantyRegistrations: useDatabase ? mysqlWarrantyRegistrationRepository : mockWarrantyRegistrationRepository,
serialNumbers: useDatabase ? mysqlSerialNumberRepository : mockSerialNumberRepository,};

export type Repositories = typeof repositories;
