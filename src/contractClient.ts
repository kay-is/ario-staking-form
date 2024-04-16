import Arweave from "arweave"
import { Tag } from "arweave/node/lib/transaction"
// @ts-expect-error RC doesn't have types
import { EvaluationManifest, WarpFactory } from "warp-contracts"

const CONTRACT_TX_ID = "bLAgYxAdX2Ry-nt6aH2ixgvJXbpsEYm28NgJgyqfs-U"
const GATEWAY_ADDRESS = "lk2W8J5mj9JDpl22p1WMC05gD7EqWJZbbAgOAswC9xk"

const arweave = new Arweave({ host: "ar-io.dev", port: 443, protocol: "https" })

export const getAddress = async (): Promise<string> => {
  const wallet = await getWallet()
  if (!wallet) {
    alert("No Arweave wallet found!")
    return ""
  }
  return await wallet.getActiveAddress()
}

export const getBalance = async (): Promise<number> => {
  const wallet = await getWallet()
  if (!wallet) {
    alert("No Arweave wallet found!")
    return 0
  }
  const target = await wallet.getActiveAddress()
  const contract = await loadContract()
  const result = await contract.viewState({ function: "balance", target })

  console.log(result)

  return result.result.balance / 1_000_000
}

export const delegateStake = async (stakingAmount: number) => {
  const wallet = await getWallet()
  if (!wallet) return alert("No Arweave wallet found!")

  console.log("Initializing contract...")
  const contract = (await loadContract()).connect(wallet)

  console.log("Dry-writing interaction...")
  const dryWrite = await contract.dryWrite({
    function: "delegateStake",
    qty: stakingAmount,
    target: GATEWAY_ADDRESS,
  })

  if (dryWrite.type === "error" || dryWrite.errorMessage)
    return console.error("Failed to delegate stake:", dryWrite.errorMessage)

  console.log("Writing interaction...")
  const txId = await contract.writeInteraction(
    {
      function: "delegateStake",
      qty: stakingAmount,
      target: GATEWAY_ADDRESS,
    },
    { disableBundling: true }
  )

  console.log(txId)
}

async function getWallet() {
  const wallet = window.arweaveWallet
  await wallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION"])
  return wallet
}

async function loadContract() {
  const { evaluationOptions = {} } = await getContractManifest(CONTRACT_TX_ID)
  const warpFactory = WarpFactory.forMainnet()
  return await warpFactory
    .contract(CONTRACT_TX_ID)
    .setEvaluationOptions(evaluationOptions)
    .syncState(`https://api.arns.app/v1/contract/${CONTRACT_TX_ID}`, {
      validity: true,
    })
}

async function getContractManifest(
  contractTxId: string
): Promise<EvaluationManifest> {
  const { tags: encodedTags = [] } = await arweave.transactions
    .get(contractTxId)
    .catch(() => ({ tags: [] }))
  const decodedTags = tagsToObject(encodedTags)
  const contractManifestString = decodedTags["Contract-Manifest"] ?? "{}"
  const contractManifest = JSON.parse(contractManifestString)
  return contractManifest
}

function tagsToObject(tags: Tag[]): {
  [x: string]: string
} {
  return tags.reduce((decodedTags: { [x: string]: string }, tag) => {
    const key = tag.get("name", { decode: true, string: true })
    const value = tag.get("value", { decode: true, string: true })
    decodedTags[key] = value
    return decodedTags
  }, {})
}
