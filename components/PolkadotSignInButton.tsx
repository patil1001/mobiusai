"use client"
import { signIn } from 'next-auth/react'

export default function PolkadotSignInButton() {
  const onClick = async () => {
    const { web3Enable, web3Accounts, web3FromAddress } = await import('@polkadot/extension-dapp')
    const { stringToU8a, u8aToHex } = await import('@polkadot/util')
    const exts = await web3Enable('MobiusAI')
    if (!exts.length) { alert('Install Polkadot{.js} extension.'); return }
    const accounts = await web3Accounts()
    if (!accounts.length) { alert('No accounts found'); return }
    const address = accounts[0].address
    const res = await fetch(`/api/polka/nonce?address=${encodeURIComponent(address)}`)
    const { challenge } = await res.json()
    const injector = await web3FromAddress(address)
    const signer: any = injector?.signer
    if (!signer || typeof signer.signRaw !== 'function') {
      alert('Selected account cannot sign raw payloads.');
      return
    }
    // Sign the hex-encoded bytes of the challenge for consistency with server verification
    const hexData = u8aToHex(stringToU8a(challenge))
    const { signature } = await signer.signRaw({ address, data: hexData, type: 'bytes' })
    await signIn('polkadot', { address, challenge, signature, callbackUrl: '/dashboard' })
  }
  return (
    <button type="button" onClick={onClick} className="w-full px-4 py-3 rounded-md border border-white/15">Sign in with Polkadot</button>
  )
}

