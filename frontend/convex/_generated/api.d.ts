/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts_smartAccounts from "../accounts/smartAccounts.js";
import type * as agentCards_agentCards from "../agentCards/agentCards.js";
import type * as agentCards_service from "../agentCards/service.js";
import type * as apiKeys_apiKeys from "../apiKeys/apiKeys.js";
import type * as apiRequestLogs_apiRequestLogs from "../apiRequestLogs/apiRequestLogs.js";
import type * as apiService_service from "../apiService/service.js";
import type * as auth from "../auth.js";
import type * as contacts_contacts from "../contacts/contacts.js";
import type * as integrations_integrations from "../integrations/integrations.js";
import type * as lib_apiKeys from "../lib/apiKeys.js";
import type * as lib_auth from "../lib/auth.js";
import type * as transactions_transactions from "../transactions/transactions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "accounts/smartAccounts": typeof accounts_smartAccounts;
  "agentCards/agentCards": typeof agentCards_agentCards;
  "agentCards/service": typeof agentCards_service;
  "apiKeys/apiKeys": typeof apiKeys_apiKeys;
  "apiRequestLogs/apiRequestLogs": typeof apiRequestLogs_apiRequestLogs;
  "apiService/service": typeof apiService_service;
  auth: typeof auth;
  "contacts/contacts": typeof contacts_contacts;
  "integrations/integrations": typeof integrations_integrations;
  "lib/apiKeys": typeof lib_apiKeys;
  "lib/auth": typeof lib_auth;
  "transactions/transactions": typeof transactions_transactions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
