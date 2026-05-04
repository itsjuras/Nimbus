import {
  getClientsByCompany,
  getClientById,
  createClient as createClientQuery,
  updateClient as updateClientQuery,
  deleteClient as deleteClientQuery,
} from '../db/queries/clients.js'
import { AppError } from '../middleware/errorHandler.js'
import type { Client, CreateClientRequest, UpdateClientRequest } from '@nimbus/shared'

export async function listClients(companyId: string): Promise<Client[]> {
  return getClientsByCompany(companyId)
}

export async function getClient(id: string, companyId: string): Promise<Client> {
  const client = await getClientById(id, companyId)
  if (!client) throw new AppError('CLIENT_NOT_FOUND', 'No client found with that ID', 404)
  return client
}

export async function createClient(
  companyId: string,
  input: CreateClientRequest,
): Promise<Client> {
  return createClientQuery(companyId, input)
}

export async function updateClient(
  id: string,
  companyId: string,
  input: UpdateClientRequest,
): Promise<Client> {
  const client = await updateClientQuery(id, companyId, input)
  if (!client) throw new AppError('CLIENT_NOT_FOUND', 'No client found with that ID', 404)
  return client
}

export async function deleteClient(id: string, companyId: string): Promise<void> {
  const exists = await getClientById(id, companyId)
  if (!exists) throw new AppError('CLIENT_NOT_FOUND', 'No client found with that ID', 404)
  await deleteClientQuery(id, companyId)
}
