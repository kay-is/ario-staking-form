import { useState } from "react"
import * as contractClient from "./contractClient"

function App() {
  const [loading, setLoading] = useState("")
  const [address, setAddress] = useState("")
  const [ioBalance, setIoBalance] = useState(0)
  const [stakingAmount, setStakingAmount] = useState(100)

  const connectWallet = async () => {
    setLoading("Loading wallet address...")
    const address = await contractClient.getAddress()
    setAddress(address)

    setLoading("Loading IO token balance...")
    try {
      const balance = await contractClient.getBalance()
      setIoBalance(Math.floor(balance))
      setLoading("")
    } catch (e: any) {
      console.error(e)
      setLoading("")
    }
  }

  const delegateStake = async () => {
    setLoading("Submitting staking transaction...")
    try {
      await contractClient.delegateStake(stakingAmount)
      setLoading("Staking Transaction submitted successfully!")
    } catch (e: any) {
      console.error(e)
      setLoading("")
    }
  }

  let content: JSX.Element

  if (loading !== "") {
    content = <p>{loading}</p>
  } else if (address === "") {
    content = <button onClick={connectWallet}>Connect Wallet</button>
  } else {
    content = (
      <>
        <h2>
          Connected Address <pre>{address}</pre>
        </h2>
        <h2>
          IO Token Balance <pre>{ioBalance} IO</pre>
        </h2>
        <h2>
          Staking Amount
          <br />
          <input
            type="range"
            min="100"
            max={ioBalance}
            value={stakingAmount}
            onChange={(e) => setStakingAmount(+e.currentTarget.value)}
            disabled={!ioBalance}
          />
          <pre>{stakingAmount} IO</pre>
        </h2>
        <button onClick={delegateStake} disabled={!ioBalance}>
          Delegate Stake
        </button>
      </>
    )
  }

  return (
    <div>
      <h1>Delegate AR.IO Gateway Staking</h1>
      {content}
    </div>
  )
}

export default App
