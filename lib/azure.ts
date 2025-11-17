import { BlobServiceClient } from '@azure/storage-blob'

export function getBlobClient() {
  const conn = process.env.AZURE_BLOB_CONNECTION_STRING
  if (!conn) return null
  return BlobServiceClient.fromConnectionString(conn)
}

export async function uploadBuffer(containerName: string, blobName: string, data: Buffer) {
  const svc = getBlobClient()
  if (!svc) throw new Error('Azure blob not configured')
  const container = svc.getContainerClient(containerName)
  await container.createIfNotExists()
  const block = container.getBlockBlobClient(blobName)
  await block.uploadData(data, { blobHTTPHeaders: { blobContentType: 'application/octet-stream' } })
  return block.url
}

