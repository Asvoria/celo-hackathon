// This script requires that you have already deployed HelloWorld.sol with Truffle
// Go back and do that if you haven't already

//Contract address deployed under remix ide
const contractAddress = '0x671858a270BbAFc8Ce039FCF8E00BEe8862a8C64'

// 1. Import web3 and contractkit 
const Web3 = require("web3")
const ContractKit = require('@celo/contractkit')

// 2. Import the getAccount function
const getAccount = require('./getAccount').getAccount

// 3. Init a new kit, connected to the alfajores testnet
const web3 = new Web3('https://alfajores-forno.celo-testnet.org')
const kit = ContractKit.newKitFromWeb3(web3)

// import contract json
const PINE = require('./contracts/artifacts/PINE.json')

// Initialize a new Contract interface
async function initContract(){
    // Check the Celo network ID
    const networkId = await web3.eth.net.getId();
    //const deployedNetwork = PINE.networks[networkId];
    

    //console.log('deployedNetwork.address',deployedNetwork.address)
    //deployedNetwork.address = contractAddress
    // Create a new contract instance with the HelloWorld contract info
    let instance = new web3.eth.Contract(
        PINE.abi,
        contractAddress
    );

    getName(instance)

}

// Read the 'name' stored in the HelloWorld.sol contract
async function getName(instance){
    let name = await instance.methods.name().call()
    console.log(name)
}


//Selling CELO only if the rate is favorable
// This is at lower price I will accept in cUSD for every CELO
const favorableAmount = 100
const amountToExchange = kit.web3.utils.toWei('10', 'ether')
const oneGold = kit.web3.utils.toWei('1', 'ether')
const exchange = await kit.contracts.getExchange()

const amountOfcUsd = await exchange.quoteGoldSell(oneGold)

if (amountOfcUsd > favorableAmount) {
  const goldToken = await kit.contracts.getGoldToken()
  const approveTx = await goldToken.approve(exchange.address, amountToExchange).send()
  const approveReceipt = await approveTx.waitReceipt()

  const usdAmount = await exchange.quoteGoldSell(amountToExchange)
  const sellTx = await exchange.sellGold(amountToExchange, usdAmount).send()
  const sellReceipt = await sellTx.waitReceipt()
}

const goldtoken = await kit._web3Contracts.getGoldToken()
const oneGold = kit.web3.utils.toWei('1', 'ether')

const txo = await goldtoken.methods.transfer(someAddress, oneGold)
const tx = await kit.sendTransactionObject(txo, { from: myAddress })
const hash = await tx.getHash()
const receipt = await tx.waitReceipt()

const stableToken = await this.contracts.getStableToken()
const exchange = await this.contracts.getExchange()

const cUsdBalance = await stableToken.balanceOf(myAddress)

const approveTx = await stableToken.approve(exchange.address, cUsdBalance).send()
const approveReceipt = await approveTx.waitReceipt()

const goldAmount = await exchange.quoteUsdSell(cUsdBalance)
const sellTx = await exchange.sellDollar(cUsdBalance, goldAmount).send()
const sellReceipt = await sellTx.waitReceipt()

/*
// Set the 'name' stored in the HelloWorld.sol contract
async function setName(instance, newName){
    let account = await getAccount()

    // Add your account to ContractKit to sign transactions
    // This account must have a CELO balance to pay tx fees, get some https://celo.org/build/faucet
    kit.connection.addAccount(account.privateKey)

    const amountToExchange = kit.web3.utils.toWei('10', 'ether')
    const oneGold = kit.web3.utils.toWei('1', 'ether')
    
    // Encode the transaction to HelloWorld.sol according to the ABI
    let txObject = await instance.methods.setName(newName)
    
    // Send the transaction
    let tx = await kit.sendTransactionObject(txObject, { from: account.address })

    let receipt = await tx.waitReceipt()
    console.log(receipt)
}
*/

initContract()
